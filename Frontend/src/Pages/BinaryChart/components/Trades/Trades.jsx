import React from "react";
import styles from "../../BinaryChart.module.css";

const Trades = ({ trades, formatTime, onCloseTrade }) => (
  <div className={styles.tradeHistory}>
    <p>Trades</p>
    <ul>
      {trades.map((trade, index) => (
        <li
          key={index}
          style={{
            color: "black",
            padding: "8px",
            marginBottom: "8px",
            backgroundColor: "#f5f5f5",
            borderRadius: "4px",
          }}
        >
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
                : formatTime(trade.duration || 0)}
            </span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "8px",
            }}
          >
            <span style={{ color: "black" }}>Trade: ${trade.price}</span>
            <span
              style={{
                color:
                  trade.status === "win"
                    ? "#10A055"
                    : trade.status === "loss"
                    ? "#FF0000"
                    : trade.status === "can_close"
                    ? trade.calculatedReward > 0
                      ? "#10A055"
                      : "#FF0000"
                    : "black",
                fontWeight: "bold",
              }}
            >
              {trade.status === "running"
                ? `Time Left: ${trade.remainingTime}s`
                : trade.status === "can_close"
                ? `${trade.calculatedReward > 0 ? "+" : ""}$${Math.abs(
                    trade.calculatedReward
                  )}`
                : `${trade.reward > 0 ? "+" : ""}$${Math.abs(trade.reward)}`}
            </span>
          </div>
          {trade.canClose && (
            <div style={{ textAlign: "center" }}>
              <button
                onClick={() => onCloseTrade(trade.id)}
                style={{
                  backgroundColor:
                    trade.calculatedReward > 0 ? "#10A055" : "#FF1600",
                  color: "white",
                  border: "none",
                  padding: "6px 12px",
                  borderRadius: "4px",
                  cursor: "pointer",
                  width: "100%",
                }}
              >
                Close Trade
              </button>
            </div>
          )}
        </li>
      ))}
    </ul>
  </div>
);

export default Trades;
