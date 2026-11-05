import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowDownUp, ArrowRight, BarChart3, Check, ChevronDown, CircleHelp, Coins, Command, ExternalLink, Globe2, LayoutDashboard, Menu, RefreshCw, Search, ShieldCheck, Sparkles, TrendingUp, Wallet, X } from 'lucide-react';
import { FX_API, METALS, POPULAR, TROY_OUNCE_GRAMS, currencySymbol, formatNumber, getCurrencies, getMetalPrices, getUsdRates, metalValueUsd, timeLabel } from './api';
import HistoricalChart from "./components/HistoricalChart";
import useTheme from "./hooks/useTheme";
import Stocks from './components/Stocks';

const defaultCurrencyOptions = [
  ['USD', 'US Dollar'], ['INR', 'Indian Rupee'], ['EUR', 'Euro'], ['GBP', 'British Pound'], ['JPY', 'Japanese Yen'], ['AED', 'UAE Dirham'], ['CAD', 'Canadian Dollar'], ['AUD', 'Australian Dollar'], ['CHF', 'Swiss Franc'], ['SGD', 'Singapore Dollar'],
].map(([code, name]) => ({ code, name }));
const icons = { USD: '🇺🇸', INR: '🇮🇳', EUR: '🇪🇺', GBP: '🇬🇧', JPY: '🇯🇵', AED: '🇦🇪', CAD: '🇨🇦', AUD: '🇦🇺', CHF: '🇨🇭', SGD: '🇸🇬' };
const tiles = [{ symbol: 'XAU', alias: 'Gold', unit: 'g' }, { symbol: 'XAG', alias: 'Silver', unit: 'g' }, { symbol: 'USD', alias: 'US Dollar', unit: 'INR' }, { symbol: 'EUR', alias: 'Euro', unit: 'INR' }];

function useMarketData() {
  const [state, setState] = useState({ rates: { USD: 1 }, metals: {}, currencies: defaultCurrencyOptions, fxDate: null, metalsError: [], fxError: '', loading: true, refreshing: false, lastRefresh: null });
  const refresh = useCallback(async (first = false) => {
    setState(prev => ({ ...prev, loading: first, refreshing: !first }));
    const [fx, metal, currencies] = await Promise.allSettled([getUsdRates(), getMetalPrices(), getCurrencies()]);
    setState(prev => ({
      ...prev,
      rates: fx.status === 'fulfilled' ? fx.value.rates : prev.rates,
      fxDate: fx.status === 'fulfilled' ? fx.value.date : prev.fxDate,
      fxError: fx.status === 'fulfilled' ? '' : 'FX rates unavailable. Try refreshing.',
      metals: metal.status === 'fulfilled' ? metal.value.prices : prev.metals,
      metalsError: metal.status === 'fulfilled' ? metal.value.errors : METALS.map(m => m.name),
      currencies: currencies.status === 'fulfilled' && currencies.value.length ? currencies.value : prev.currencies,
      loading: false, refreshing: false, lastRefresh: new Date(),
    }));
  }, []);
  useEffect(() => { refresh(true); const timer = setInterval(() => refresh(), 120000); return () => clearInterval(timer); }, [refresh]);
  return { ...state, refresh };
}

