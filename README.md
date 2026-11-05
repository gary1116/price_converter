# price_Converter — React currency & commodity dashboard

A responsive React + Vite project providing **real fetched prices** (never mock values) for foreign exchange and commodities.

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite (normally `http://localhost:5173`). For deployment, run `npm run build` and deploy the `dist/` folder to Vercel or Netlify.

## Features

- Convert between available fiat currencies, with searchable currency selectors and swap button.
- Get gold, silver, platinum, palladium and copper spot value estimates by gram, kilogram or troy ounce, converted into fiat currencies.
- Quick snapshot cards, filterable watchlist, copy result, manual refresh, responsive layout.
- Automatically checks rates every 2 minutes; timestamps distinguish a successful fetch from the rate's underlying reference date.
- Partial failures handled per feed and per metal; no fabricated demo prices.

## Data sources

- **FX:** [Frankfurter v2](https://frankfurter.dev/) — `https://api.frankfurter.dev/v2/rates?base=USD` and `/currencies`. Rates are daily reference data, not streaming trading quotes. Free without API key.
- **Commodities:** [Gold API](https://gold-api.com/docs) — `https://api.gold-api.com/price/XAU`, `/price/XAG`, `/price/XPT`, `/price/XPD`, `/price/HG`. No API key for current spot prices; according to provider, browser CORS is enabled.

Gold API precious metal prices are USD **per troy ounce** (1 troy ounce = 31.1034768 g). Copper ticker HG is treated as USD **per pound** (1 pound = 453.59237 g); confirm contract units against provider documentation before using copper for financial decisions.

### Important limitations

- Commodity spot estimates are **not** Indian retail jewelry prices or MCX executable quotes. They exclude GST, making charges, purity adjustments, dealer margins and spreads.
- If a provider is down or restricted, quotes show `—`; they do **not** fall back to invented values.
- Currencies that the FX provider does not return are excluded from the selector.
- In production, consider adding a caching backend, data-source terms review, and error monitoring.

## Integration

The app is self-contained inside `src/`. You can copy `src/api.js` and the converter components into an existing React project. Uses `lucide-react` for icons. No secret keys needed.
