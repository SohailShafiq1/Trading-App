import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./UserTrade.module.css";
import CoinSelector from "../../../Pages/BinaryChart/components/CoinSelector/CoinSelector";
import Trades from "../../../Pages/BinaryChart/components/Trades/Trades"; // Import the Trades component
const s = styles;

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

function calculatePayout(trade, coins, getPriceForTrade) {
  let displayReward = trade.lockedReward ?? trade.reward;
  let displayStatus = trade.lockedStatus ?? trade.status;
  const tradeInvestment = trade.investment ?? trade.price ?? 0;
  let endPrice =
    typeof getPriceForTrade === "function" ? getPriceForTrade(trade) : 0;

  // Only calculate floating PnL if trade is running and timer > 0
  if (trade.status === "running" && trade.remainingTime > 0) {
    const coinData = coins.find((c) => c.name === trade.coinName);
    const profitPercentage = coinData?.profitPercentage || 0;
    const basePayout = tradeInvestment * (1 + profitPercentage / 100);

    let centsChange = 0;
    if (trade.type === "Buy") {
      centsChange =
        (endPrice - trade.entryPrice) * (tradeInvestment / trade.entryPrice);
    } else {
      centsChange =
        (trade.entryPrice - endPrice) * (tradeInvestment / trade.entryPrice);
    }

    let rawReward = basePayout + centsChange;
    displayReward = round2(rawReward).toFixed(2);
    displayStatus = centsChange >= 0 ? "win" : "loss";
  } else {
    // After timer 0, always use backend-locked reward and status
    displayReward =
      typeof trade.reward === "number" ? trade.reward.toFixed(2) : trade.reward;
    displayStatus = trade.status;
  }
  return { payout: displayReward, status: displayStatus };
}

