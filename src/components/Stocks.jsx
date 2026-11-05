
import { useEffect, useRef, useState } from 'react';
import {
  BarChart3,
  ExternalLink,
  Info,
  Search,
  TrendingUp
} from 'lucide-react';

import StockQuote from './StockQuote';

// Featured stocks
const STOCKS = {
  us: [
    { label: 'Apple', ticker: 'AAPL', symbol: 'NASDAQ:AAPL' },
    { label: 'NVIDIA', ticker: 'NVDA', symbol: 'NASDAQ:NVDA' },
    { label: 'Microsoft', ticker: 'MSFT', symbol: 'NASDAQ:MSFT' },
    { label: 'Alphabet (Google)', ticker: 'GOOGL', symbol: 'NASDAQ:GOOGL' },
    { label: 'Amazon', ticker: 'AMZN', symbol: 'NASDAQ:AMZN' },
    { label: 'Tesla', ticker: 'TSLA', symbol: 'NASDAQ:TSLA' },
    { label: 'Meta', ticker: 'META', symbol: 'NASDAQ:META' },
    { label: 'Coca-Cola', ticker: 'KO', symbol: 'NYSE:KO' },
    { label: 'JPMorgan Chase', ticker: 'JPM', symbol: 'NYSE:JPM' },
    {
      label: 'Berkshire Hathaway Class A',
      ticker: 'BRK.A',
      symbol: 'NYSE:BRK.A'
    },
    {
      label: 'Berkshire Hathaway Class B',
      ticker: 'BRK.B',
      symbol: 'NYSE:BRK.B'
    }
  ],

  india: [
    { label: 'Reliance Industries', ticker: 'RELIANCE', symbol: 'NSE:RELIANCE' },
    { label: 'TCS', ticker: 'TCS', symbol: 'NSE:TCS' },
    { label: 'Infosys', ticker: 'INFY', symbol: 'NSE:INFY' },
    { label: 'HDFC Bank', ticker: 'HDFCBANK', symbol: 'NSE:HDFCBANK' },
    { label: 'ICICI Bank', ticker: 'ICICIBANK', symbol: 'NSE:ICICIBANK' },
    { label: 'Bharti Airtel', ticker: 'BHARTIARTL', symbol: 'NSE:BHARTIARTL' },
    { label: 'Tata Motors', ticker: 'TATAMOTORS', symbol: 'NSE:TATAMOTORS' },
    { label: 'Bharat Heavy Electricals', ticker: 'BHEL', symbol: 'NSE:BHEL' },
    { label: 'Eternal (formerly Zomato)', ticker: 'ETERNAL', symbol: 'NSE:ETERNAL' }
  ]
};

// Small alias directory
const ALIASES = {
  india: {
    ZOMATO: 'ETERNAL',
    'BHARAT HEAVY ELECTRICALS': 'BHEL'
  },

  us: {
    GOOGLE: 'GOOGL',
    FACEBOOK: 'META',
    'COCA COLA': 'KO',
    BERKSHIRE: 'BRK.B',
    'BERKSHIRE HATHAWAY': 'BRK.B',
    'BERKSHIRE HATHAWAY CLASS A': 'BRK.A',
    'BERKSHIRE HATHAWAY CLASS B': 'BRK.B'
  }
};

// Known NYSE listings
const KNOWN_US_EXCHANGES = {
  'BRK.A': 'NYSE',
  'BRK.B': 'NYSE',
  KO: 'NYSE',
  JPM: 'NYSE'
};

const VALID_SYMBOL = /^[A-Z0-9][A-Z0-9._-]*$/;

// Resolve ticker into a TradingView symbol
function resolveSymbol(input, market, exchange) {
  const normalized = input
    .trim()
    .toUpperCase()
    .replace(/\s+/g, ' ');

  if (!normalized) {
    return { error: 'Enter a stock ticker to search.' };
  }

  // Allow explicit exchange prefixes
  const explicit = normalized.match(
    /^([A-Z]+):([A-Z0-9._-]+)$/
  );

  if (explicit) {
    return {
      symbol: `${explicit[1]}:${explicit[2]}`
    };
  }

  // Resolve common company aliases
  const alias = ALIASES[market][normalized];

  const known = STOCKS[market].find(
    (item) =>
      item.ticker === normalized ||
      item.label.toUpperCase() === normalized
  );

  if (known) {
    return { symbol: known.symbol };
  }

  const ticker = alias ?? normalized;

  if (!VALID_SYMBOL.test(ticker)) {
    return {
      error:
        'Enter a valid ticker such as BHEL, NVDA, BRK.A or BRK.B.'
    };
  }

  // Automatically detect known NYSE symbols
  if (
    market === 'us' &&
    KNOWN_US_EXCHANGES[ticker]
  ) {
    return {
      symbol: `${KNOWN_US_EXCHANGES[ticker]}:${ticker}`
    };
  }

  return {
    symbol: `${
      market === 'india' ? 'NSE' : exchange
    }:${ticker}`
  };
}

