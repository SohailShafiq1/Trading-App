import React, { useEffect, useRef } from "react";

const TradingViewChart = ({ coinName }) => {
  const containerRef = useRef();

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/tv.js";
    script.async = true;

    script.onload = () => {
      if (window.TradingView) {
        new window.TradingView.widget({
          container_id: containerRef.current.id,
          autosize: true,
          symbol: `BINANCE:${coinName}USDT`,
          interval: "1",
          timezone: "Etc/UTC",
          theme: "light",
          style: "1",
          locale: "en",
          toolbar_bg: "#1e1e1e",
          enable_publishing: false,
          allow_symbol_change: false,
          hide_top_toolbar: false,
          overrides: {
            "paneProperties.background": "#0d0d0d", // main chart bg
            "paneProperties.vertGridProperties.color": "#2a2e39",
            "paneProperties.horzGridProperties.color": "#2a2e39",
            "scalesProperties.textColor": "#AAA", // axis text
          },
        });
      }
    };

    document.body.appendChild(script);

    return () => {
      script.remove();
    };
  }, [coinName]);

  return (
    <div
      id={`tv-chart-${coinName}`}
      ref={containerRef}
      style={{ width: "100%", height: "100%" }}
    />
  );
};

export default TradingViewChart;
