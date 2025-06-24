import React, { useEffect, useState, useRef } from "react";
import styles from "../../BinaryChart.module.css";
import { io } from "socket.io-client";

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
  // State to hold real-time OTC prices by coinId
  const [currentOtcPrices, setCurrentOtcPrices] = useState({});
  const [localTimers, setLocalTimers] = useState({}); // { [tradeId]: secondsLeft }
  const [lockedResults, setLockedResults] = useState({}); // { [tradeId]: {lockedStatus, lockedReward, canBeClosed} }
  const socketRef = useRef(null);

  // Helper to get unique trade ID
  const getTradeId = (trade) => trade.id || trade._id || `${trade.startedAt}-${trade.coinName}`;

  // Subscribe to OTC price updates for all OTC coins
  useEffect(() => {
    if (!coins || coins.length === 0) return;
    if (!socketRef.current) {
      socketRef.current = io(import.meta.env.VITE_BACKEND_URL);
    }
    const socket = socketRef.current;
    const otcCoins = coins.filter((c) => c.type === "OTC" || c.type === "otc");
    otcCoins.forEach((coin) => {
      socket.on(`price:${coin.name}`, (priceData) => {
        setCurrentOtcPrices((prev) => ({
          ...prev,
          [coin._id]: parseFloat(priceData.price || priceData),
        }));
      });
    });
    return () => {
      otcCoins.forEach((coin) => {
        socket.off(`price:${coin.name}`);
      });
    };
  }, [coins]);

  // Sync localTimers with trades (add new trades instantly, remove missing ones)
  useEffect(() => {
    setLocalTimers((prev) => {
      const next = { ...prev };
      trades.forEach((trade) => {
        const tradeId = getTradeId(trade);
        if (next[tradeId] === undefined) {
          next[tradeId] = trade.remainingTime;
        }
      });
      // Remove timers for trades that no longer exist
      Object.keys(next).forEach((tradeId) => {
        if (!trades.find((t) => getTradeId(t) === tradeId)) {
          delete next[tradeId];
        }
      });
      return next;
    });
  }, [trades]);

  // Per-trade timer interval for smooth countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setLocalTimers((prev) => {
        const updated = { ...prev };
        Object.keys(updated).forEach((tradeId) => {
          if (updated[tradeId] > 0) {
            updated[tradeId] = updated[tradeId] - 1;
          }
        });
        return updated;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Lock result and payout instantly at expiry
  useEffect(() => {
    trades.forEach((trade) => {
      const tradeId = getTradeId(trade);
      if (
        localTimers[tradeId] === 0 &&
        !lockedResults[tradeId] &&
        trade.status === "running"
      ) {
        // Calculate locked result
        let endPrice = 0;
        if (trade.coinType === "OTC" || trade.coinType === "otc") {
          endPrice = currentOtcPrices[trade.coinId] ?? 0;
        } else if (typeof getPriceForTrade === "function") {
          endPrice = getPriceForTrade(trade) ?? 0;
        } else {
          endPrice =
            trade.coinType === "Live"
              ? parseFloat(livePrice)
              : parseFloat(otcPrice);
        }
        const coinData = coins.find(
          (c) => c._id === trade.coinId || c.name === trade.coinName || c.name === trade.coin
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
        const lockedReward = isWin
          ? Math.round((basePayout + centsChange) * 100) / 100
          : Math.round(centsChange * 100) / 100;
        setLockedResults((prev) => ({
          ...prev,
          [tradeId]: {
            lockedStatus: isWin ? "win" : "loss",
            lockedReward,
            canBeClosed: isWin,
          },
        }));
        // Optionally, update backend here if needed
      }
    });
    // eslint-disable-next-line
  }, [localTimers, trades, currentOtcPrices, livePrice, otcPrice, getPriceForTrade, coins]);

  return (
    <div className={s.tradeHistory}>
      <p>Trades</p>
      <ul>
        {trades.map((trade) => {
          const tradeId = getTradeId(trade);
          // Use locked result if available
          const locked = lockedResults[tradeId] || {};
          let displayReward = locked.lockedReward ?? trade.lockedReward ?? trade.reward;
          let displayStatus = locked.lockedStatus ?? trade.lockedStatus ?? trade.status;
          const canBeClosed = locked.canBeClosed ?? trade.canBeClosed;
          const coinData = coins.find((c) => c._id === trade.coinId || c.name === trade.coinName);
          // Show trade open price and current price
          const openPrice = trade.entryPrice;
          let currentPrice = 0;
          if (trade.coinId && currentOtcPrices[trade.coinId] !== undefined) {
            currentPrice = currentOtcPrices[trade.coinId];
          } else if (typeof getPriceForTrade === "function") {
            currentPrice = getPriceForTrade(trade) ?? 0;
          }
          return (
            <li
              key={tradeId}
              style={{
                color: "black",
                padding: "2px",
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
                <strong>
                  {coinData?.firstName}/{coinData?.lastName}
                </strong>
                <span>
                  {trade.type === "Buy" ? (
                    <span style={{ color: "#10A055", fontWeight: 600 }}>
                      Buy
                    </span>
                  ) : (
                    <span style={{ color: "#FF0000", fontWeight: 600 }}>
                      Sell
                    </span>
                  )}
                </span>{" "}
              </div>

              {/* Second Row: Trade Amount and Result */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-around",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span
                  style={{
                    color:
                      displayStatus === "win"
                        ? "#10A055"
                        : displayStatus === "loss"
                        ? "#FF0000"
                        : "black",
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
                        : "black",
                  }}
                >
                  {displayStatus === "running" && localTimers[tradeId] > 0
                    ? `Time Left: ${localTimers[tradeId]}s`
                    : `Payout: $${displayReward}`}
                </span>
              </div>
              {/* Third Row: Open Price and Current Price */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-around",
                  alignItems: "center",
                  gap: 8,
                  marginTop: 4,
                  fontSize: "0.95em",
                }}
              >
                <span>Open Price: ${openPrice}</span>
                <span>Current Price: ${currentPrice}</span>
              </div>
              {/* New Close Trade button: only for win trades, only if not already closed */}
              {locked.lockedStatus === "win" && displayStatus === "running" && localTimers[tradeId] === 0 && canBeClosed && (
                <div style={{ marginTop: 8, textAlign: "center" }}>
                  <button
                    onClick={() => handleCloseTrade(trade)}
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

export default Trades;