function RateSelect({ value, onChange, options, compact = false }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const filtered = options.filter(x => x.code.toLowerCase().includes(search.toLowerCase()) || x.name.toLowerCase().includes(search.toLowerCase()));
  const selected = options.find(x => x.code === value);
  useEffect(() => { if (!open) return; const close = e => { if (!e.target.closest(`[data-dropdown="${value}-${compact}"]`)) setOpen(false); }; document.addEventListener('pointerdown', close); return () => document.removeEventListener('pointerdown', close); }, [open, value, compact]);
  return <div className="currency-select" data-dropdown={`${value}-${compact}`}>
    <button className={`select-trigger ${compact ? 'compact' : ''}`} type="button" onClick={() => { setOpen(!open); setSearch('') }} aria-expanded={open}>
      <span className="flag">{icons[value] || '🌐'}</span><span className="select-code">{value}</span>{!compact && <span className="select-full">{selected?.name || value}</span>}<ChevronDown size={15} className="subtle" />
    </button>
    {open && <div className="select-popover"><div className="searchbox"><Search size={15} /><input autoFocus placeholder="Search currencies" value={search} onChange={e => setSearch(e.target.value)} /></div><div className="select-list">{filtered.length ? filtered.map(o => <button key={o.code} type="button" className={`select-option ${o.code === value ? 'chosen' : ''}`} onClick={() => { onChange(o.code); setOpen(false) }}><span>{icons[o.code] || '🌐'}</span><span className="option-code">{o.code}</span><span className="option-name">{o.name}</span>{o.code === value && <Check size={14} />}</button>) : <div className="empty-results">No currencies found</div>}</div></div>}
  </div>;
}

