export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'FINNHUB_API_KEY not configured' });
  }

  try {
    const { tickers } = req.body;

    if (!tickers || !Array.isArray(tickers) || tickers.length === 0) {
      return res.status(400).json({ error: 'No tickers provided' });
    }

    // Limit to 20 tickers max to stay within rate limits
    const limitedTickers = tickers.slice(0, 20);

    // Fetch all prices in parallel
    const pricePromises = limitedTickers.map(async (ticker) => {
      try {
        const response = await fetch(
          `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(ticker)}&token=${apiKey}`
        );
        const data = await response.json();
        // data = { c: current, h: high, l: low, o: open, pc: previous close, t: timestamp }
        return { ticker, data };
      } catch (err) {
        return { ticker, data: null };
      }
    });

    const results = await Promise.all(pricePromises);

    // Build prices object
    const prices = {};
    results.forEach(({ ticker, data }) => {
      if (data && data.c > 0) {
        prices[ticker] = {
          c: data.c,    // current price
          h: data.h,    // high
          l: data.l,    // low
          o: data.o,    // open
          pc: data.pc,  // previous close
          t: data.t     // timestamp
        };
      }
    });

    return res.status(200).json({ prices });

  } catch (error) {
    console.error('Stocks API error:', error);
    return res.status(500).json({ error: 'Failed to fetch stock prices' });
  }
}
