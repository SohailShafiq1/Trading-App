import React, { useState, useEffect } from "react";
import { FiArrowDownRight } from "react-icons/fi";
import styles from "./BinaryChart.module.css";
import TradingViewChart from "./TradingViewChart";
import LiveCandleChart from "./LiveCandleChart";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { toast } from "react-toastify";
import axios from "axios";
import { useAuth } from "../../Context/AuthContext";
import { useUserAssets } from "../../Context/UserAssetsContext";
import Trades from "./components/Trades/Trades";

const BinaryChart = () => {
  // State declarations
  const [coins, setCoins] = useState([]);
  const [selectedCoin, setSelectedCoin] = useState("");
  const [selectedCoinType, setSelectedCoinType] = useState("");
  const [livePrice, setLivePrice] = useState(0);
  const [otcPrice, setOtcPrice] = useState(0);
  const [timer, setTimer] = useState(60);
  const [investment, setInvestment] = useState(10);
  const [popupMessage, setPopupMessage] = useState("");
  const [popupColor, setPopupColor] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [trades, setTrades] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [priceLoaded, setPriceLoaded] = useState(false);
  const { user } = useAuth();
  const { userAssets, setUserAssets } = useUserAssets();

  // Update user assets in database
  const updateUserAssetsInDB = async (newAssets) => {
    try {
      await axios.put(`http://localhost:5000/api/users/update-assets`, {
        email: user.email,
        assets: newAssets,
      });
    } catch (err) {
      console.error("Error updating user assets:", err);
      toast.error("Failed to update assets");
    }
  };

  // Fetch coins from backend
  useEffect(() => {
    const fetchCoins = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/coins");
        setCoins(response.data);
      } catch (err) {
        console.error("Error fetching coins:", err);
        toast.error("Failed to load coins");
      }
    };
    fetchCoins();
  }, []);

  // Set coin type when selected coin changes
  useEffect(() => {
    if (selectedCoin) {
      setIsLoading(true);
      setPriceLoaded(false);
      const coin = coins.find((c) => c.name === selectedCoin);
      if (coin) {
        setSelectedCoinType(coin.type);
        setLivePrice(0);
        setOtcPrice(0);
      }
    }
  }, [selectedCoin, coins]);

  // Fetch and update live price
  useEffect(() => {
    if (!selectedCoin || selectedCoinType !== "Live") return;

    let interval;
    let isMounted = true;

    const fetchLivePrice = async () => {
      try {
        const response = await fetch(
          `https://api.binance.com/api/v3/ticker/price?symbol=${selectedCoin}USDT`
        );
        const data = await response.json();
        if (isMounted) {
          setLivePrice(parseFloat(data.price));
          setIsLoading(false);
          setPriceLoaded(true);
        }
      } catch (err) {
        console.error("Failed to fetch live price:", err);
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchLivePrice();
    interval = setInterval(fetchLivePrice, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [selectedCoin, selectedCoinType]);

  // Fetch and update OTC price
  useEffect(() => {
    if (!selectedCoin || selectedCoinType !== "OTC") return;

    let interval;
    let isMounted = true;

    const fetchOtcPrice = async () => {
      try {
        const response = await axios.get(
          `http://localhost:5000/api/coins/price/${selectedCoin}`
        );
        if (isMounted) {
          // Extract price whether it comes as object or direct value
          const priceValue = response.data.price || response.data;
          setOtcPrice(parseFloat(priceValue));
          setIsLoading(false);
          setPriceLoaded(true);
        }
      } catch (err) {
        console.error("Failed to fetch OTC price:", err);
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchOtcPrice();
    interval = setInterval(fetchOtcPrice, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [selectedCoin, selectedCoinType]);

  // Update trade timers
  useEffect(() => {
    const interval = setInterval(() => {
      setTrades((prevTrades) =>
        prevTrades.map((trade) =>
          trade.remainingTime > 0
            ? { ...trade, remainingTime: trade.remainingTime - 1 }
            : trade
        )
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const saveTradeToDB = async (trade) => {
    try {
      await axios.post("http://localhost:5000/api/users/trade", {
        email: user.email,
        trade,
      });
      console.log("Trade saved successfully:", trade);
    } catch (err) {
      console.error("Failed to save trade:", err);
    }
  };

  const handleTrade = async (tradeType) => {
    if (!selectedCoin) {
      toast.error("Please select a coin first!");
      return;
    }

    if (isLoading || !priceLoaded) {
      toast.error("Please wait for price data to load");
      return;
    }

    if (investment > userAssets) {
      toast.error("Insufficient funds!");
      return;
    }

    const currentPrice = selectedCoinType === "OTC" ? otcPrice : livePrice;
    const tradePrice = parseFloat(currentPrice);
    const tradeId = Date.now();

    // Deduct investment
    setUserAssets((prev) => {
      const newAssets = prev - investment;
      updateUserAssetsInDB(newAssets);
      return newAssets;
    });

    // Add new trade
    setTrades((prev) => [
      ...prev,
      {
        id: tradeId,
        type: tradeType,
        price: investment,
        coinPrice: tradePrice,
        coinName: selectedCoin,
        remainingTime: timer,
        status: "running",
        reward: 0,
      },
    ]);

    setTimeout(async () => {
      try {
        let endPrice;
        if (selectedCoinType === "Live") {
          const response = await fetch(
            `https://api.binance.com/api/v3/ticker/price?symbol=${selectedCoin}USDT`
          );
          const data = await response.json();
          endPrice = parseFloat(data.price);
        } else {
          const response = await axios.get(
            `http://localhost:5000/api/coins/price/${selectedCoin}`
          );
          endPrice =
            typeof response.data === "object"
              ? parseFloat(response.data.price)
              : parseFloat(response.data);
        }

        const coinData = coins.find((c) => c.name === selectedCoin);
        const profitPercentage = coinData?.profitPercentage || 0;

        const isWin =
          tradeType === "Buy" ? endPrice > tradePrice : endPrice < tradePrice;

        const reward = isWin
          ? (investment * (1 + profitPercentage / 100)).toFixed(2)
          : -investment;

        if (isWin) {
          setUserAssets((prev) => {
            const newAssets = prev + parseFloat(reward);
            updateUserAssetsInDB(newAssets);
            return newAssets;
          });
        }

        setTrades((prev) =>
          prev.map((trade) =>
            trade.id === tradeId
              ? {
                  ...trade,
                  status: isWin ? "win" : "loss",
                  reward: parseFloat(reward),
                  remainingTime: 0,
                }
              : trade
          )
        );

        const tradeData = {
          type: tradeType,
          coin: selectedCoin,
          investment,
          entryPrice: tradePrice,
          exitPrice: endPrice,
          result: isWin ? "win" : "loss",
          reward: parseFloat(reward),
          createdAt: new Date(),
          startedAt: new Date(),
          duration: timer,
        };
        saveTradeToDB(tradeData);

        setPopupMessage(
          isWin
            ? `Trade Win! You got $${reward}`
            : `Trade Loss! You lost $${Math.abs(reward)}`
        );
        setPopupColor(isWin ? "#10A055" : "#FF1600");
        setShowPopup(true);
        setTimeout(() => setShowPopup(false), 100);
      } catch (err) {
        console.error("Failed to check trade result:", err);
      }
    }, timer * 1000);
  };

  const formatTime = (seconds) => {
    if (typeof seconds !== "number" || isNaN(seconds) || seconds < 0)
      return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  // Persist selected coin
  useEffect(() => {
    const savedCoin = localStorage.getItem("selectedCoin");
    if (savedCoin) setSelectedCoin(savedCoin);
  }, []);

  useEffect(() => {
    if (selectedCoin) localStorage.setItem("selectedCoin", selectedCoin);
  }, [selectedCoin]);

  // Fetch trades from backend on mount
  useEffect(() => {
    const fetchTrades = async () => {
      if (!user?.email) {
        console.error("User email not found");
        return;
      }

      try {
        const response = await axios.get(
          `http://localhost:5000/api/users/trades/${user.email}`
        );
        const now = Date.now();
        const tradesWithTime = response.data.map((trade) => {
          if (trade.status === "running" && trade.startedAt && trade.duration) {
            const elapsed = Math.floor(
              (now - new Date(trade.startedAt).getTime()) / 1000
            );
            const remaining = Math.max(trade.duration - elapsed, 0);
            return { ...trade, remainingTime: remaining };
          }
          return { ...trade, remainingTime: 0 };
        });

        setTrades(tradesWithTime.reverse());
      } catch (err) {
        console.error("Failed to fetch trades:", err);
      }
    };
    fetchTrades();
  }, [user?.email]);

  return (
    <>
      <div className={styles.container}>
        <div className={styles.box}>
          <div className={styles.chart}>
            <div className={styles.coinList}>
              <select
                className={styles.coinSelect}
                value={selectedCoin}
                onChange={(e) => setSelectedCoin(e.target.value)}
              >
                <option value="" disabled>
                  Select a coin
                </option>
                {coins.map((coin) => (
                  <option key={coin._id} value={coin.name}>
                    {coin.type === "OTC"
                      ? `${coin.firstName}/${coin.lastName}`
                      : coin.name}
                  </option>
                ))}
              </select>
              {trades.length > 0 && (
                <div className={styles.timer}>
                  <p>
                    Latest Trade Timer:{" "}
                    {formatTime(trades[trades.length - 1].remainingTime)}
                  </p>
                </div>
              )}
            </div>

            {isLoading ? (
              <div className={styles.loadingContainer}>
                <div className={styles.loadingSpinner}></div>
                <p>Loading market data for {selectedCoin}...</p>
              </div>
            ) : (
              selectedCoin && (
                <>
                  {selectedCoinType === "Live" && (
                    <TradingViewChart
                      coinName={selectedCoin}
                      intervalSeconds={timer}
                    />
                  )}
                  {selectedCoinType === "OTC" && (
                    <LiveCandleChart coinName={selectedCoin} price={otcPrice} />
                  )}
                </>
              )
            )}
          </div>

          <div className={styles.control}>
            <h1>{selectedCoin || "Select Coin"}</h1>
            <p>
              Current Price: $
              {selectedCoinType === "OTC"
                ? !isNaN(otcPrice)
                  ? otcPrice.toFixed(2)
                  : "Loading..."
                : selectedCoinType === "Live"
                ? livePrice.toFixed(2)
                : "N/A"}
            </p>

            <div className={styles.controlStuff}>
              <div className={styles.controlBox}>
                <button
                  className={styles.iconBtn}
                  onClick={() => setTimer((prev) => Math.max(prev - 30, 30))}
                  disabled={isLoading}
                >
                  −
                </button>
                <div className={styles.value}>{formatTime(timer)}</div>
                <button
                  className={styles.iconBtn}
                  onClick={() => setTimer((prev) => Math.min(prev + 30, 300))}
                  disabled={isLoading}
                >
                  +
                </button>
              </div>

              <div className={styles.moneyBox}>
                <button
                  className={styles.iconBtn}
                  onClick={() => setInvestment((prev) => Math.max(prev - 1, 1))}
                  disabled={isLoading}
                >
                  −
                </button>
                <input
                  type="number"
                  className={styles.value}
                  value={investment}
                  onChange={(e) =>
                    setInvestment(Math.max(parseInt(e.target.value) || 1, 1))
                  }
                  min="1"
                  disabled={isLoading}
                />
                <button
                  className={styles.iconBtn}
                  onClick={() => setInvestment((prev) => prev + 1)}
                  disabled={isLoading}
                >
                  +
                </button>
              </div>
            </div>
            <div>
              <p style={{ textAlign: "center" }}>
                Your Payout:{" "}
                {investment +
                  investment *
                    ((coins.find((c) => c.name === selectedCoin)
                      ?.profitPercentage || 0) /
                      100)}
                $
              </p>
            </div>
            <div className={styles.buySelling}>
              <div
                className={`${styles.buyBox} ${
                  isLoading || !priceLoaded ? styles.disabled : ""
                }`}
                onClick={() => !isLoading && priceLoaded && handleTrade("Buy")}
              >
                <FiArrowDownRight className={styles.icons} />
                <p>Buy</p>
              </div>
              <div
                className={`${styles.SellBox} ${
                  isLoading || !priceLoaded ? styles.disabled : ""
                }`}
                onClick={() => !isLoading && priceLoaded && handleTrade("Sell")}
              >
                <FiArrowDownRight className={styles.icons} />
                <p>Sell</p>
              </div>
            </div>

            <Trades trades={[...trades].reverse()} formatTime={formatTime} />
          </div>
        </div>
      </div>

      {showPopup && (
        <div className={styles.popup} style={{ backgroundColor: popupColor }}>
          <p>{popupMessage}</p>
        </div>
      )}

      <ToastContainer />
    </>
  );
};

export default BinaryChart;
