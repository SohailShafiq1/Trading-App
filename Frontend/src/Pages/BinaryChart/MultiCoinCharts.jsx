import React from "react";
import LiveCandleChart from "./LiveCandleChart";

const MultiCoinCharts = () => {
  // List of coins with their trading ranges
  const coins = [
    { name: "BTC", min: 500, max: 900 },
    { name: "ETH", min: 400, max: 600 },
    { name: "XRP", min: 0.5, max: 1.5 },
    { name: "EUR/USD", min: 1.05, max: 1.15 },
    { name: "GBP/USD", min: 1.20, max: 1.35 },
    { name: "USD/JPY", min: 130, max: 140 },
    { name: "AUD/USD", min: 0.65, max: 0.75 },
    { name: "USD/CAD", min: 1.25, max: 1.35 },
    { name: "NZD/USD", min: 0.60, max: 0.70 },
    { name: "USD/CHF", min: 0.90, max: 1.00 },
    { name: "EUR/GBP", min: 0.85, max: 0.95 },
    { name: "EUR/JPY", min: 140, max: 150 },
    { name: "GBP/JPY", min: 155, max: 165 },
  ];

  return (
    <div>
      {coins.map((coin) => (
        <div key={coin.name} style={{ marginBottom: "20px" }}>
          <h3>{coin.name}</h3>
          <LiveCandleChart coinName={coin.name} min={coin.min} max={coin.max} />
        </div>
      ))}
    </div>
  );
};

export default MultiCoinCharts;