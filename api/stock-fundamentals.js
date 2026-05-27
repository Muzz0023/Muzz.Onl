// /api/stock-fundamentals.js
// Returns key fundamentals for a single ticker from Yahoo Finance.
// Input:  GET ?ticker=HSY  (or ?ticker=REH.AX, ?ticker=UMG.AS, etc.)
// Output: { ticker, fundamentals: {...}, news: [...] }

// Reuse the same ASX/AMS/LSE auto-resolve so users can type "REH" not "REH.AX"
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

const YAHOO_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Accept': 'application/json',
};

async function fetchFundamentals(symbol) {
  // quoteSummary has the rich fundamentals. Multiple modules in one call.
  const modules = [
    'price',                  // current price, day change, mktcap
    'summaryDetail',          // P/E, dividend yield, 52w high/low, volume
    'defaultKeyStatistics',   // PEG, forward P/E, EPS, profit margin, ROE, ROA
    'financialData',          // ROE, ROA, debt/equity, FCF, revenue, gross/operating margin
    'calendarEvents',         // earnings dates
    'assetProfile',           // long name, sector, industry, business summary
  ].join(',');
  const url = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(symbol)}?modules=${modules}`;
  const r = await fetch(url, { headers: YAHOO_HEADERS });
  if (!r.ok) return null;
  const data = await r.json();
  const result = data?.quoteSummary?.result?.[0];
  if (!result) return null;

  const num = (v) => (v && typeof v.raw === 'number') ? v.raw : (typeof v === 'number' ? v : null);
  const str = (v) => (v && typeof v.fmt === 'string') ? v.fmt : (typeof v === 'string' ? v : null);

  const price = result.price || {};
  const sd = result.summaryDetail || {};
  const ks = result.defaultKeyStatistics || {};
  const fd = result.financialData || {};
  const ce = result.calendarEvents || {};
  const ap = result.assetProfile || {};

  return {
    symbol: price.symbol || symbol,
    longName: price.longName || price.shortName || symbol,
    currency: price.currency || 'USD',
    exchange: price.exchangeName || '',
    sector: ap.sector || '',
    industry: ap.industry || '',
    website: ap.website || '',
    businessSummary: ap.longBusinessSummary || '',

    // Price block
    regularMarketPrice: num(price.regularMarketPrice),
    regularMarketChange: num(price.regularMarketChange),
    regularMarketChangePercent: num(price.regularMarketChangePercent),
    regularMarketDayHigh: num(price.regularMarketDayHigh),
    regularMarketDayLow: num(price.regularMarketDayLow),
    regularMarketOpen: num(price.regularMarketOpen),
    regularMarketPreviousClose: num(price.regularMarketPreviousClose),
    regularMarketVolume: num(price.regularMarketVolume),
    marketCap: num(price.marketCap),

    // Valuation
    trailingPE: num(sd.trailingPE),
    forwardPE: num(sd.forwardPE) ?? num(ks.forwardPE),
    pegRatio: num(ks.pegRatio),
    priceToBook: num(ks.priceToBook),
    priceToSalesTrailing12Months: num(sd.priceToSalesTrailing12Months),
    enterpriseValue: num(ks.enterpriseValue),
    enterpriseToRevenue: num(ks.enterpriseToRevenue),
    enterpriseToEbitda: num(ks.enterpriseToEbitda),

    // Yield / dividends
    dividendYield: num(sd.dividendYield),
    dividendRate: num(sd.dividendRate),
    payoutRatio: num(sd.payoutRatio),
    fiveYearAvgDividendYield: num(sd.fiveYearAvgDividendYield),
    exDividendDate: num(sd.exDividendDate),

    // Per-share
    trailingEps: num(ks.trailingEps),
    forwardEps: num(ks.forwardEps),
    bookValue: num(ks.bookValue),

    // Profitability
    profitMargins: num(ks.profitMargins) ?? num(fd.profitMargins),
    grossMargins: num(fd.grossMargins),
    operatingMargins: num(fd.operatingMargins),
    returnOnAssets: num(fd.returnOnAssets),
    returnOnEquity: num(fd.returnOnEquity),
    revenueGrowth: num(fd.revenueGrowth),
    earningsGrowth: num(fd.earningsGrowth),

    // Balance sheet
    totalCash: num(fd.totalCash),
    totalCashPerShare: num(fd.totalCashPerShare),
    totalDebt: num(fd.totalDebt),
    debtToEquity: num(fd.debtToEquity),
    currentRatio: num(fd.currentRatio),
    quickRatio: num(fd.quickRatio),

    // Cash flow
    operatingCashflow: num(fd.operatingCashflow),
    freeCashflow: num(fd.freeCashflow),
    revenuePerShare: num(fd.revenuePerShare),
    totalRevenue: num(fd.totalRevenue),
    ebitda: num(fd.ebitda),

    // Highs/lows
    fiftyTwoWeekHigh: num(sd.fiftyTwoWeekHigh),
    fiftyTwoWeekLow: num(sd.fiftyTwoWeekLow),
    fiftyDayAverage: num(sd.fiftyDayAverage),
    twoHundredDayAverage: num(sd.twoHundredDayAverage),

    // Shares
    sharesOutstanding: num(ks.sharesOutstanding),
    floatShares: num(ks.floatShares),
    heldPercentInsiders: num(ks.heldPercentInsiders),
    heldPercentInstitutions: num(ks.heldPercentInstitutions),

    // Earnings
    earningsDate: ce.earnings?.earningsDate?.[0]?.raw || null,
    earningsCallDate: ce.earnings?.earningsCallDate?.[0]?.raw || null,

    // Recommendations
    targetMeanPrice: num(fd.targetMeanPrice),
    targetHighPrice: num(fd.targetHighPrice),
    targetLowPrice: num(fd.targetLowPrice),
    recommendationKey: str(fd.recommendationKey) || fd.recommendationKey || null,
    numberOfAnalystOpinions: num(fd.numberOfAnalystOpinions),
  };
}

async function fetchNews(symbol) {
  // Yahoo's search endpoint includes news for a ticker
  try {
    const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(symbol)}&newsCount=8&quotesCount=0`;
    const r = await fetch(url, { headers: YAHOO_HEADERS });
    if (!r.ok) return [];
    const data = await r.json();
    const news = Array.isArray(data?.news) ? data.news : [];
    return news.slice(0, 8).map(n => ({
      uuid: n.uuid,
      title: n.title,
      publisher: n.publisher,
      link: n.link,
      providerPublishTime: n.providerPublishTime,
      type: n.type,
      thumbnail: n.thumbnail?.resolutions?.[0]?.url || null,
    }));
  } catch {
    return [];
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { ticker } = req.query;
  if (!ticker) return res.status(400).json({ error: 'No ticker' });

  try {
    const symbol = normalizeTicker(ticker);
    const [fundamentals, news] = await Promise.all([
      fetchFundamentals(symbol),
      fetchNews(symbol),
    ]);
    if (!fundamentals) return res.status(404).json({ error: 'Ticker not found' });
    return res.status(200).json({ ticker: String(ticker).trim().toUpperCase(), symbol, fundamentals, news });
  } catch (e) {
    console.error('Fundamentals API error:', e);
    return res.status(500).json({ error: 'Failed to fetch fundamentals' });
  }
}
