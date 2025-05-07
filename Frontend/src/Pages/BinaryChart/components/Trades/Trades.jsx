import React from "react";
import styles from "../../BinaryChart.module.css";

const s = styles;

const Trades = ({ trades, timer, formatTime }) => {
  return (
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
                  : "#FFF", // White for running trades
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
              <span>{formatTime(trade.duration || timer)}</span>{" "}
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
};

export default Trades;