import { useState } from 'react';
import { Calculator, Target, RotateCcw, Info, TrendingDown, ArrowRight } from 'lucide-react';
import '../styles.css';

// All calculations are client-side. Prices must use the same currency.
const numberFrom = (value) => {
  if (String(value).trim() === '') return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : null;
};

const moneyFormat = (value, currency, maxDecimals = 2) =>
  new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en-US', {
    style: 'currency', currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: maxDecimals
  }).format(value);

const shareFormat = (value) =>
  new Intl.NumberFormat('en-IN', { maximumFractionDigits: 3 }).format(value);

// The user can choose whole shares or 0.001-share increments.
// Buying enough units to *reach or pass* the target requires rounding UP.
export function calculateTargetShares(oldPrice, oldShares, buyPrice, targetPrice, increment = 1) {
  if (![oldPrice, oldShares, buyPrice, targetPrice].every(Number.isFinite) ||
      oldPrice <= 0 || oldShares <= 0 || buyPrice <= 0 || targetPrice <= 0) {
    return { status: 'invalid', message: 'Enter positive prices and an existing share quantity greater than zero.' };
  }

  const currentAverage = oldPrice;
  const tolerance = Math.max(1e-10, currentAverage * 1e-12);

  if (Math.abs(targetPrice - currentAverage) <= tolerance) {
    return {
      status: 'already',
      shares: 0,
      investment: 0,
      projectedAverage: currentAverage,
      message: 'Your current average already meets this target. No extra shares are needed.'
    };
  }

  // A weighted average can only move toward the additional purchase price,
  // never reach or cross that purchase price with a finite positive quantity.
  if (!(targetPrice > Math.min(currentAverage, buyPrice) &&
        targetPrice < Math.max(currentAverage, buyPrice))) {
    return {
      status: 'unreachable',
      message: buyPrice < currentAverage
        ? 'To reduce your average, the target must be below your current average and strictly above the new buy price.'
        : buyPrice > currentAverage
          ? 'To increase your average, the target must be above your current average and strictly below the new buy price.'
          : 'Buying at your current average cannot change your average price.'
    };
  }

  const exactShares = oldShares * (currentAverage - targetPrice) / (targetPrice - buyPrice);
  if (!Number.isFinite(exactShares) || exactShares <= 0) {
    return { status: 'unreachable', message: 'This target cannot be reached using the entered values.' };
  }

  const incrementsNeeded = Math.ceil(exactShares / increment - 1e-10);
  const shares = Math.max(1, incrementsNeeded) * increment;
  const investment = shares * buyPrice;
  const projectedAverage = (oldPrice * oldShares + investment) / (oldShares + shares);

  if (![shares, investment, projectedAverage].every(Number.isFinite)) {
    return { status: 'unreachable', message: 'The required investment is too large to calculate reliably.' };
  }

  return { status: 'ok', shares, investment, projectedAverage, exactShares };
}

function NumericField({ id, label, value, onChange, step = 'any', min = '0', hint }) {
  return (
    <div className="sac-field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type="number"
        inputMode="decimal"
        min={min}
        step={step}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="0"
      />
      {hint && <span className="sac-field-hint">{hint}</span>}
    </div>
  );
}

