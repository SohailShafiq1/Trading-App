import React, { useState } from "react";
import TradingViewChart from "./TradingViewChart";

const allowedCoins = ["BTC", "ETH", "XRP", "DOGE"]; // Add more as needed

const CoinChartSelector = () => {
  const [selectedCoin, setSelectedCoin] = useState(allowedCoins[0]);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">Select a Coin</h2>

      <select
        value={selectedCoin}
        onChange={(e) => setSelectedCoin(e.target.value)}
        className="p-2 rounded border mb-4"
      >
        {allowedCoins.map((coin) => (
          <option key={coin} value={coin}>
            {coin}
          </option>
        ))}
      </select>

      <TradingViewChart coinName={selectedCoin} />
    </div>
  );
};

export default CoinChartSelector;