// TradingView historical chart
function TradingViewChart({ symbol, theme }) {
  const ref = useRef(null);

  useEffect(() => {
    const node = ref.current;

    if (!node) return;

    node.replaceChildren();

    const target = document.createElement('div');

    target.className =
      'tradingview-widget-container__widget';

    target.style.height = 'calc(100% - 32px)';
    target.style.width = '100%';

    node.appendChild(target);

    const script = document.createElement('script');

    script.type = 'text/javascript';
    script.async = true;

    script.src =
      'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';

    script.textContent = JSON.stringify({
      autosize: true,
      symbol,
      interval: 'D',
      timezone: 'exchange',
      theme,
      style: '1',
      locale: 'en',
      allow_symbol_change: false,
      withdateranges: true,
      hide_side_toolbar: true,
      hide_top_toolbar: false,
      hide_volume: false,
      save_image: false,
      support_host: 'https://www.tradingview.com'
    });

    node.appendChild(script);

    return () => {
      node.replaceChildren();
    };
  }, [symbol, theme]);

  const tradingViewUrl =
    `https://www.tradingview.com/symbols/${symbol.replace(':', '-')}/`;

  return (
    <div className="stocks-chart-panel">
      <div className="stocks-chart-intro">
        <div>
          <span className="eyebrow small">
            INTERACTIVE MARKET CHART
          </span>

          <h2>{symbol.replace(':', ' · ')}</h2>

          <p>
            Use the chart toolbar to change the time range.
            Select another ticker above to update both widgets.
          </p>
        </div>
      </div>

      <div
        className="tradingview-widget-container stocks-widget"
        ref={ref}
        aria-label={`TradingView chart for ${symbol}`}
      />

      <div className="stocks-attribution">
        <a
          href={tradingViewUrl}
          target="_blank"
          rel="noopener nofollow noreferrer"
        >
          {symbol} chart
        </a>

        <span>
          {' '}by{' '}
          <a
            href="https://www.tradingview.com/"
            target="_blank"
            rel="noopener nofollow noreferrer"
          >
            TradingView <ExternalLink size={12} />
          </a>
        </span>
      </div>
    </div>
  );
}

