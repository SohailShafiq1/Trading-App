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
  forexPrice,
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
  const [processedTrades, setProcessedTrades] = useState(new Set()); // Track which trades have been processed
  const [recentlyClosed, setRecentlyClosed] = useState(new Set()); // Track trades just closed
  const socketRef = useRef(null);

  // Helper to get unique trade ID
  const getTradeId = (trade) =>
    trade.id || trade._id || `${trade.startedAt}-${trade.coinName}`;

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

    // Also clean up processed trades set for trades that no longer exist
    setProcessedTrades((prev) => {
      const existingTradeIds = trades.map((trade) => getTradeId(trade));
      return new Set(
        [...prev].filter((tradeId) => existingTradeIds.includes(tradeId))
      );
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

  // Lock result and payout instantly at expiry (only once per trade)
  useEffect(() => {
    trades.forEach((trade) => {
      const tradeId = getTradeId(trade);
      if (
        localTimers[tradeId] === 0 &&
        !lockedResults[tradeId] &&
        trade.status === "running" &&
        // Additional check: only if trade result is still pending
        (!trade.result || trade.result === "pending") &&
        // Ensure we haven't already processed this trade
        !processedTrades.has(tradeId)
      ) {
        // Mark this trade as processed
        setProcessedTrades((prev) => new Set([...prev, tradeId]));
        // Calculate locked result
        let endPrice = 0;
        if (trade.coinType === "OTC" || trade.coinType === "otc") {
          endPrice = currentOtcPrices[trade.coinId] ?? 0;
        } else if (typeof getPriceForTrade === "function") {
          endPrice = getPriceForTrade(trade) ?? 0;
        } else {
          // Fallback based on coin type
          if (trade.coinType === "Live") {
            endPrice = parseFloat(livePrice) || 0;
          } else if (trade.coinType === "Forex") {
            endPrice = parseFloat(forexPrice) || 0;
          } else {
            endPrice = parseFloat(otcPrice) || 0;
          }
        }
        const coinData = coins.find(
          (c) =>
            c._id === trade.coinId ||
            c.name === trade.coinName ||
            c.name === trade.coin
        );
        const profitPercentage = coinData?.profitPercentage || 0;
        const tradeInvestment = trade.investment ?? trade.price ?? 0;
        let centsChange = 0;
        let isWin = false;

        // Correct binary options win/loss logic
        if (trade.type === "Buy") {
          // Buy wins if current price is higher than entry price
          isWin = endPrice > trade.entryPrice;
        } else {
          // Sell wins if current price is lower than entry price
          isWin = endPrice < trade.entryPrice;
        }
        const basePayout = tradeInvestment * (1 + profitPercentage / 100);
        const lockedReward = isWin ? Math.round(basePayout * 100) / 100 : 0;
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
  }, [
    localTimers,
    trades,
    currentOtcPrices,
    livePrice,
    otcPrice,
    forexPrice,
    getPriceForTrade,
    coins,
    processedTrades,
  ]);

  return (
    <div className={s.tradesContainer}>
      <div className={s.tradeHistory}>
        <p>Trades</p>
        <ul>
          {trades.map((trade) => {
            const tradeId = getTradeId(trade);
            // Use locked result if available
            const locked = lockedResults[tradeId] || {};
            let displayReward =
              locked.lockedReward ?? trade.lockedReward ?? trade.reward;
            let displayStatus =
              locked.lockedStatus ?? trade.lockedStatus ?? trade.status;
            const canBeClosed = locked.canBeClosed ?? trade.canBeClosed;
            const coinData = coins.find(
              (c) => c._id === trade.coinId || c.name === trade.coinName
            );
            // Show trade open price and current price
            const openPrice = trade.entryPrice;
            let currentPrice = 0;
            if (trade.coinId && currentOtcPrices[trade.coinId] !== undefined) {
              currentPrice = currentOtcPrices[trade.coinId];
            } else if (typeof getPriceForTrade === "function") {
              currentPrice = getPriceForTrade(trade) ?? 0;
            } else {
              // Fallback based on coin type
              if (trade.coinType === "Live") {
                currentPrice = parseFloat(livePrice) || 0;
              } else if (trade.coinType === "Forex") {
                currentPrice = parseFloat(forexPrice) || 0;
              } else {
                currentPrice = parseFloat(otcPrice) || 0;
              }
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
                {/* Close Trade button: ONLY for confirmed winning trades that require manual close */}
                {(() => {
                  // Only show button if trade is not closed and not recently closed
                  if (
                    trade.status === "closed" ||
                    displayStatus === "closed" ||
                    recentlyClosed.has(tradeId)
                  )
                    return false;

                  // Winning trade logic
                  const isWinningTrade =
                    // Case 1: Trade result is explicitly "win" and requires manual close
                    ((trade.result === "win" || displayStatus === "win") &&
                      (trade.manualClose === true || canBeClosed === true)) ||
                    // Case 2: Timer expired and locked result shows win
                    (locked.lockedStatus === "win" &&
                      localTimers[tradeId] === 0 &&
                      canBeClosed === true);

                  // Safety check: never show for any losing conditions
                  const isLosingTrade =
                    trade.result === "loss" ||
                    locked.lockedStatus === "loss" ||
                    displayStatus === "loss";

                  // Only show button if it's a winning trade AND not a losing trade
                  return isWinningTrade && !isLosingTrade;
                })() && (
                  <div style={{ marginTop: 8, textAlign: "center" }}>
                    <button
                      onClick={() => {
                        handleCloseTrade(trade);
                        // Optionally, optimistically update lockedResults to hide button instantly
                        setLockedResults((prev) => ({
                          ...prev,
                          [getTradeId(trade)]: {
                            ...(prev[getTradeId(trade)] || {}),
                            lockedStatus: "closed",
                            canBeClosed: false,
                          },
                        }));
                        setRecentlyClosed((prev) => new Set([...prev, tradeId]));
                      }}
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
    </div>
  );
};

export default Trades;
