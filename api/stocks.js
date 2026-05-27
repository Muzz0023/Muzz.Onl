// /api/stocks.js
// Live stock prices via Yahoo Finance — global coverage (US, ASX, LSE, TSX, etc.)
// Input:  POST { tickers: ["HSY", "REH.AX", "HSBA.L"] }
// Output: { prices: { TICKER: { c, h, l, o, pc, t } } }
// Same response shape as the old Finnhub version, so the frontend doesn't change.

// Common Australian-listed tickers — auto-append .AX so users can just type "REH" or "CBA".
// Add more here as you build out your watchlist.
const ASX_TICKERS = new Set([
  'REH', 'CBA', 'BHP', 'CSL', 'NAB', 'WBC', 'ANZ', 'WES', 'WOW', 'TLS',
  'VAS', 'VGS', 'VHY', 'VTS', 'VEU', 'IVV', 'NDQ', 'A200', 'STW',
  'FMG', 'RIO', 'WDS', 'STO', 'QAN', 'MQG', 'TCL', 'GMG', 'COL', 'JBH',
  'NXT', 'XRO', 'WTC', 'CAR', 'REA', 'SEK', 'ALL', 'COH', 'RMD', 'SHL',
]);

// Normalize a user-typed ticker to its full Yahoo Finance symbol.
//   HSY      -> HSY        (US, no suffix needed)
//   REH      -> REH.AX     (known ASX ticker, auto-append)
//   REH.AX   -> REH.AX     (already qualified, leave alone)
//   HSBA.L   -> HSBA.L     (already qualified)
function normalizeTicker(rawTicker) {
  const t = String(rawTicker || '').trim().toUpperCase();
  if (!t) return '';
  // Already has an exchange suffix (anything with a dot)
  if (t.includes('.')) return t;
  // Known ASX ticker → append .AX
  if (ASX_TICKERS.has(t)) return `${t}.AX`;
  // Default: assume US
  return t;
}

async function fetchYahooQuote(symbol) {
  // Yahoo's chart endpoint is the most reliable free, unauthenticated way to grab a quote.
  // It returns the latest price (`meta.regularMarketPrice`) and previous close (`meta.chartPreviousClose`).
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=2d`;
  const r = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'application/json',
    },
  });
  if (!r.ok) return null;
  const data = await r.json();
  const result = data?.chart?.result?.[0];
  if (!result) return null;

  const meta = result.meta || {};
  const c = meta.regularMarketPrice;
  if (typeof c !== 'number' || c <= 0) return null;

  // Pull high/low/open from today's bar if available, else from meta
  const quote = result.indicators?.quote?.[0] || {};
  const closes = quote.close || [];
  const highs = quote.high || [];
  const lows = quote.low || [];
  const opens = quote.open || [];
  const lastIdx = closes.length - 1;

  return {
    c,
    h: (typeof highs[lastIdx] === 'number' ? highs[lastIdx] : meta.regularMarketDayHigh) || c,
    l: (typeof lows[lastIdx] === 'number' ? lows[lastIdx] : meta.regularMarketDayLow) || c,
    o: (typeof opens[lastIdx] === 'number' ? opens[lastIdx] : meta.regularMarketOpen) || c,
    pc: meta.chartPreviousClose || meta.previousClose || c,
    t: meta.regularMarketTime || Math.floor(Date.now() / 1000),
  };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { tickers } = req.body || {};
    if (!tickers || !Array.isArray(tickers) || tickers.length === 0) {
      return res.status(400).json({ error: 'No tickers provided' });
    }

    // Limit to 25 tickers per request to keep response time sane
    const limited = tickers.slice(0, 25);

    // Map each input ticker to its normalized Yahoo symbol, but keep the original
    // as the response key so the frontend can look up by what the user typed.
    const fetches = limited.map(async (rawTicker) => {
      const original = String(rawTicker || '').trim().toUpperCase();
      const symbol = normalizeTicker(rawTicker);
      if (!symbol) return { ticker: original, data: null };
      try {
        const data = await fetchYahooQuote(symbol);
        return { ticker: original, data };
      } catch {
        return { ticker: original, data: null };
      }
    });

    const results = await Promise.all(fetches);

    const prices = {};
    for (const { ticker, data } of results) {
      if (data && data.c > 0) prices[ticker] = data;
    }

    return res.status(200).json({ prices });
  } catch (error) {
    console.error('Stocks API error:', error);
    return res.status(500).json({ error: 'Failed to fetch stock prices' });
  }
}
