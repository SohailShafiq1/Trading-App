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
            color:
              trade.status === "win"
                ? "#10A055"
                : trade.status === "loss"
                ? "#FF1600"
                : "#FFF",
            padding: "10px", // Add padding for better readability
          }}
        >
          {/* First Row: Coin Name and Trade Duration */}
          <div
            style={{
              marginBottom: "8px",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <strong>{trade.coinName}</strong>
            <span>
              {trade.status === "running"
                ? `Time Left: ${formatTime(trade.remainingTime)}`
                : formatTime(typeof trade.duration === "number" ? trade.duration : 0)}
            </span>{" "}
            {/* Display trade duration */}
          </div>

          {/* Second Row: Trade Amount and Profit/Loss */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <span>Trade: ${trade.price}</span>
            <span>
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

// Example trade data
const tradeData = {
  coinName: "BTC/USD",
  price: 10000,
  status: "running",
  reward: 0,
  duration: 300,
  startedAt: new Date(),
  // ...other fields
};

export default Trades;