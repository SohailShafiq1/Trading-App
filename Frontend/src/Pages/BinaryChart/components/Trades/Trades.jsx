import React from "react";
import styles from "../../BinaryChart.module.css";

const s = styles;

const Trades = ({
  trades,
  formatTime,
  handleCloseTrade,
  coins,
  livePrice,
  otcPrice,
}) => (
  <div className={s.tradeHistory}>
    <p>Trades</p>
    <ul>
      {trades.map((trade) => {
        let displayStatus = trade.status;
        let displayReward = trade.reward;
        const tradeInvestment = trade.investment ?? trade.price ?? 0;
        const tradeId =
          trade.id || trade._id || `${trade.startedAt}-${trade.coinName}`;
        // For running trades with time up, show real-time floating PnL
        if (trade.status === "running" && trade.remainingTime === 0) {
          const endPrice =
            trade.coinType === "Live"
              ? parseFloat(livePrice)
              : parseFloat(otcPrice);
          const coinData = coins.find((c) => c.name === trade.coinName);
          const profitPercentage = coinData?.profitPercentage || 0;

          let centsChange = 0;
          if (trade.type === "Buy") {
            centsChange =
              (endPrice - trade.entryPrice) *
              (tradeInvestment / trade.entryPrice);
          } else {
            centsChange =
              (trade.entryPrice - endPrice) *
              (tradeInvestment / trade.entryPrice);
          }

          // Show floating payout: base payout + profit percentage if in profit, or just floating PnL if in loss
          if (centsChange >= 0) {
            // In profit: show payout with profit percentage + floating profit
            displayReward = (
              tradeInvestment * (1 + profitPercentage / 100) +
              centsChange
            ).toFixed(2);
            displayStatus = "win";
          } else {
            // In loss: show only floating loss (can go below zero)
            displayReward = (tradeInvestment + centsChange).toFixed(2);
            displayStatus = "loss";
          }
        }

        return (
          <li
            key={tradeId}
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
                {trade.type === "Buy" ? (
                  <span style={{ color: "#10A055", fontWeight: 600 }}>Buy</span>
                ) : (
                  <span style={{ color: "#FF0000", fontWeight: 600 }}>
                    Sell
                  </span>
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
                    displayStatus === "win"
                      ? "#10A055"
                      : displayStatus === "loss"
                      ? "#FF0000"
                      : "black", // Change color of trade.price based on status
                }}
              >
                Trade: ${trade.price}
              </span>
              <span
                style={{
                  color:
                    displayStatus === "win"
                      ? "#10A055"
                      : displayStatus === "loss"
                      ? "#FF0000"
                      : "black", // Change color of trade.reward based on status
                }}
              >
                {trade.status === "running" && trade.remainingTime > 0
                  ? `Time Left: ${trade.remainingTime}s`
                  : `Payout: $${displayReward}`}
              </span>
            </div>
            {trade.status === "running" && trade.remainingTime === 0 && (
              <div className={styles.tradeRow}>
                <button
                  onClick={() => handleCloseTrade(trade)}
                  className={styles.closeTradeBtn}
                >
                  Close Trade
                </button>
              </div>
            )}
          </li>
        );
      })}
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
