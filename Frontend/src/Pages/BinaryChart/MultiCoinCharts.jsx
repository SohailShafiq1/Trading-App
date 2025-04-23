import React from "react";
import LiveCandleChart from "./LiveCandleChart";

const MultiCoinCharts = () => {
  const coins = ["BTC", "ETH", "XRP"]; // List of coins

  return (
    <div>
      {coins.map((coin) => (
        <div key={coin} style={{ marginBottom: "20px" }}>
          <LiveCandleChart coinName={coin} />
        </div>
      ))}
    </div>
  );
};

export default MultiCoinCharts;