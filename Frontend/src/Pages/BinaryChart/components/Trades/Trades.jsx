import React, { useEffect } from "react";
import styles from "../../BinaryChart.module.css";

const s = styles;

const Trades = ({
  trades,
  formatTime,
  handleCloseTrade,
  coins,
  livePrice,
  otcPrice,
  getPriceForTrade, // <-- add this
  setUserTrades,
  setSelected,
  setShowModal,
  toast,
}) => {
  useEffect(() => {
    const interval = setInterval(() => {
      if (typeof setUserTrades === 'function') {
        setUserTrades((prevTrades) =>
          prevTrades.map((trade) => {
            if (trade.remainingTime > 1) {
              return { ...trade, remainingTime: trade.remainingTime - 1 };
            } else if (trade.remainingTime === 1) {
              // Timer will hit 0 now, lock status and reward
              const endPrice = getPriceForTrade(trade) ?? 0;
              const coinData = coins.find(
                (c) => c.name === trade.coinName || c.name === trade.coin
              );
              const profitPercentage = coinData?.profitPercentage || 0;
              const tradeInvestment = trade.investment ?? trade.price ?? 0;
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
              const basePayout = tradeInvestment * (1 + profitPercentage / 100);
              const isWin = centsChange >= 0;
              // If win: basePayout + centsChange, if loss: only centsChange (base payout is zero)
              const lockedReward = isWin
                ? Math.round((basePayout + centsChange) * 100) / 100
                : Math.round(centsChange * 100) / 100;
              const lockedStatus = isWin ? "win" : "loss";
              return {
                ...trade,
                remainingTime: 0,
                lockedStatus,
                lockedReward,
              };
            } else {
              // After timer 0, do not recalculate anything, just keep locked values
              return trade;
            }
          })
        );
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [coins, getPriceForTrade, setUserTrades]);

  return (
    <div className={s.tradeHistory}>
      <p>Trades</p>
      <ul>
        {trades.map((trade) => {
          let displayReward = trade.lockedReward ?? trade.reward;
          let displayStatus = trade.lockedStatus ?? trade.status;
          const tradeInvestment = trade.investment ?? trade.price ?? 0;
          const tradeId =
            trade.id || trade._id || `${trade.startedAt}-${trade.coinName}`;
          const coinData = coins.find((c) => c.name === trade.coinName);
          const profitPercentage = coinData?.profitPercentage || 0;
          // Calculate basePayout (investment + profit percentage)
          const basePayout = tradeInvestment * (1 + profitPercentage / 100);
          // Only show floating PnL for trades that are still running and have time left
          if (trade.status === "running" && trade.remainingTime > 0) {
            let endPrice = 0;
            if (typeof getPriceForTrade === "function") {
              endPrice = getPriceForTrade(trade) ?? 0;
            } else {
              endPrice =
                trade.coinType === "Live"
                  ? parseFloat(livePrice)
                  : parseFloat(otcPrice);
            }

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

            // Always use basePayout as the starting point for floating PnL
            let rawReward = basePayout + centsChange;
            displayReward = round2(rawReward).toFixed(2);
            displayStatus = centsChange >= 0 ? "win" : "loss";
          } else if (trade.status === "running" && trade.remainingTime === 0) {
            let endPrice = 0;
            if (typeof getPriceForTrade === "function") {
              endPrice = getPriceForTrade(trade) ?? 0;
            } else {
              endPrice =
                trade.coinType === "Live"
                  ? parseFloat(livePrice)
                  : parseFloat(otcPrice);
            }

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

            // Always use basePayout as the starting point for final PnL
            const rawReward = basePayout + centsChange;
            displayReward = round2(rawReward).toFixed(2);
            displayStatus = centsChange >= 0 ? "win" : "loss";
          } else if (trade.status === "win" || trade.status === "loss") {
            // After timer 0, always use backend-locked reward and status, never recalculate
            displayReward =
              typeof trade.reward === "number"
                ? trade.reward.toFixed(2)
                : trade.reward;
            displayStatus =
              trade.status === "running" && trade.result
                ? trade.result
                : trade.status;
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
                    onClick={() =>
                      handleCloseTrade({
                        ...trade,
                        // Pass the exact reward shown in the UI to the backend
                        frontendReward: displayReward,
                      })
                    }
                    className={styles.closeTradeBtn}
                  >
                    Close Trade
                  </button>
                </div>
              )}
              <div>
                {trade.openedByAdmin && (
                  <span
                    style={{
                      marginLeft: 8,
                      background: "#388e3c",
                      color: "#fff",
                      borderRadius: 4,
                      padding: "2px 8px",
                      fontSize: "0.85em",
                    }}
                  >
                    Opened by Admin
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

function round2(num) {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

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
