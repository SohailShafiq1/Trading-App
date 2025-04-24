import React, { useState } from "react";
import { FiArrowDownRight } from "react-icons/fi";
import styles from "./BinaryChart.module.css";
import LiveCandleChart from "./LiveCandleChart";

const s = styles;

const BinaryChart = () => {
  const [timer, setTimer] = useState(60); // Timer in seconds (default 1 minute)
  const [investment, setInvestment] = useState(10); // Investment in dollars (default $10)
  const [popupMessage, setPopupMessage] = useState(""); // Message for the popup
  const [popupColor, setPopupColor] = useState(""); // Background color for the popup
  const [showPopup, setShowPopup] = useState(false); // Control popup visibility
  const [trades, setTrades] = useState([]); // List of trades
  const [coinPrice, setCoinPrice] = useState(100); // Current price of the coin (default $100)
  const [selectedCoin, setSelectedCoin] = useState("BTC"); // Default selected coin

  const coins = ["BTC", "ETH", "XRP"]; // List of coins

  const handleBuy = () => {
    setPopupMessage(`Buy at $${coinPrice}`); // Include coin price in the message
    setPopupColor("#10A055"); // Green background for Buy
    setShowPopup(true);
    setTrades((prevTrades) => [
      ...prevTrades,
      { type: "Buy", price: investment, coinPrice, coinName: selectedCoin }, // Include selectedCoin
    ]); // Add trade to the list
    setTimeout(() => setShowPopup(false), 2000); // Hide popup after 2 seconds
  };

  const handleSell = () => {
    setPopupMessage(`Sell at $${coinPrice}`); // Include coin price in the message
    setPopupColor("#FF1600"); // Red background for Sell
    setShowPopup(true);
    setTrades((prevTrades) => [
      ...prevTrades,
      { type: "Sell", price: investment, coinPrice, coinName: selectedCoin }, // Include selectedCoin
    ]); // Add trade to the list
    setTimeout(() => setShowPopup(false), 2000); // Hide popup after 2 seconds
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(
      remainingSeconds
    ).padStart(2, "0")}`;
  };

  return (
    <>
      <div className={s.container}>
        {/* Coin Selection */}

        <div className={s.chart}>
          <div className={s.coinList}>
            {coins.map((coin) => (
              <button
                key={coin}
                className={`${s.coinButton} ${
                  selectedCoin === coin ? s.activeCoin : ""
                }`}
                onClick={() => setSelectedCoin(coin)}
              >
                {coin}
              </button>
            ))}
          </div>
          {/* Pass the selected coin to the LiveCandleChart */}
          <LiveCandleChart coinName={selectedCoin} />
        </div>

        <div className={s.control}>
          <h1>{selectedCoin} Trading</h1>
          <p>Current Coin Price: ${coinPrice}</p>
          {/* Timer Control */}
          <div className={s.controlBox}>
            <button
              className={s.iconBtn}
              onClick={() => setTimer((prev) => Math.max(prev - 30, 30))}
            >
              −
            </button>
            <div className={s.value}>{formatTime(timer)}</div>
            <button
              className={s.iconBtn}
              onClick={() => setTimer((prev) => Math.min(prev + 30, 300))}
            >
              +
            </button>
          </div>
          <div className={s.moneyBox}>
            <button
              className={s.iconBtn}
              onClick={() => setInvestment((prev) => Math.max(prev - 1, 1))}
            >
              −
            </button>
            <input
              type="number"
              className={s.value}
              value={investment}
              onChange={(e) =>
                setInvestment(Math.max(parseInt(e.target.value, 10) || 1, 1))
              }
              min="1"
            />
            <button
              className={s.iconBtn}
              onClick={() => setInvestment((prev) => prev + 1)}
            >
              +
            </button>
          </div>
          {/* Buy/Sell Buttons */}
          <div className={s.buySelling}>
            <div className={s.buyBox} onClick={handleBuy}>
              <FiArrowDownRight className={s.icons} />
              <p>Buy</p>
            </div>
            <div className={s.SellBox} onClick={handleSell}>
              <FiArrowDownRight className={s.icons} />
              <p>Sell</p>
            </div>
          </div>
          {/* Trade History */}
          <div className={s.tradeHistory}>
            <p>Trades</p>
            <ul>
              {trades.map((trade, index) => (
                <li
                  key={index}
                  style={{
                    color: trade.type === "Buy" ? "#10A055" : "#FF1600",
                  }}
                >
                  {trade.type}: ${trade.price} at Coin Price: ${trade.coinPrice}{" "}
                  ({trade.coinName})
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      {/* Popup */}
      {showPopup && (
        <div className={s.popup} style={{ backgroundColor: popupColor }}>
          <p>{popupMessage}</p>
        </div>
      )}
    </>
  );
};

export default BinaryChart;
