import React, { useState, useEffect, useRef } from "react";
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
import CoinSelector from "./components/CoinSelector/CoinSelector";
import { useAccountType } from "../../Context/AccountTypeContext";
import { io } from "socket.io-client";
import track from "./assets/trade.mp3";
const BinaryChart = () => {
  // State declarations
  const socket = useRef(null);

  useEffect(() => {
    socket.current = io("http://localhost:5000");
    return () => {
      socket.current.disconnect();
    };
  }, []);

  const { isDemo, demo_assets, setDemo_assets } = useAccountType();
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
  const [isProcessingTrade, setIsProcessingTrade] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [checkingVerification, setCheckingVerification] = useState(true);
  const { user } = useAuth();
  const { userAssets, setUserAssets } = useUserAssets();
  const coinSelectorRef = useRef(null);
  const [isCoinSelectorOpen, setIsCoinSelectorOpen] = useState(false);
  const [demoAssets, setDemoAssets] = useState(demo_assets);
  const [showTimestampPopup, setShowTimestampPopup] = useState(false);

  // Check verification status (only for real account)
  useEffect(() => {
    if (isDemo) {
      setCheckingVerification(false);
      return;
    }

    const checkVerification = async () => {
      if (!user?._id) {
        setCheckingVerification(false);
        return;
      }

      try {
        const response = await axios.get(
          `http://localhost:5000/api/users/is-verified/${user._id}`
        );
        setIsVerified(response.data.verified);
      } catch (err) {
        console.error("Error checking verification status:", err);
        toast.error("Failed to check verification status");
      } finally {
        setCheckingVerification(false);
      }
    };

    checkVerification();
  }, [user?._id, isDemo]);

  // Close CoinSelector on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        coinSelectorRef.current &&
        !coinSelectorRef.current.contains(event.target)
      ) {
        setIsCoinSelectorOpen(false);
        showTimestampPopup(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Update user assets in database (only for real account)
  const updateUserAssetsInDB = async (newAssets) => {
    if (isDemo) return;

    try {
      await axios.put(`http://localhost:5000/api/users/update-assets`, {
        email: user.email,
        assets: newAssets,
      });
    } catch (err) {
      console.error("Error updating user assets:", err);
      toast.error("Failed to update assets");
      throw err;
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

    let isMounted = true;

    const fetchLivePrice = async () => {
      try {
        const response = await fetch(
          `https://api.binance.com/api/v3/ticker/price?symbol=${selectedCoin}USDT`
        );
        const data = await response.json();
        if (isMounted) {
          setLivePrice(parseFloat(data.price).toFixed(2));
          setPriceLoaded(true);
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Failed to fetch live price:", err);
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchLivePrice();
    const interval = setInterval(fetchLivePrice, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [selectedCoin, selectedCoinType]);

  useEffect(() => {
    if (!selectedCoin || selectedCoinType !== "OTC") return;

    const handlePriceUpdate = (priceData) => {
      const priceValue = priceData.price || priceData;
      setOtcPrice(parseFloat(priceValue));
      setIsLoading(false);
      setPriceLoaded(true);
    };

    const currentSocket = socket.current;
    currentSocket.on(`price:${selectedCoin}`, handlePriceUpdate);

    return () => {
      currentSocket.off(`price:${selectedCoin}`, handlePriceUpdate);
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
    if (isDemo) return { status: "demo" };

    try {
      const response = await axios.post(
        "http://localhost:5000/api/users/trade",
        {
          email: user.email,
          trade,
        }
      );
      return response.data;
    } catch (err) {
      console.error("Failed to save trade:", err);
      toast.error("Failed to save trade to database");
      throw err;
    }
  };

  const updateTradeResultInDB = async (tradeData) => {
    if (isDemo) return;

    try {
      await axios.put(
        "http://localhost:5000/api/users/trade/result",
        tradeData
      );
    } catch (err) {
      console.error("Failed to update trade result:", err);
      toast.error("Failed to update trade result");
      throw err;
    }
  };

  // Save demo trades to localStorage
  const saveDemoTrades = (trades) => {
    const tradesToSave = trades.map((trade) => ({
      ...trade,
      startedAt:
        trade.startedAt instanceof Date
          ? trade.startedAt.toISOString()
          : trade.startedAt,
    }));
    localStorage.setItem("demoTrades", JSON.stringify(tradesToSave));
  };

  // Load demo trades from localStorage
const loadDemoTrades = () => {
  const savedTrades = localStorage.getItem("demoTrades");
  if (!savedTrades) return [];

  try {
    const parsedTrades = JSON.parse(savedTrades).map((trade) => ({
      ...trade,
      startedAt: new Date(trade.startedAt),
      id: trade.id || `${trade.startedAt}-${trade.coinName}-${Math.random()}`,
    }));
    return parsedTrades;
  } catch (err) {
    console.error("Error parsing demo trades:", err);
    return [];
  }
};
  // Save demo assets to localStorage
  const saveDemoAssets = (assets) => {
    localStorage.setItem("demoAssets", assets.toString());
  };

  const handleTrade = async (tradeType) => {
    if (isProcessingTrade) return;

    if (!isDemo && !isVerified) {
      toast.error("Please verify your account to start trading");
      return;
    }

    if (!selectedCoin) {
      toast.error("Please select a coin first!");
      return;
    }

    if (isLoading || !priceLoaded) {
      toast.error("Please wait for price data to load");
      return;
    }

    // Enforce single trade limit
    if (investment > 4000) {
      toast.error("Single trade limit is $4000");
      return;
    }

    const currentAssets = isDemo ? demoAssets : userAssets;
    const totalAvailable = isDemo
      ? demoAssets
      : userAssets + (user?.totalBonus || 0);
    if (investment > totalAvailable) {
      toast.error("Insufficient funds!");
      return;
    }

    setIsProcessingTrade(true);

    try {
      const currentPrice = selectedCoinType === "OTC" ? otcPrice : livePrice;
      const tradePrice = parseFloat(currentPrice);
     // When creating a new trade
const tradeId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const startedAt = new Date();

      // Create trade object
      const trade = {
        type: tradeType,
        coin: selectedCoin,
        coinType: selectedCoinType,
        investment,
        entryPrice: tradePrice,
        startedAt,
        duration: timer,
        result: "pending",
        reward: 0,
      };

      // For demo, just use localStorage
      if (isDemo) {
        // Deduct investment from demo assets
        const newDemoAssets = demoAssets - investment;
        setDemoAssets(newDemoAssets);
        saveDemoAssets(newDemoAssets);
        setDemo_assets(newDemoAssets);

        // Add to local state
        const newTrade = {
          id: tradeId,
          type: tradeType,
          price: investment,
          coinPrice: tradePrice,
          coinName: selectedCoin,
          remainingTime: timer,
          status: "running",
          reward: 0,
          startedAt,
          duration: timer,
          coinType: selectedCoinType,
          entryPrice: tradePrice, // <-- ADD THIS
          investment: investment, // <-- ADD THIS
        };

        const updatedTrades = [...trades, newTrade];
        setTrades(updatedTrades);
        saveDemoTrades(updatedTrades);
      } else {
        // For real account, save to database
        await saveTradeToDB(trade);

        // Deduct investment
        const newAssets = userAssets - investment;
        await updateUserAssetsInDB(newAssets);
        setUserAssets(newAssets);

        // Add to local state
        const newTrade = {
          id: tradeId,
          type: tradeType,
          price: investment,
          coinPrice: tradePrice,
          coinName: selectedCoin,
          remainingTime: timer,
          status: "running",
          reward: 0,
          startedAt,
          duration: timer,
          coinType: selectedCoinType,
          entryPrice: tradePrice, // <-- ADD THIS
          investment: investment, // <-- ADD THIS
        };

        setTrades((prev) => [...prev, newTrade]);
      }

      // Set timeout for trade completion
      /* setTimeout(async () => {
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

          if (isDemo) {
            // Update demo assets if win
            if (isWin) {
              const updatedDemoAssets = demoAssets + parseFloat(reward);
              setDemoAssets(updatedDemoAssets);
              saveDemoAssets(updatedDemoAssets);
              setDemo_assets(updatedDemoAssets);
            }

            // Update local state
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

            // Save updated trades to localStorage
            saveDemoTrades(
              trades.map((trade) =>
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
          } else {
            // For real account, update in database
            await updateTradeResultInDB({
              email: user.email,
              startedAt,
              result: isWin ? "win" : "loss",
              reward: parseFloat(reward),
              exitPrice: endPrice,
            });

            // Update assets if win
            if (isWin) {
              const updatedAssets = userAssets + parseFloat(reward);
              await updateUserAssetsInDB(updatedAssets);
              setUserAssets(updatedAssets);
            }

            // Update local state
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
          }

          setPopupMessage(
            isWin
              ? `Trade Win! You got $${reward}`
              : `Trade Loss! You lost $${Math.abs(reward)}`
          );
          setPopupColor(isWin ? "#10A055" : "#FF1600");
          setShowPopup(true);
          setTimeout(() => setShowPopup(false), 3000);
        } catch (err) {
          console.error("Failed to check trade result:", err);
          toast.error("Failed to determine trade result");
        }
      }, timer * 1000); */
    } catch (err) {
      console.error("Trade failed:", err);
    } finally {
      setIsProcessingTrade(false);
    }
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

  // Initialize demo assets and trades
  useEffect(() => {
    if (isDemo) {
      // Load demo assets
      const savedDemoAssets = localStorage.getItem("demoAssets");
      if (savedDemoAssets) {
        const assets = parseFloat(savedDemoAssets);
        setDemoAssets(assets);
        setDemo_assets(assets);
      } else {
        setDemoAssets(demo_assets);
        saveDemoAssets(demo_assets);
      }

      // Load and recover demo trades
      const now = new Date();
      const loadedTrades = loadDemoTrades().map((trade) => {
        if (trade.status !== "running") return trade;

        const elapsed = Math.floor((now - new Date(trade.startedAt)) / 1000);
        const remaining = Math.max(trade.duration - elapsed, 0);

        if (remaining <= 0) {
          // Trade should be completed but wasn't - mark as loss
          return {
            ...trade,
            remainingTime: 0,
            status: "loss",
            reward: -trade.price,
          };
        }

        return {
          ...trade,
          remainingTime: remaining,
          id: trade.id, // ensure id is present
        };
      });

      setTrades(loadedTrades);
    }
  }, [isDemo, demo_assets]);

  // Fetch and recover trades (only for real account)
  useEffect(() => {
    if (isDemo) return;
    if (!user?.email) return;

const fetchAndRecoverTrades = async () => {
  try {
    const response = await axios.get(
      `http://localhost:5000/api/users/trades/${user.email}`
    );
    const now = Date.now();

    const recoveredTrades = await Promise.all(
      response.data.map(async (trade) => {
        if (trade.result !== "pending") {
          return {
            ...trade,
            id: trade._id || trade.id, // Ensure we have a unique ID
            price: trade.investment,
            coinName: trade.coin,
            remainingTime: 0,
            status: trade.result,
          };
        }

        const elapsed = Math.floor(
          (now - new Date(trade.startedAt).getTime()) / 1000
        );

        if (elapsed > trade.duration) {
          return {
            ...trade,
            id: trade._id || trade.id, // Ensure we have a unique ID
            price: trade.investment,
            coinName: trade.coin,
            remainingTime: 0,
            status: "running",
          };
        }

        return {
          ...trade,
          id: trade._id || trade.id, // Ensure we have a unique ID
          price: trade.investment,
          coinName: trade.coin,
          remainingTime: Math.max(trade.duration - elapsed, 0),
          status: "running",
        };
      })
    );

    setTrades(recoveredTrades.reverse());
  } catch (err) {
    console.error("Failed to fetch trades:", err);
    toast.error("Failed to load trade history");
  }
};
    fetchAndRecoverTrades();
  }, [user?.email, coins, isDemo]);

  // 1. Add a ref for the audio element
  const clickAudioRef = useRef(null);

  // 2. Play sound on Buy/Sell
  const handleTradeButtonClick = (tradeType) => {
    if (clickAudioRef.current) {
      clickAudioRef.current.currentTime = 0; // rewind to start
      clickAudioRef.current.play();
    }
    if (!isDemo && !isVerified) {
      toast.error("Please verify your account to start trading");
      return;
    }
    handleTrade(tradeType);
  };

  const currentAssets = isDemo ? demoAssets : userAssets;

  const handleCloseTrade = async (trade) => {
  try {
    let endPrice;
    if (trade.coinType === "Live") {
      const response = await fetch(
        `https://api.binance.com/api/v3/ticker/price?symbol=${trade.coinName}USDT`
      );
      const data = await response.json();
      endPrice = parseFloat(data.price);
    } else {
      const response = await axios.get(
        `http://localhost:5000/api/coins/price/${trade.coinName}`
      );
      endPrice =
        typeof response.data === "object"
          ? parseFloat(response.data.price)
          : parseFloat(response.data);
    }

    const coinData = coins.find((c) => c.name === trade.coinName);
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

    // Update only the specific trade in state
    setTrades((prev) =>
      prev.map((t) =>
        t.id === trade.id
          ? {
              ...t,
              status: isWin ? "win" : "loss",
              reward: parseFloat(reward),
              remainingTime: 0,
            }
          : t
      )
    );

    if (!isDemo) {
      await updateTradeResultInDB({
        email: user.email,
        startedAt: trade.startedAt,
        result: isWin ? "win" : "loss",
        reward: parseFloat(reward),
        exitPrice: endPrice,
      });
    }

    setPopupMessage(
      isWin
        ? `Trade Win! You got $${reward}`
        : `Trade Loss! You lost $${Math.abs(reward)}`
    );
    setPopupColor(isWin ? "#10A055" : "#FF1600");
    setShowPopup(true);
    setTimeout(() => setShowPopup(false), 3000);
  } catch (err) {
    console.error("Failed to close trade:", err);
    toast.error("Failed to close trade");
  }
};

  return (
    <>
      <div className={styles.container}>
        <div className={styles.Cbox}>
          <div className={styles.chart}>
            <div className={styles.coinList}>
              <CoinSelector
                ref={coinSelectorRef}
                coins={coins}
                selectedCoin={selectedCoin}
                setSelectedCoin={setSelectedCoin}
                disabled={isProcessingTrade}
                isOpen={isCoinSelectorOpen}
                setIsOpen={setIsCoinSelectorOpen}
              />
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
                    <div className={styles.chartBoxOTC}>
                      <LiveCandleChart
                        coinName={selectedCoin}
                        price={otcPrice}
                      />
                    </div>
                  )}
                </>
              )
            )}
          </div>

          <div className={styles.control}>
            <h1>{selectedCoin || "Select Coin"} Trading</h1>
            <p>
              {isDemo ? "Demo Balance" : "Available for Trading"}: $
              {userAssets + (user?.totalBonus || 0)}
            </p>

            <p>
              Current Price:{" "}
              {selectedCoinType === "OTC"
                ? !isNaN(otcPrice)
                  ? otcPrice.toFixed(2)
                  : "Loading..."
                : selectedCoinType === "Live"
                ? livePrice
                : "N/A"}
            </p>

            <div className={styles.controlStuff}>
              <div className={styles.controlBox}>
                <button
                  className={styles.iconBtn}
                  onClick={() => setTimer((prev) => Math.max(prev - 30, 30))}
                  disabled={
                    isLoading || isProcessingTrade || (!isDemo && !isVerified)
                  }
                >
                  −
                </button>
                <div
                  className={styles.value}
                  onClick={() => setShowTimestampPopup((prev) => !prev)}
                >
                  {formatTime(timer)}
                </div>
                <button
                  className={styles.iconBtn}
                  onClick={() => setTimer((prev) => Math.min(prev + 30, 300))}
                  disabled={
                    isLoading || isProcessingTrade || (!isDemo && !isVerified)
                  }
                >
                  +
                </button>
              </div>
              <div className={styles.timestampPopupContainer}>
                {showTimestampPopup && (
                  <div className={styles.timestampPopup}>
                    {[30, 60, 120, 180, 300].map((time) => (
                      <div
                        key={time}
                        className={styles.timestampOption}
                        onClick={() => {
                          setTimer(time);
                          setShowTimestampPopup(false);
                        }}
                      >
                        {formatTime(time)}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className={styles.moneyBox}>
                <button
                  className={styles.iconBtn}
                  onClick={() => setInvestment((prev) => Math.max(prev - 1, 1))}
                  disabled={
                    isLoading || isProcessingTrade || (!isDemo && !isVerified)
                  }
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
                  disabled={
                    isLoading || isProcessingTrade || (!isDemo && !isVerified)
                  }
                />
                <button
                  className={styles.iconBtn}
                  onClick={() => setInvestment((prev) => prev + 1)}
                  disabled={
                    isLoading || isProcessingTrade || (!isDemo && !isVerified)
                  }
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
                  isLoading ||
                  !priceLoaded ||
                  isProcessingTrade ||
                  (!isDemo && !isVerified)
                    ? styles.disabled
                    : ""
                }`}
                onClick={() => handleTradeButtonClick("Buy")}
              >
                <FiArrowDownRight className={styles.icons} />
                <p>Buy</p>
              </div>
              <div
                className={`${styles.SellBox} ${
                  isLoading ||
                  !priceLoaded ||
                  isProcessingTrade ||
                  (!isDemo && !isVerified)
                    ? styles.disabled
                    : ""
                }`}
                onClick={() => handleTradeButtonClick("Sell")}
              >
                <FiArrowDownRight className={styles.icons} />
                <p>Sell</p>
              </div>
            </div>

            <Trades
              trades={[...trades].reverse()}
              formatTime={formatTime}
              handleCloseTrade={handleCloseTrade}
              coins={coins}
              livePrice={livePrice}
              otcPrice={otcPrice}
            />
          </div>
        </div>
      </div>

      {showPopup && (
        <div className={styles.popup} style={{ backgroundColor: popupColor }}>
          <p>{popupMessage}</p>
        </div>
      )}

      <ToastContainer />
      {/* 3. Add the audio element at the bottom of your JSX */}
      <audio ref={clickAudioRef} src={track} preload="auto" />
    </>
  );
};

export default BinaryChart;
