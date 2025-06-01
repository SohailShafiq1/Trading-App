import React from "react";
import styles from "../../BinaryChart.module.css";

const s = styles;

const Trades = ({ trades, formatTime }) => (
  <div className={s.tradeHistory}>
    <p>Trades</p>
    <ul>
      {trades.map((trade, index) => (
        <li
          key={index}
          style={{
            color: "black",
            padding: "2px", // Add padding for better readability
          }}
        >
          {/* First Row: Coin Name and Trade Duration */}
          <div
            style={{
              marginBottom: "8px",
              display: "flex",
              justifyContent: "space-around",
            }}
          >
            <strong>{trade.coinName}</strong>
            <span>
              {trade.status === "running"
                ? `Time Left: ${formatTime(trade.remainingTime)}`
                : formatTime(
                    typeof trade.duration === "number" ? trade.duration : 0
                  )}
            </span>{" "}
            {/* Display trade duration */}
          </div>

          {/* Second Row: Trade Amount and Profit/Loss */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-around",
            }}
          >
            <span
              style={{
                color:
                  trade.status === "win"
                    ? "#10A055"
                    : trade.status === "loss"
                    ? "#FF0000"
                    : "black", // Change color of trade.price based on status
              }}
            >
              Trade: ${trade.price}
            </span>
            <span
              style={{
                color:
                  trade.status === "win"
                    ? "#10A055"
                    : trade.status === "loss"
                    ? "#FF0000"
                    : "black", // Change color of trade.reward based on status
              }}
            >
              {trade.status === "running"
                ? `Time Left: ${trade.remainingTime}s`
                : `${trade.reward > 0 ? "+" : ""}$${Math.abs(trade.reward)}`}
            </span>
          </div>
        </li>
      ))}
    </ul>
  </div>
);

const handleCoinClick = (coin) => {
  setSelected(coin.name);
  if (coin.name === "USD Tether(TRC-20)") {
    setShowModal(true);
  } else {
    toast.info(
      "We are working on this deposit method. Please use TRC-20 USDT for now."
    );
  }
};

export default Trades;
