// /api/fx-rates.js
// Returns current FX rates with a base currency.
// Input:  GET ?base=AUD  (defaults to USD)
// Output: { base: 'AUD', rates: { USD: 0.66, EUR: 0.60, ... }, timestamp: ... }
//
// Uses exchangerate-api.com's open access endpoint — no API key required, daily updates.
// If that fails, falls back to Yahoo Finance FX tickers.

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  // Cache for 1 hour at the CDN edge (FX rates don't move fast enough to matter)
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const base = String(req.query.base || 'USD').toUpperCase();
  const validBases = ['USD','AUD','EUR','GBP','JPY','CAD','NZD','CHF','CNY','HKD','SGD','INR','SEK','NOK','DKK'];
  const safeBase = validBases.includes(base) ? base : 'USD';

  try {
    // Primary: exchangerate-api open endpoint
    const url = `https://open.er-api.com/v6/latest/${safeBase}`;
    const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (r.ok) {
      const data = await r.json();
      if (data && data.rates) {
        return res.status(200).json({
          base: safeBase,
          rates: data.rates,
          timestamp: data.time_last_update_unix || Math.floor(Date.now() / 1000),
          source: 'exchangerate-api',
        });
      }
    }

    // Fallback: build a minimal rate table from Yahoo FX tickers (USD-based pairs)
    // We pull a handful of pairs and synthesise the base table from them.
    const pairs = ['EURUSD=X', 'GBPUSD=X', 'AUDUSD=X', 'NZDUSD=X', 'USDJPY=X', 'USDCAD=X', 'USDCHF=X', 'USDCNY=X', 'USDHKD=X', 'USDSGD=X', 'USDINR=X', 'USDSEK=X', 'USDNOK=X', 'USDDKK=X'];
    const fxRates = { USD: 1 };
    for (const p of pairs) {
      try {
        const fr = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${p}?interval=1d&range=1d`, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        });
        if (!fr.ok) continue;
        const fd = await fr.json();
        const price = fd?.chart?.result?.[0]?.meta?.regularMarketPrice;
        if (typeof price !== 'number') continue;
        if (p.startsWith('USD')) {
          // USDxxx=X → 1 USD = price xxx → rate of xxx (per 1 USD)
          const target = p.replace('USD', '').replace('=X', '');
          fxRates[target] = price;
        } else {
          // xxxUSD=X → 1 xxx = price USD → rate of xxx per USD = 1/price
          const source = p.replace('USD=X', '');
          fxRates[source] = 1 / price;
        }
      } catch { /* ignore individual pair failures */ }
    }
    // Rebase if not USD
    if (safeBase !== 'USD') {
      const baseRate = fxRates[safeBase];
      if (!baseRate) throw new Error('Could not synthesise rates for base ' + safeBase);
      const rebased = {};
      for (const k of Object.keys(fxRates)) rebased[k] = fxRates[k] / baseRate;
      return res.status(200).json({ base: safeBase, rates: rebased, timestamp: Math.floor(Date.now() / 1000), source: 'yahoo-fallback' });
    }
    return res.status(200).json({ base: safeBase, rates: fxRates, timestamp: Math.floor(Date.now() / 1000), source: 'yahoo-fallback' });
  } catch (e) {
    console.error('FX API error:', e);
    return res.status(500).json({ error: 'Failed to fetch FX rates' });
  }
}