const UserTrade = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeUser, setActiveUser] = useState(null);
  const [showCoinSelector, setShowCoinSelector] = useState(false);
  const [coins, setCoins] = useState([]);
  const [userCoinMap, setUserCoinMap] = useState({});
  const [tradeAmount, setTradeAmount] = useState(10);
  const [tradeTimer, setTradeTimer] = useState(60);
  const [tradeLoading, setTradeLoading] = useState(false);
  const [tradeMessage, setTradeMessage] = useState("");
  const [adminTrades, setAdminTrades] = useState([]);
  const [loadingAdminTrades, setLoadingAdminTrades] = useState(true);
  const [userTrades, setUserTrades] = useState([]);
  const [loadingUserTrades, setLoadingUserTrades] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/users`)
      .then((res) => res.json())
      .then((data) => {
        setUsers(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/coins`)
      .then((res) => res.json())
      .then((data) => setCoins(data))
      .catch(() => setCoins([]));
  }, []);

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/admin/admin-trades`)
      .then((res) => res.json())
      .then((data) => {
        setAdminTrades(data);
        setLoadingAdminTrades(false);
      })
      .catch(() => setLoadingAdminTrades(false));
  }, []);

  useEffect(() => {
    if (!activeUser) return;
    setLoadingUserTrades(true);

    // Fetch trades immediately
    const fetchTrades = () => {
      fetch(`${BACKEND_URL}/api/users/trades/${activeUser.email}`)
        .then((res) => res.json())
        .then((data) => {
          setUserTrades(data);
          setLoadingUserTrades(false);
        })
        .catch(() => setLoadingUserTrades(false));
    };

    fetchTrades();
    // Poll every 3 seconds
    const interval = setInterval(fetchTrades, 3000);
    return () => clearInterval(interval);
  }, [activeUser]);

  // Helper to get selected coin for user
  const selectedCoin = activeUser ? userCoinMap[activeUser._id] : null;

  // Handle trade
  const handleTrade = async (type) => {
    if (!activeUser) return;
    if (!selectedCoin) {
      setTradeMessage("Please select a coin first!");
      return;
    }
    if (!tradeAmount || tradeAmount <= 0) {
      setTradeMessage("Please enter a valid amount.");
      return;
    }
    if (!tradeTimer || tradeTimer < 10) {
      setTradeMessage("Please enter a valid timer (min 10s).");
      return;
    }
    setTradeLoading(true);
    setTradeMessage("");
    try {
      // Get coin price (for Live coins, use Binance API; for OTC, use your backend)
      let entryPrice = 0;
      const coinObj = coins.find((c) => c.name === selectedCoin);
      if (coinObj?.type === "Live") {
        const res = await fetch(
          `https://api.binance.com/api/v3/ticker/price?symbol=${selectedCoin}USDT`
        );
        const data = await res.json();
        entryPrice = parseFloat(data.price);
      } else {
        // OTC
        const res = await fetch(
          `${BACKEND_URL}/api/coins/price/${selectedCoin}`
        );
        const data = await res.json();
        entryPrice = parseFloat(data.price || data);
      }

      // Call backend to open trade
      const trade = {
        type,
        coin: selectedCoin,
        coinType: coinObj?.type || "Live",
        investment: tradeAmount,
        entryPrice,
        startedAt: new Date(),
        duration: tradeTimer,
        result: "pending",
        reward: 0,
      };

      const response = await fetch(`${BACKEND_URL}/api/users/trade`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: activeUser.email,
          trade,
          openedByAdmin: true, // Mark as opened by admin
        }),
      });

      const result = await response.json();
      if (response.ok) {
        setTradeMessage("Trade opened successfully!");
        // Optionally, update user's assets in UI
        setActiveUser((prev) =>
          prev
            ? {
                ...prev,
                assets:
                  typeof prev.assets === "number"
                    ? prev.assets - tradeAmount
                    : {
                        ...prev.assets,
                        USDT: (prev.assets?.USDT || 0) - tradeAmount,
                      },
              }
            : prev
        );
      } else {
        setTradeMessage(result.error || "Failed to open trade.");
      }
    } catch (err) {
      setTradeMessage("Failed to open trade.");
    } finally {
      setTradeLoading(false);
    }
  };

  // --- BEGIN: Legacy manual close logic (commented for reference) ---
  /*
  const handleCloseTrade = async (trade) => {
    try {
      let endPrice;
      if (trade.coinType === "Live") {
        const response = await fetch(
          `https://api.binance.com/api/v3/ticker/price?symbol=${trade.coin}USDT`
        );
        const data = await response.json();
        endPrice = parseFloat(data.price);
      } else {
        const response = await fetch(
          `${BACKEND_URL}/api/coins/price/${trade.coin}`
        );
        const data = await response.json();
        endPrice = parseFloat(data.price || data);
      }

      const coinData = coins.find((c) => c.name === trade.coin);
      const profitPercentage = coinData?.profitPercentage || 0;
      const tradeInvestment = trade.investment ?? trade.price ?? 0;

      let centsChange = 0;
      if (trade.type === "Buy") {
        centsChange =
          (endPrice - trade.entryPrice) * (tradeInvestment / trade.entryPrice);
      } else {
        centsChange =
          (trade.entryPrice - endPrice) * (tradeInvestment / trade.entryPrice);
      }

      let isWin = centsChange >= 0;
      let reward;

      if (isWin) {
        reward = (
          tradeInvestment * (1 + profitPercentage / 100) +
          centsChange
        ).toFixed(2);
      } else {
        reward = (tradeInvestment + centsChange).toFixed(2);
      }

      // Update trade result in backend
      await fetch(`${BACKEND_URL}/api/users/trade/result`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: activeUser.email,
          startedAt: trade.startedAt,
          result: isWin ? "win" : "loss",
          reward: trade.frontendReward
            ? parseFloat(trade.frontendReward)
            : parseFloat(reward),
          exitPrice: endPrice,
        }),
      });
      // Update local state
      setUserTrades((prev) =>
        prev.map((t) =>
          t._id === trade._id
            ? {
                ...t,
                result: isWin ? "win" : "loss",
                reward: parseFloat(reward),
                remainingTime: 0,
              }
            : t
        )
      );
    } catch (err) {
      alert("Failed to close trade");
    }
  };
  */
  // --- END: Legacy manual close logic ---

  const now = Date.now();
  const mappedUserTrades = userTrades.map((trade) => {
    // Calculate elapsed and remaining time
    const elapsed = trade.startedAt
      ? Math.floor(now - new Date(trade.startedAt).getTime()) / 1000
      : 0;
    const remainingTime =
      trade.duration && trade.startedAt
        ? Math.max(trade.duration - elapsed, 0)
        : 0;

    // Determine status
    let status = "running";
    if (trade.result && trade.result !== "pending") {
      status = trade.result;
    } else if (remainingTime === 0) {
      status = "running";
    }

    return {
      ...trade,
      coinName: trade.coin,
      price: trade.investment,
      status,
      remainingTime,
      id: trade._id || trade.id,
    };
  });

  useEffect(() => {
    const updateCoinPrices = async () => {
      const updatedCoins = await Promise.all(
        coins.map(async (coin) => {
          let currentPrice = 0;
          try {
            if (coin.type === "Live") {
              const res = await fetch(
                `https://api.binance.com/api/v3/ticker/price?symbol=${coin.name}USDT`
              );
              const data = await res.json();
              currentPrice = parseFloat(data.price);
            } else {
              const res = await fetch(
                `${BACKEND_URL}/api/coins/price/${coin.name}`
              );
              const data = await res.json();
              currentPrice = parseFloat(data.price || data);
            }
          } catch (err) {
            currentPrice = 0;
          }
          return { ...coin, currentPrice };
        })
      );
      setCoins(updatedCoins);
    };

    if (coins.length > 0) {
      updateCoinPrices();
      const interval = setInterval(updateCoinPrices, 5000); // update every 5 seconds
      return () => clearInterval(interval);
    }
  }, [coins.length]);

  const getPriceForTrade = (trade) => {
    const coinData = coins.find(
      (c) => c.name === trade.coinName || c.name === trade.coin
    );
    return coinData?.currentPrice || 0;
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setUserTrades((prevTrades) =>
        prevTrades.map((trade) => {
          if (trade.remainingTime > 1) {
            return { ...trade, remainingTime: trade.remainingTime - 1 };
          } else if (trade.remainingTime === 1) {
            // Timer will hit 0 now, lock status and reward (auto-close all trades)
            const endPrice = getPriceForTrade(trade) ?? 0;
            const coinData = coins.find(
              (c) => c.name === trade.coinName || c.name === trade.coin
            );
            const profitPercentage = coinData?.profitPercentage || 0;
            const tradeInvestment = trade.investment ?? trade.price ?? 0;
            let centsChange = 0;
            if (trade.type === "Buy") {
              centsChange =
                (endPrice - trade.entryPrice) * (tradeInvestment / trade.entryPrice);
            } else {
              centsChange =
                (trade.entryPrice - endPrice) * (tradeInvestment / trade.entryPrice);
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
              // Auto-close all trades (no manual close needed)
              manualClose: false,
              canBeClosed: false,
            };
          } else {
            // After timer 0, do not recalculate anything, just keep locked values
            return trade;
          }
        })
      );
    }, 1000);
    return () => clearInterval(interval);
  }, [coins, getPriceForTrade]);

  return (
    <div className={s.container}>
      <button className={s.backButton} onClick={() => navigate(-1)}>
        Back
      </button>
      <h2>All Users</h2>
      {!activeUser ? (
        loading ? (
          <div>Loading...</div>
        ) : (
          <table className={s.userTable}>
            <thead>
              <tr>
                <th>User ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Country</th>
                <th>Currency</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr
                  key={u._id}
                  onClick={() => setActiveUser(u)}
                  style={{ cursor: "pointer" }}
                >
                  <td>{u.userId || u._id}</td>
                  <td>
                    {u.firstName} {u.lastName}
                  </td>
                  <td>{u.email}</td>
                  <td>{u.country}</td>
                  <td>{u.currency}</td>
                  <td>{u.verified ? "Verified" : "Unverified"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )
      ) : (
        <div className={s.pageContent}>
          {/* Left: Action Panel */}
          <div className={s.userActionsPanel}>
            <button
              className={s.backButton}
              onClick={() => setActiveUser(null)}
            >
              ← Back to User List
            </button>
            <h3>
              Actions for {activeUser.firstName} {activeUser.lastName} (
              {activeUser.email})
            </h3>
            <div className={s.actionPanel}>
              {/* Assets and Balance */}
              {typeof activeUser.assets === "number" ? (
                <div className={s.assetsBox}>
                  <b>Balance:</b>
                  <ul>
                    <li>
                      <span className={s.assetCoin}>Assets:</span>{" "}
                      <span className={s.assetAmount}>${activeUser.assets.toFixed(2)}</span>
                    </li>
                    <li>
                      <span className={s.assetCoin}>Bonus:</span>{" "}
                      <span className={s.assetAmount}>${(activeUser.totalBonus || 0).toFixed(2)}</span>
                    </li>
                    <li style={{ borderTop: '1px solid #ccc', paddingTop: '5px', marginTop: '5px' }}>
                      <span className={s.assetCoin}><strong>Total:</strong></span>{" "}
                      <span className={s.assetAmount}><strong>${(activeUser.assets + (activeUser.totalBonus || 0)).toFixed(2)}</strong></span>
                    </li>
                  </ul>
                </div>
              ) : (
                activeUser.assets && (
                  <div className={s.assetsBox}>
                    <b>Assets:</b>
                    <ul>
                      {Object.entries(activeUser.assets).map(
                        ([coin, amount]) => (
                          <li key={coin}>
                            <span className={s.assetCoin}>{coin}:</span>{" "}
                            <span className={s.assetAmount}>{amount}</span>
                          </li>
                        )
                      )}
                    </ul>
                    {activeUser.totalBonus && activeUser.totalBonus > 0 && (
                      <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #ccc' }}>
                        <b>Bonus: ${activeUser.totalBonus.toFixed(2)}</b>
                      </div>
                    )}
                  </div>
                )
              )}

              {/* Trade Controls */}
              <div className={s.tradeControls}>
                <label>
                  Amount:{" "}
                  <input
                    type="number"
                    min="1"
                    value={tradeAmount}
                    onChange={(e) => setTradeAmount(Number(e.target.value))}
                    className={s.input}
                    disabled={tradeLoading}
                  />
                </label>
                <label>
                  Timer (seconds):{" "}
                  <input
                    type="number"
                    min="10"
                    step="10"
                    value={tradeTimer}
                    onChange={(e) => setTradeTimer(Number(e.target.value))}
                    className={s.input}
                    disabled={tradeLoading}
                  />
                </label>
              </div>

              {/* Coin Selector */}
              <button
                className={s.actionButton}
                onClick={() => setShowCoinSelector(true)}
                disabled={tradeLoading}
              >
                {selectedCoin ? `Change Coin (${selectedCoin})` : "Select Coin"}
              </button>
              {showCoinSelector && (
                <div className={s.coinSelectorBox}>
                  <h4>Select a Coin</h4>
                  <CoinSelector
                    selectedCoin={selectedCoin}
                    setSelectedCoin={(coin) => {
                      setUserCoinMap((prev) => ({
                        ...prev,
                        [activeUser._id]: coin,
                      }));
                      setShowCoinSelector(false);
                    }}
                    disabled={false}
                    isOpen={showCoinSelector}
                    setIsOpen={setShowCoinSelector}
                    coins={coins}
                  />
                </div>
              )}
              {selectedCoin && (
                <div className={s.selectedCoinBox}>
                  <b>Selected Coin:</b> {selectedCoin}
                </div>
              )}

              {/* Actions */}
              <button
                className={s.actionButton}
                onClick={() => handleTrade("Buy")}
                disabled={tradeLoading}
              >
                {tradeLoading ? "Processing..." : "Buy"}
              </button>
              <button
                className={s.actionButton}
                onClick={() => handleTrade("Sell")}
                disabled={tradeLoading}
              >
                {tradeLoading ? "Processing..." : "Sell"}
              </button>
              {tradeMessage && (
                <div className={s.tradeMessage}>{tradeMessage}</div>
              )}
            </div>
          </div>

          {/* Right: Trades Panel */}
          <div className={s.tradeHistoryPanel}>
            <h3>
              {activeUser.firstName} {activeUser.lastName}'s Trades
            </h3>
            {loadingUserTrades ? (
              <div>Loading trades...</div>
            ) : (
              <Trades
                trades={mappedUserTrades}
                formatTime={(seconds) => {
                  if (
                    typeof seconds !== "number" ||
                    isNaN(seconds) ||
                    seconds < 0
                  )
                    return "00:00";
                  const mins = Math.floor(seconds / 60);
                  const secs = seconds % 60;
                  return `${String(mins).padStart(2, "0")}:${String(
                    secs
                  ).padStart(2, "0")}`;
                }}
                // handleCloseTrade={handleCloseTrade} - MANUAL CLOSE DISABLED
                coins={coins}
                getPriceForTrade={getPriceForTrade}
                isDemo={false} // Admin panel is never demo mode
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserTrade;
