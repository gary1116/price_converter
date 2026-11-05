export const FX_API = 'https://api.frankfurter.dev/v2';
export const METAL_API = 'https://api.gold-api.com';
export const METALS = [
  { symbol: 'XAU', name: 'Gold', ticker: 'GOLD', tone: 'gold' },
  { symbol: 'XAG', name: 'Silver', ticker: 'SILVER', tone: 'silver' },
  { symbol: 'XPT', name: 'Platinum', ticker: 'PLATINUM', tone: 'purple' },
  { symbol: 'XPD', name: 'Palladium', ticker: 'PALLADIUM', tone: 'blue' },
  { symbol: 'HG', name: 'Copper', ticker: 'COPPER', tone: 'copper' },
];
export const POPULAR = ['USD','INR','EUR','GBP','JPY','AED','CAD','AUD','CHF','SGD'];

async function getJson(url, signal) {
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`HTTP ${response.status} fetching prices`);
  return response.json();
}

export async function getCurrencies(signal) {
  const data = await getJson(`${FX_API}/currencies`, signal);
  const arr = Array.isArray(data) ? data : [];
  const currencies = arr.filter(x => x.iso_code && x.iso_code.length === 3).map(x => ({ code: x.iso_code, name: x.name || x.iso_code }));
  return currencies.sort((a,b) => a.code.localeCompare(b.code));
}

export async function getUsdRates(signal) {
  const data = await getJson(`${FX_API}/rates?base=USD`, signal);
  const rates = { USD: 1 };
  const dates = [];
  for (const item of data) {
    if (Number.isFinite(item.rate) && item.rate > 0) { rates[item.quote] = item.rate; if(item.date) dates.push(item.date); }
  }
  return { rates, date: dates.sort().at(-1) || null };
}

export async function getMetalPrices(signal) {
  const responses = await Promise.allSettled(METALS.map(m => getJson(`${METAL_API}/price/${m.symbol}`, signal)));
  const prices = {};
  const errors = [];
  responses.forEach((r,i) => {
    if (r.status === 'fulfilled') {
      const p = r.value;
      const price = Number(p.price);
      if (Number.isFinite(price) && price > 0) {
        prices[METALS[i].symbol] = { price, updatedAt: p.updatedAt || p.updated_at || null, name: METALS[i].name };
      } else errors.push(METALS[i].name);
    } else errors.push(METALS[i].name);
  });
  return { prices, errors };
}

export const TROY_OUNCE_GRAMS = 31.1034768;
// Gold API spot prices are quoted in USD per troy ounce, except HG (copper),
// which is quoted in USD per pound. Confirm source units before adding a metal.
export const POUND_GRAMS = 453.59237;
export function gramsPerQuoteUnit(symbol) { return symbol === 'HG' ? POUND_GRAMS : TROY_OUNCE_GRAMS; }
export function metalValueUsd(symbol, quantity, unit, spotUsd) {
  const grams = unit === 'oz' ? quantity * TROY_OUNCE_GRAMS : unit === 'kg' ? quantity * 1000 : quantity;
  return grams / gramsPerQuoteUnit(symbol) * spotUsd;
}
export function formatNumber(value, digits=2) {
  if (!Number.isFinite(value)) return '—';
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(value);
}
export function currencySymbol(code) {
  try { return new Intl.NumberFormat('en', { style:'currency', currency: code, currencyDisplay:'narrowSymbol' }).formatToParts(0).find(x => x.type === 'currency')?.value || code; }
  catch { return code; }
}
export function timeLabel(value) {
  if (!value) return 'Recently updated';
  const d = typeof value === 'number' ? new Date(value < 1e12 ? value * 1000 : value) : new Date(value);
  return Number.isNaN(d.getTime()) ? 'Recently updated' : d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

export async function getHistoricalRates(
  fromCurrency,
  toCurrency,
  days = 30,
  signal
) {
  const start = new Date();
  start.setUTCDate(start.getUTCDate() - days);

  const startDate = start.toISOString().split("T")[0];

  if (fromCurrency === toCurrency) {
    return [
      { date: startDate, rate: 1 },
      { date: new Date().toISOString().split("T")[0], rate: 1 }
    ];
  }

  const params = new URLSearchParams({
    from: startDate,
    base: fromCurrency,
    quotes: toCurrency
  });

  const response = await fetch(
    `https://api.frankfurter.dev/v2/rates?${params}`,
    { signal }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch historical rates");
  }

  const data = await response.json();

  return data
    .filter(
      (item) =>
        item.quote === toCurrency &&
        Number.isFinite(item.rate)
    )
    .map((item) => ({
      date: item.date,
      rate: item.rate
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
