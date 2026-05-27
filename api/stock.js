// /api/stock.js
// Returns Yahoo Finance chart data for a single ticker.
// Input:  GET ?ticker=HSY&interval=1d&range=1mo  (interval/range optional, defaults below)
// Output: Raw Yahoo chart JSON

const ASX_TICKERS = new Set([
  'REH','CBA','BHP','CSL','NAB','WBC','ANZ','WES','WOW','TLS',
  'VAS','VGS','VHY','VTS','VEU','IVV','NDQ','A200','STW',
  'FMG','RIO','WDS','STO','QAN','MQG','TCL','GMG','COL','JBH',
  'NXT','XRO','WTC','CAR','REA','SEK','ALL','COH','RMD','SHL',
]);
const AMS_TICKERS = new Set(['UMG','ASML','AD','INGA','PHIA','HEIA','RAND','AKZA','DSM','KPN']);
const LSE_TICKERS = new Set(['HSBA','LLOY','BARC','SHEL','BP','AZN','GSK','ULVR','DGE','VOD','PRU','BATS','TSCO','NWG','STAN']);

function normalizeTicker(raw) {
  const t = String(raw || '').trim().toUpperCase();
  if (!t) return '';
  if (t.includes('.')) return t;
  if (ASX_TICKERS.has(t)) return `${t}.AX`;
  if (AMS_TICKERS.has(t)) return `${t}.AS`;
  if (LSE_TICKERS.has(t)) return `${t}.L`;
  return t;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { ticker, interval = '1d', range = '5y' } = req.query;
  if (!ticker) return res.status(400).json({ error: 'No ticker' });

  // Whitelist valid Yahoo params to avoid passing junk
  const validIntervals = ['1m','2m','5m','15m','30m','60m','90m','1h','1d','5d','1wk','1mo','3mo'];
  const validRanges = ['1d','5d','1mo','3mo','6mo','1y','2y','5y','10y','ytd','max'];
  const ivl = validIntervals.includes(interval) ? interval : '1d';
  const rng = validRanges.includes(range) ? range : '5y';

  try {
    const symbol = normalizeTicker(ticker);
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=${ivl}&range=${rng}`;
    const r = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
      },
    });
    if (!r.ok) return res.status(404).json({ error: 'Ticker not found' });
    const data = await r.json();
    return res.status(200).json(data);
  } catch (e) {
    console.error('Stock chart API error:', e);
    return res.status(500).json({ error: 'Failed to fetch stock data' });
  }
}