export default function StockAverageCalculator() {
  const [mode, setMode] = useState('average');
  const [currency, setCurrency] = useState('INR');
  const [oldPrice, setOldPrice] = useState('200');
  const [oldShares, setOldShares] = useState('10');
  const [buyPrice, setBuyPrice] = useState('150');
  const [buyShares, setBuyShares] = useState('10');
  const [targetPrice, setTargetPrice] = useState('175');
  const [shareMode, setShareMode] = useState('whole');

  const previousPrice = numberFrom(oldPrice);
  const previousShares = numberFrom(oldShares);
  const proposedPrice = numberFrom(buyPrice);
  const proposedShares = numberFrom(buyShares);
  const desiredPrice = numberFrom(targetPrice);

  const isAverageValid = previousPrice !== null && previousPrice > 0 &&
    previousShares !== null && proposedPrice !== null && proposedPrice > 0 &&
    proposedShares !== null && previousShares + proposedShares > 0;

  const totalShares = isAverageValid ? previousShares + proposedShares : null;
  const totalInvested = isAverageValid
    ? previousPrice * previousShares + proposedPrice * proposedShares
    : null;
  const averagePrice = isAverageValid && Number.isFinite(totalInvested)
    ? totalInvested / totalShares : null;

  const targetPlan = previousPrice !== null && previousShares !== null &&
    proposedPrice !== null && desiredPrice !== null
    ? calculateTargetShares(
        previousPrice, previousShares, proposedPrice,
        desiredPrice, shareMode === 'whole' ? 1 : 0.001
      )
    : { status: 'invalid', message: 'Fill in all prices and existing shares to calculate the target.' };

  const reset = () => {
    setOldPrice('200');
    setOldShares('10');
    setBuyPrice('150');
    setBuyShares('10');
    setTargetPrice('175');
    setCurrency('INR');
    setShareMode('whole');
  };

  return (
    <section className="sac-page">
      <div className="sac-header">
        <div>
          <span className="sac-eyebrow">YOUR HOLDINGS, MADE SIMPLE</span>
          <h1><Calculator size={30} aria-hidden="true" /> Stock average calculator<span className="title-period">.</span></h1>
          <p>Calculate your weighted average purchase price or plan how much to buy to reach a target average.</p>
        </div>
        <span className="sac-version">PRICE CONVERT v2.2</span>
      </div>

      <div className="sac-toolbar">
        <div className="sac-mode-tabs" role="group" aria-label="Calculator mode">
          <button type="button" className={mode === 'average' ? 'selected' : ''}
            aria-pressed={mode === 'average'} onClick={() => setMode('average')}>
            <Calculator size={16} /> Average purchase
          </button>
          <button type="button" className={mode === 'target' ? 'selected' : ''}
            aria-pressed={mode === 'target'} onClick={() => setMode('target')}>
            <Target size={16} /> Target average
          </button>
        </div>
        <div className="sac-actions">
          <label htmlFor="sac-currency">Currency</label>
          <select id="sac-currency" value={currency} onChange={e => setCurrency(e.target.value)}>
            <option value="INR">₹ INR</option>
            <option value="USD">$ USD</option>
          </select>
          <button type="button" className="sac-reset" onClick={reset} title="Reset sample values">
            <RotateCcw size={15} /> Reset
          </button>
        </div>
      </div>

      <div className="sac-grid">
        <div className="sac-card">
          <div className="sac-card-heading">
            <span className="sac-step">01</span>
            <div><h2>Existing holdings</h2><p>What you already own</p></div>
          </div>
          <div className="sac-fields">
            <NumericField id="sac-old-price" label={`Average purchase price (${currency})`}
              value={oldPrice} onChange={setOldPrice} min="0.000001" />
            <NumericField id="sac-old-shares" label="Shares currently held"
              value={oldShares} onChange={setOldShares} />
          </div>
          {previousPrice !== null && previousShares !== null && (
            <div className="sac-subtotal">
              <span>Existing investment</span>
              <strong>{moneyFormat(previousPrice * previousShares, currency)}</strong>
            </div>
          )}
        </div>

        <div className="sac-card">
          <div className="sac-card-heading">
            <span className="sac-step">02</span>
            <div>
              <h2>{mode === 'average' ? 'Additional purchase' : 'Plan a target average'}</h2>
              <p>{mode === 'average' ? 'What you plan to buy next' : 'Find the additional investment required'}</p>
            </div>
          </div>
          <div className="sac-fields">
            <NumericField id="sac-buy-price" label={`New buy price (${currency})`}
              value={buyPrice} onChange={setBuyPrice} min="0.000001" />
            {mode === 'average' ? (
              <NumericField id="sac-buy-shares" label="Additional shares to buy"
                value={buyShares} onChange={setBuyShares} />
            ) : (
              <NumericField id="sac-target-price" label={`Desired average price (${currency})`}
                value={targetPrice} onChange={setTargetPrice} min="0.000001" />
            )}
          </div>
          {mode === 'target' ? (
            <div className="sac-increment">
              <span>Share quantity</span>
              <div role="group" aria-label="Share purchase increments">
                <button type="button" className={shareMode === 'whole' ? 'selected' : ''}
                  aria-pressed={shareMode === 'whole'} onClick={() => setShareMode('whole')}>Whole shares</button>
                <button type="button" className={shareMode === 'fractional' ? 'selected' : ''}
                  aria-pressed={shareMode === 'fractional'} onClick={() => setShareMode('fractional')}>Fractional (0.001)</button>
              </div>
            </div>
          ) : (
            <div className="sac-subtotal">
              <span>Additional investment</span>
              <strong>{proposedPrice !== null && proposedShares !== null
                ? moneyFormat(proposedPrice * proposedShares, currency) : '—'}</strong>
            </div>
          )}
        </div>
      </div>

      <div className="sac-results" aria-live="polite">
        {mode === 'average' ? (
          averagePrice !== null && Number.isFinite(averagePrice) ? (
            <>
              <div className="sac-main-result">
                <span>NEW WEIGHTED AVERAGE PRICE</span>
                <strong>{moneyFormat(averagePrice, currency, 4)}</strong>
                <p>Calculated from the total purchase cost divided by total shares.</p>
              </div>
              <div className="sac-stat-grid">
                <div><span>Total shares</span><strong>{shareFormat(totalShares)}</strong></div>
                <div><span>Total invested</span><strong>{moneyFormat(totalInvested, currency)}</strong></div>
                <div><span>Old average</span><strong>{moneyFormat(previousPrice, currency, 4)}</strong></div>
                <div><span>Average change</span><strong className={averagePrice < previousPrice ? 'sac-good' : ''}>
                  {moneyFormat(averagePrice - previousPrice, currency, 4)}
                </strong></div>
              </div>
            </>
          ) : <div className="sac-feedback"><Info size={18} /> Enter valid positive prices and at least one share.</div>
        ) : targetPlan.status === 'ok' || targetPlan.status === 'already' ? (
          <>
            <div className="sac-main-result">
              <span>{targetPlan.status === 'already' ? 'TARGET ALREADY MET' : 'ADDITIONAL SHARES REQUIRED'}</span>
              <strong>{shareFormat(targetPlan.shares)} <small>shares</small></strong>
              <p>{targetPlan.status === 'already'
                ? targetPlan.message
                : 'Minimum quantity rounded up to your selected share increment.'}</p>
            </div>
            <div className="sac-stat-grid">
              <div><span>Additional investment</span><strong>{moneyFormat(targetPlan.investment, currency)}</strong></div>
              <div><span>Projected average</span><strong className="sac-good">
                {moneyFormat(targetPlan.projectedAverage, currency, 4)}</strong></div>
              <div><span>Target average</span><strong>{moneyFormat(desiredPrice, currency, 4)}</strong></div>
              <div><span>Projected total shares</span><strong>{shareFormat(previousShares + targetPlan.shares)}</strong></div>
            </div>
            {targetPlan.status === 'ok' && (
              <div className="sac-feedback sac-success"><TrendingDown size={17} />
                Buying {shareFormat(targetPlan.shares)} additional shares at {moneyFormat(proposedPrice, currency, 4)}
                {' '}would bring your average to {moneyFormat(targetPlan.projectedAverage, currency, 4)}.
              </div>
            )}
          </>
        ) : (
          <div className="sac-feedback"><Info size={18} /> {targetPlan.message}</div>
        )}
      </div>

      <div className="sac-notice">
        <Info size={17} />
        <p>Calculator only — no stock quotes or API calls. All prices must be in the selected currency.
          Results exclude fees, taxes and FX costs. Fractional share availability and minimum quantity
          vary by broker. Actual purchases may be rounded differently.</p>
      </div>
      <div className="sac-next"><span>Looking for a stock's latest quote?</span><span>Open the Stocks tab <ArrowRight size={15} /></span></div>
    </section>
  );
}
