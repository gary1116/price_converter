
import { useEffect, useRef } from "react";

export default function StockQuote({
  symbol,
  theme = "light"
}) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.replaceChildren();

    const widget = document.createElement("div");
    widget.className =
      "tradingview-widget-container__widget";

    container.appendChild(widget);

    const script = document.createElement("script");
    script.type = "text/javascript";
    script.async = true;
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-symbol-info.js";

    script.textContent = JSON.stringify({
      symbol: symbol,
      width: "100%",
      locale: "en",
      colorTheme: theme === "dark" ? "dark" : "light",
      isTransparent: false
    });

    container.appendChild(script);

    return () => {
      container.replaceChildren();
    };
  }, [symbol, theme]);

  return (
    <section
      className="stock-quote-panel"
      aria-label={`Stock quote for ${symbol}`}
    >
      <div className="stock-quote-heading">
        <span className="eyebrow small">
          LATEST AVAILABLE STOCK QUOTE
        </span>
      </div>

      <div
        className="tradingview-widget-container stock-quote-widget"
        ref={containerRef}
      />

      <p className="stock-quote-credit">
        Quote provided by{" "}
        <a
          href="https://www.tradingview.com/"
          target="_blank"
          rel="noopener noreferrer"
        >
          TradingView
        </a>
        . Prices may be delayed.
      </p>
    </section>
  );
}