// Main Stocks component
export default function Stocks({ theme = 'light' }) {
  const [market, setMarket] = useState('us');
  const [exchange, setExchange] = useState('NASDAQ');
  const [symbol, setSymbol] = useState('NASDAQ:AAPL');
  const [search, setSearch] = useState('');
  const [searchError, setSearchError] = useState('');

  const choices = STOCKS[market];

  const normalizedSearch = search.trim().toLowerCase();

  const filtered = choices.filter((item) =>
    `${item.ticker} ${item.label}`
      .toLowerCase()
      .includes(normalizedSearch) ||
    Object.entries(ALIASES[market]).some(
      ([alias, ticker]) =>
        ticker === item.ticker &&
        alias.toLowerCase().includes(normalizedSearch)
    )
  );

  const selected = choices.find(
    (item) => item.symbol === symbol
  );

  const selectMarket = (next) => {
    setMarket(next);
    setExchange(next === 'us' ? 'NASDAQ' : 'NSE');
    setSymbol(STOCKS[next][0].symbol);
    setSearch('');
    setSearchError('');
  };

  const chooseStock = (item) => {
    setSymbol(item.symbol);
    setSearch(item.ticker);
    setSearchError('');

    if (market === 'us') {
      setExchange(
        item.symbol.startsWith('NYSE:')
          ? 'NYSE'
          : 'NASDAQ'
      );
    }
  };

  const handleSearch = (event) => {
    event.preventDefault();

    const result = resolveSymbol(
      search,
      market,
      exchange
    );

    if (result.error) {
      setSearchError(result.error);
      return;
    }

    setSymbol(result.symbol);
    setSearchError('');

    // Keep exchange dropdown synchronized
    if (market === 'us') {
      const selectedExchange =
        result.symbol.split(':')[0];

      if (
        selectedExchange === 'NYSE' ||
        selectedExchange === 'NASDAQ'
      ) {
        setExchange(selectedExchange);
      }
    }
  };

  return (
    <div className="stocks-page">

      <div className="stocks-title">
        <div>
          <div className="eyebrow">
            <span className="eyebrow-square" />
            MARKETS AT A GLANCE
          </div>

          <h1>
            <TrendingUp size={30} />
            Stocks
            <span className="title-period">.</span>
          </h1>

          <p>
            Explore stock charts for US and Indian markets,
            powered by TradingView.
          </p>
        </div>

        <span className="stocks-version">
          PRICE CONVERT v2.1
        </span>
      </div>

      <div
        className="stocks-market-toggle"
        role="group"
        aria-label="Choose market"
      >
        <button
          type="button"
          className={market === 'us' ? 'selected' : ''}
          aria-pressed={market === 'us'}
          onClick={() => selectMarket('us')}
        >
          🇺🇸 US Market
        </button>

        <button
          type="button"
          className={market === 'india' ? 'selected' : ''}
          aria-pressed={market === 'india'}
          onClick={() => selectMarket('india')}
        >
          🇮🇳 Indian Market
        </button>
      </div>

      {/* Search section */}
      <form
        className="stocks-search stocks-search-form"
        onSubmit={handleSearch}
      >
        <Search size={18} aria-hidden="true" />

        <input
          aria-label="Search by stock ticker"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setSearchError('');
          }}
          placeholder={
            market === 'india'
              ? 'Enter ticker (e.g. BHEL, SBIN, ETERNAL)'
              : 'Enter ticker (e.g. NVDA, BRK.A, BRK.B)'
          }
        />

        {market === 'us' && (
          <select
            aria-label="US stock exchange"
            value={exchange}
            onChange={(event) =>
              setExchange(event.target.value)
            }
            className="stocks-exchange-select"
          >
            <option value="NASDAQ">NASDAQ</option>
            <option value="NYSE">NYSE</option>
          </select>
        )}

        <button
          type="submit"
          className="stocks-search-submit"
        >
          Search
        </button>
      </form>

      {searchError && (
        <p
          className="stocks-search-error"
          role="alert"
        >
          {searchError}
        </p>
      )}

      <p className="stocks-search-hint">
        No exchange prefix needed. Enter a stock ticker
        and press Enter. You can also enter a full symbol
        such as NYSE:BRK.B.
      </p>

      {/* Featured stocks */}
      <div className="stocks-section-head">
        <strong>
          Featured {market === 'us' ? 'US' : 'Indian'} Stocks
        </strong>

        <span>{filtered.length} results</span>
      </div>

      <div className="stocks-picks">
        {filtered.map((item) => (
          <button
            type="button"
            key={item.symbol}
            className={`stocks-pick ${
              symbol === item.symbol ? 'selected' : ''
            }`}
            aria-pressed={symbol === item.symbol}
            onClick={() => chooseStock(item)}
          >
            <span className="stocks-pick-icon">
              <BarChart3 size={16} />
            </span>

            <span>
              <strong>{item.ticker}</strong>
              <small>{item.label}</small>
            </span>
          </button>
        ))}

        {filtered.length === 0 && (
          <p className="stocks-empty">
            Not in featured stocks? Press Search to try
            this ticker in both TradingView widgets.
          </p>
        )}
      </div>

      {/* Stock quote */}
      <StockQuote
        symbol={symbol}
        theme={theme}
      />

      {/* Historical chart */}
      <TradingViewChart
        symbol={symbol}
        theme={theme}
      />

      {/* Disclaimer */}
      <div className="stocks-notice" role="note">
        <Info size={20} />

        <div>
          <strong>About market data</strong>

          <p>
            Charts are embedded free of charge from
            TradingView. Quotes may be delayed or
            unavailable depending on exchange permissions.
            Search does not verify ticker availability.
            Check each chart's timestamps.
            For informational purposes only;
            not investment advice.
          </p>

          <a
            href="https://www.tradingview.com/widget/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Thank you to TradingView for providing
            free widgets <ExternalLink size={12} />
          </a>
        </div>
      </div>

      <p className="stocks-limitations">
        Stock data stays inside TradingView embeds,
        not an unofficial stock API.

        {' '}Currently viewing{' '}
        {selected?.label ?? symbol}.

        {' '}If an embed is restricted,{' '}
        <a
          href={`https://www.tradingview.com/symbols/${symbol.replace(':', '-')}/`}
          target="_blank"
          rel="noopener noreferrer"
        >
          view the stock on TradingView
        </a>.
      </p>
    </div>
  );
}