function App() {
  const market = useMarketData();
  const { theme, toggleTheme } = useTheme();
  const [tab, setTab] = useState('currencies');
  const [amount, setAmount] = useState('1000');
  const [from, setFrom] = useState('USD');
  const [to, setTo] = useState('INR');
  const [metal, setMetal] = useState('XAU');
  const [unit, setUnit] = useState('g');
  const [metalCurrency, setMetalCurrency] = useState('INR');
  const [filter, setFilter] = useState('');
  const [mobileMenu, setMobileMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const fxReady = !!market.fxDate;
  const number = Number(amount);
  const validAmount = amount.trim() !== '' && Number.isFinite(number) && number >= 0;
  const rate = market.rates[from] && market.rates[to] ? market.rates[to] / market.rates[from] : null;
  const result = validAmount && fxReady && rate !== null ? number * rate : null;
  const metalSpot = market.metals[metal]?.price;
  const metalValue = validAmount && metalSpot && market.rates[metalCurrency] && fxReady ? metalValueUsd(metal, number, unit, metalSpot) * market.rates[metalCurrency] : null;
  const chosenMetal = METALS.find(x => x.symbol === metal);
  const options = useMemo(() => market.currencies.filter(x => market.rates[x.code]), [market.currencies, market.rates]);
  const getRate = (currency) => market.rates[currency] && market.rates.INR ? market.rates.INR / market.rates[currency] : null;
  const tileValue = (t) => t.symbol.startsWith('X') ? (market.metals[t.symbol] && market.rates.INR && fxReady ? market.metals[t.symbol].price * market.rates.INR / TROY_OUNCE_GRAMS : null) : getRate(t.symbol);
  const filteredCurrencies = POPULAR.filter(c => c !== 'INR' && (`${c} ${options.find(x => x.code === c)?.name || ''}`).toLowerCase().includes(filter.toLowerCase()));
  const filteredMetals = METALS.filter(m => (`${m.symbol} ${m.name}`).toLowerCase().includes(filter.toLowerCase()));
  const switchTab = (t) => { setTab(t); setMobileMenu(false); setFilter(''); };
  const swap = () => { setFrom(to); setTo(from); };
  const copyResult = async () => { if (result === null) return; try { await navigator.clipboard.writeText(`${formatNumber(result, 4)} ${to}`); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { } };

  return <div className="app-shell">
    <aside className={`sidebar ${mobileMenu ? 'sidebar-open' : ''}`}>
      <div className="brand"><div className="brand-icon"><Globe2 size={23} strokeWidth={2.3} /></div><span>Price<span className="brand-dot">.</span></span><button className="mobile-close" onClick={() => setMobileMenu(false)}><X size={20} /></button></div>
      <div className="sidebar-caption">WORKSPACE</div>
      <nav className="nav"><button className={`nav-item ${tab !== 'stocks' ? 'active' : ''}`} onClick={() => { switchTab('currencies'); window.scrollTo({ top: 0, behavior: 'smooth' }) }}><LayoutDashboard size={18} /> Overview</button><button className={`nav-item ${tab === 'currencies' ? 'nav-secondary-active' : ''}`} onClick={() => switchTab('currencies')}><ArrowDownUp size={18} /> Currency converter</button><button className={`nav-item ${tab === 'metals' ? 'nav-secondary-active' : ''}`} onClick={() => switchTab('metals')}><Coins size={18} /> Commodities</button><button className={`nav-item ${tab === 'stocks' ? 'active' : ''}`} onClick={() => switchTab('stocks')}><TrendingUp size={18} /> Stocks <span className="stocks-nav-new">NEW</span></button></nav>
      <div className="sidebar-caption market-caption">MARKET DATA</div>
      <nav className="nav"><a href="https://frankfurter.dev" target="_blank" rel="noreferrer" className="nav-item"><Globe2 size={18} /> FX data source <ExternalLink size={13} className="nav-external" /></a><a href="https://gold-api.com" target="_blank" rel="noreferrer" className="nav-item"><BarChart3 size={18} /> Metals data source <ExternalLink size={13} className="nav-external" /></a></nav>
      <div className="sidebar-bottom"><div className="help-icon"><ShieldCheck size={19} /></div><strong>Clear, transparent rates</strong><p>Real market data, with timestamps and no made-up prices.</p><a href="https://frankfurter.dev" target="_blank" rel="noreferrer">About our sources <ArrowRight size={14} /></a></div>
      <div className="sidebar-footer"><span className="online-dot" /> Market dashboard <span className="footer-version">v2.0</span></div>
    </aside>
    {mobileMenu && <div className="mobile-backdrop" onClick={() => setMobileMenu(false)} />}
    <main className="main">
      <header className="topbar">
        <button
          type="button"
          className="hamburger"
          onClick={() => setMobileMenu(true)}
          aria-label="Open navigation menu"
        >
          <Menu size={21} />
        </button>
        <div className="breadcrumb">
          Workspace <span>/</span> <strong>{tab === 'stocks' ? 'Stocks' : 'Overview'}</strong>
        </div>
        <div className="topbar-right">
          <span className="market-indicator">
            <span className="online-dot" /> Market data connected
          </span>
          <button
            type="button"
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            aria-pressed={theme === 'dark'}
          >
            <span aria-hidden="true">{theme === 'dark' ? '☀️' : '🌙'}</span>
            <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
          </button>
        </div>
      </header>
      <div className="content">
        {tab === 'stocks' ? <Stocks theme={theme} /> : <>
        <div className="title-section"><div><div className="eyebrow"><span className="eyebrow-square" /> THE MARKET, MADE SIMPLE</div><h1>Good morning<span className="title-period">.</span></h1><p>Everything you need to convert, compare, and stay on top of rates.</p></div><button className="refresh-button" onClick={() => market.refresh()} disabled={market.loading || market.refreshing}><RefreshCw size={16} className={market.refreshing ? 'spin' : ''} /> {market.refreshing ? 'Refreshing…' : 'Refresh rates'}</button></div>
        <div className="metric-label"><span>MARKET SNAPSHOT</span><span className="data-fresh">{market.lastRefresh ? `Checked ${timeLabel(market.lastRefresh)}` : 'Loading current prices…'}</span></div>
        <div className="metrics">{tiles.map((t, i) => <div className="metric-card" key={i}><div className="metric-top"><div className={`metric-icon ${t.symbol === 'XAU' ? 'gold' : t.symbol === 'XAG' ? 'silver' : 'forex'}`}>{t.symbol === 'XAU' ? <Coins size={18} /> : t.symbol === 'XAG' ? <Sparkles size={18} /> : <span>{icons[t.symbol]}</span>}</div><span className="metric-tag">{t.symbol === 'XAU' || t.symbol === 'XAG' ? 'SPOT' : 'FX'}</span></div><div className="metric-name">{t.alias} <span>{t.symbol}</span></div><div className="metric-value">{tileValue(t) != null ? `₹${formatNumber(tileValue(t), t.unit === 'g' ? 2 : 4)}` : '—'}</div><div className="metric-foot">per {t.unit === 'g' ? 'gram' : `1 ${t.symbol}`} <span className="metric-small">{t.symbol === 'XAU' || t.symbol === 'XAG' ? 'USD spot × FX' : 'Daily reference'}</span></div></div>)}</div>
        <div className="dashboard-grid"><section className="panel converter"><div className="panel-heading"><div><div className="eyebrow small">POWERFUL, YET SIMPLE</div><h2>Instant converter</h2><p>Accurate conversions in just a few clicks.</p></div><div className="panel-heading-icon"><ArrowDownUp size={19} /></div></div>
          <div className="tabs"><button className={tab === 'currencies' ? 'selected' : ''} onClick={() => setTab('currencies')}><Globe2 size={16} /> Currencies</button><button className={tab === 'metals' ? 'selected' : ''} onClick={() => setTab('metals')}><Coins size={16} /> Commodities</button></div>
          {tab === 'currencies' ? <div className="converter-body"><label className="field-label" htmlFor="amount">Amount to convert</label><div className="amount-field"><span className="amount-prefix">{currencySymbol(from)}</span><input id="amount" inputMode="decimal" type="number" min="0" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Enter amount" /><RateSelect value={from} onChange={setFrom} options={options} /></div>
            <div className="switch-divider"><div /><button type="button" title="Swap currencies" aria-label="Swap currencies" onClick={swap}><ArrowDownUp size={19} /></button><div /></div>
            <label className="field-label">Convert to</label><div className="destination-field"><div className="destination-currency"><RateSelect value={to} onChange={setTo} options={options} /></div><span className="destination-help">Target currency</span></div>
            <div className="result-card"><div className="result-caption">CONVERTED AMOUNT</div><div className="result-number">{result === null ? '—' : formatNumber(result, result > 0 && result < 1 ? 6 : 2)} <span>{to}</span></div><div className="result-description">{rate != null && fxReady ? `1 ${from} = ${formatNumber(rate, rate < 0.01 ? 6 : 4)} ${to}` : 'Waiting for reference rates'}</div><div className="result-bottom"><span><span className="online-dot" /> {market.fxDate ? `FX reference · ${market.fxDate}` : 'FX unavailable'}</span><button disabled={result === null} onClick={copyResult}>{copied ? <Check size={15} /> : <Command size={15} />} {copied ? 'Copied' : 'Copy result'}</button></div></div>
          </div> : <div className="converter-body"><label className="field-label">Select commodity</label><div className="metal-pills">{METALS.map(m => <button key={m.symbol} onClick={() => setMetal(m.symbol)} className={metal === m.symbol ? 'on' : ''}>{m.name}</button>)}</div><label className="field-label" htmlFor="metal-amount">Quantity</label><div className="amount-field"><input id="metal-amount" inputMode="decimal" type="number" min="0" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Enter quantity" /><select className="unit-select" value={unit} onChange={e => setUnit(e.target.value)}><option value="g">grams (g)</option><option value="kg">kilograms (kg)</option><option value="oz">troy ounces (oz t)</option></select></div><label className="field-label spaced">Show value in</label><div className="destination-field"><RateSelect value={metalCurrency} onChange={setMetalCurrency} options={options} /><span className="destination-help">Output currency</span></div><div className="result-card"><div className="result-caption">ESTIMATED SPOT VALUE</div><div className="result-number">{metalValue === null ? '—' : formatNumber(metalValue, metalValue < 1 ? 6 : 2)} <span>{metalCurrency}</span></div><div className="result-description">{metalSpot ? `${chosenMetal.name} spot: $${formatNumber(metalSpot, 4)} / ${metal === 'HG' ? 'lb' : 'troy oz'}` : 'Commodity quote unavailable'}</div><div className="result-bottom"><span><span className="online-dot" /> {market.metals[metal] ? timeLabel(market.metals[metal].updatedAt) : 'Price unavailable'}</span><span className="estimate-label">Spot estimate only</span></div></div></div>}
          <div className="converter-note"><CircleHelp size={16} /><span>Indicative prices only. Excludes spreads, transaction fees, taxes, and dealer premiums.</span></div>
        </section>
          <section className="panel market-panel"><div className="panel-heading"><div><div className="eyebrow small">THE BIG PICTURE</div><h2>Market watchlist</h2><p>Quick reference for frequently tracked assets.</p></div><div className="panel-heading-icon"><TrendingUp size={20} /></div></div><div className="watchlist-tabs"><button className={tab === 'currencies' ? 'watch-active' : ''} onClick={() => setTab('currencies')}>Currencies</button><button className={tab === 'metals' ? 'watch-active' : ''} onClick={() => setTab('metals')}>Commodities</button></div><div className="watch-search"><Search size={17} /><input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Search assets..." aria-label="Search assets" /></div>
            <div className="table-head"><span>ASSET</span><span>REFERENCE PRICE</span></div>
            <div className="market-list">{tab === 'currencies' ? filteredCurrencies.map(c => <div className="market-row" key={c}><div className="asset-name"><span className="asset-icon">{icons[c] || '🌐'}</span><div><strong>{c} / INR</strong><small>{options.find(x => x.code === c)?.name || c}</small></div></div><div className="asset-quote"><strong>{getRate(c) == null ? '—' : `₹${formatNumber(getRate(c), 4)}`}</strong><small>per 1 {c}</small></div></div>) : filteredMetals.map(m => <div className="market-row" key={m.symbol}><div className="asset-name"><span className={`asset-icon metal-icon ${m.tone}`}><Coins size={17} /></span><div><strong>{m.name}</strong><small>{m.symbol} · spot USD</small></div></div><div className="asset-quote"><strong>{market.metals[m.symbol] ? `$${formatNumber(market.metals[m.symbol].price, 2)}` : '—'}</strong><small>per {m.symbol === 'HG' ? 'pound' : 'troy ounce'}</small></div></div>)}{(tab === 'currencies' ? filteredCurrencies : filteredMetals).length === 0 && <div className="no-matches">No assets match your search.</div>}</div>
            <div className="watch-footer"><span>Source: {tab === 'currencies' ? 'Frankfurter' : 'Gold API'}</span><a href={tab === 'currencies' ? 'https://frankfurter.dev' : 'https://gold-api.com'} target="_blank" rel="noreferrer">Data provider <ExternalLink size={13} /></a></div>
          </section></div>
        {tab === "currencies" && (
          <HistoricalChart
            from={from}
            to={to}
            theme={theme}
          />
        )}
        {(market.fxError || market.metalsError.length > 0) && <div className="warning"><CircleHelp size={18} /><span>{market.fxError ? market.fxError + ' ' : ''}{market.metalsError.length ? `Quotes unavailable for: ${market.metalsError.join(', ')}. ` : ''}Other available prices remain usable. Click Refresh rates to retry.</span></div>}
        <section className="bottom-strip"><div className="strip-icon"><ShieldCheck size={22} /></div><div><strong>Know what you're looking at.</strong><p>FX is updated from official reference sources (typically daily). Commodity spot quotes update more frequently. Values are indicative, not executable retail quotes.</p></div><a href="https://frankfurter.dev" target="_blank" rel="noreferrer">Learn more <ArrowRight size={16} /></a></section>
        </>}
        <footer className="main-footer developer-footer">
          <div className="footer-left">
            <span>© {new Date().getFullYear()} Price Convert. All rights reserved.</span>
            <span className="footer-credit">Designed &amp; Developed by <a href="https://garymeledath.com" target="_blank" rel="noopener noreferrer">Gary Meledath</a> <span className="footer-heart">✦</span></span>
          </div>
          <div className="footer-links">
            <a href="mailto:garymeledath234@gmail.com">Email</a>
            <a href="https://garymeledath.com" target="_blank" rel="noopener noreferrer">Portfolio</a>
          </div>
        </footer>
      </div>
    </main>
  </div>;
}
export default App;
