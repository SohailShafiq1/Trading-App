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

const BinaryChart = () => {
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
      if (
        !tradeData.email ||
        !tradeData.startedAt ||
        tradeData.result === undefined
      ) {
        throw new Error("Missing required fields for trade update");
      }

      let startedAtFormatted;
      if (tradeData.startedAt instanceof Date) {
        startedAtFormatted = tradeData.startedAt.toISOString();
      } else if (typeof tradeData.startedAt === "string") {
        const testDate = new Date(tradeData.startedAt);
        if (isNaN(testDate.getTime())) {
          throw new Error("Invalid startedAt format in trade data");
        }
        startedAtFormatted = tradeData.startedAt;
      } else {
        throw new Error("Invalid startedAt type in trade data");
      }

      const requestData = {
        email: tradeData.email,
        startedAt: startedAtFormatted,
        result: tradeData.result,
        calculatedReward: parseFloat(tradeData.calculatedReward) || 0,
        exitPrice: parseFloat(tradeData.exitPrice) || tradeData.entryPrice,
        entryPrice: parseFloat(tradeData.entryPrice),
      };

      if (isNaN(requestData.calculatedReward)) {
        throw new Error("Invalid calculatedReward value");
      }

      const response = await axios.put(
        "http://localhost:5000/api/users/trade/result",
        requestData,
        {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: 10000,
          validateStatus: (status) => status < 500,
        }
      );

      if (response.status >= 400) {
        throw new Error(response.data.error || "Failed to update trade result");
      }

      return response.data;
    } catch (err) {
      console.error("Failed to update trade result:", {
        error: err.response?.data || err.message,
        config: err.config,
        stack: err.stack,
        tradeData,
      });

      let errorMessage = `Failed to update trade: ${
        err.response?.data?.error || err.message
      }`;

      if (err.response?.data?.details) {
        errorMessage += ` (${err.response.data.details})`;
      }

      toast.error(errorMessage);
      throw err;
    }
  };

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

  const loadDemoTrades = () => {
    const savedTrades = localStorage.getItem("demoTrades");
    if (!savedTrades) return [];

    try {
      const parsedTrades = JSON.parse(savedTrades).map((trade) => ({
        ...trade,
        startedAt: new Date(trade.startedAt),
      }));
      return parsedTrades;
    } catch (err) {
      console.error("Error parsing demo trades:", err);
      return [];
    }
  };

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
      const tradeId = Date.now();
      const startedAt = new Date();

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
        status: "running",
        canClose: false,
        calculatedReward: 0,
      };

      if (isDemo) {
        const newDemoAssets = demoAssets - investment;
        setDemoAssets(newDemoAssets);
        saveDemoAssets(newDemoAssets);
        setDemo_assets(newDemoAssets);

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
          entryPrice: tradePrice,
          investment: investment,
          canClose: false,
          calculatedReward: 0,
        };

        const updatedTrades = [...trades, newTrade];
        setTrades(updatedTrades);
        saveDemoTrades(updatedTrades);
      } else {
        await saveTradeToDB(trade);

        const newAssets = userAssets - investment;
        await updateUserAssetsInDB(newAssets);
        setUserAssets(newAssets);

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
          canClose: false,
          calculatedReward: 0,
        };

        setTrades((prev) => [...prev, newTrade]);
      }

      setTimeout(async () => {
        try {
          let endPrice;
          if (selectedCoinType === "Live") {
            const response = await fetch(
              `https://api.binance.com/api/v3/ticker/price?symbol=${selectedCoin}USDT`
            );
            if (!response.ok) throw new Error("Failed to fetch live price");
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

          const randomFactor = 0.8 + Math.random() * 0.4;
          const reward = isWin
            ? (
                investment *
                (1 + (profitPercentage / 100) * randomFactor)
              ).toFixed(2)
            : -(investment * randomFactor).toFixed(2);

          await updateTradeResultInDB({
            email: user.email,
            startedAt,
            result: "can_close",
            calculatedReward: parseFloat(reward),
            exitPrice: endPrice,
          });

          setTrades((prev) =>
            prev.map((t) =>
              t.id === tradeId
                ? {
                    ...t,
                    status: "can_close",
                    calculatedReward: parseFloat(reward),
                    exitPrice: endPrice,
                    canClose: true,
                  }
                : t
            )
          );

          setPopupMessage(
            `Trade ready to close! Potential ${
              isWin ? "profit" : "loss"
            }: $${Math.abs(reward)}`
          );
          setPopupColor(isWin ? "#10A055" : "#FF1600");
          setShowPopup(true);
          setTimeout(() => setShowPopup(false), 3000);
        } catch (err) {
          setTrades((prev) =>
            prev.map((t) =>
              t.id === tradeId
                ? {
                    ...t,
                    status: "error",
                    canClose: false,
                  }
                : t
            )
          );

          toast.error("Failed to determine trade result");
        }
      }, timer * 1000);
    } catch (err) {
      console.error("Trade failed:", err);
    } finally {
      setIsProcessingTrade(false);
    }
  };

  const handleCloseTrade = async (tradeId) => {
    if (isProcessingTrade) return;
    setIsProcessingTrade(true);

    try {
      const trade = trades.find((t) => t.id === tradeId);
      if (!trade || !trade.canClose) {
        toast.error("Trade not found or cannot be closed");
        return;
      }

      const finalStatus = trade.calculatedReward > 0 ? "win" : "loss";

      if (isDemo) {
        const updatedDemoAssets = demoAssets + trade.calculatedReward;
        setDemoAssets(updatedDemoAssets);
        saveDemoAssets(updatedDemoAssets);
        setDemo_assets(updatedDemoAssets);

        setTrades((prev) =>
          prev.map((t) =>
            t.id === tradeId
              ? {
                  ...t,
                  status: finalStatus,
                  reward: trade.calculatedReward,
                  canClose: false,
                  result: finalStatus,
                }
              : t
          )
        );
        saveDemoTrades(
          trades.map((t) =>
            t.id === tradeId
              ? {
                  ...t,
                  status: finalStatus,
                  reward: trade.calculatedReward,
                  canClose: false,
                  result: finalStatus,
                }
              : t
          )
        );
      } else {
        let startedAtValue;
        if (trade.startedAt instanceof Date) {
          startedAtValue = trade.startedAt.toISOString();
        } else if (typeof trade.startedAt === "string") {
          const parsedDate = new Date(trade.startedAt);
          startedAtValue = isNaN(parsedDate)
            ? trade.startedAt
            : parsedDate.toISOString();
        } else {
          throw new Error("Invalid startedAt format in trade data");
        }

        if (!startedAtValue || !user?.email) {
          throw new Error("Missing required data for trade update");
        }

        await updateTradeResultInDB({
          email: user.email,
          startedAt: startedAtValue,
          result: finalStatus,
          calculatedReward: trade.calculatedReward,
          exitPrice: trade.exitPrice || trade.entryPrice,
          entryPrice: trade.entryPrice,
        });

        const updatedAssets = userAssets + trade.calculatedReward;
        await updateUserAssetsInDB(updatedAssets);
        setUserAssets(updatedAssets);

        setTrades((prev) =>
          prev.map((t) =>
            t.id === tradeId
              ? {
                  ...t,
                  status: finalStatus,
                  reward: trade.calculatedReward,
                  canClose: false,
                  result: finalStatus,
                }
              : t
          )
        );
      }

      toast.success(
        `Trade closed! ${
          trade.calculatedReward > 0 ? "Profit" : "Loss"
        }: $${Math.abs(trade.calculatedReward)}`
      );
    } catch (err) {
      console.error("Failed to close trade:", err);
      toast.error(
        err.response?.data?.error ||
          err.message ||
          "Failed to close trade. Please try again."
      );
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

  useEffect(() => {
    const savedCoin = localStorage.getItem("selectedCoin");
    if (savedCoin) setSelectedCoin(savedCoin);
  }, []);

  useEffect(() => {
    if (selectedCoin) localStorage.setItem("selectedCoin", selectedCoin);
  }, [selectedCoin]);

  useEffect(() => {
    if (isDemo) {
      const savedDemoAssets = localStorage.getItem("demoAssets");
      if (savedDemoAssets) {
        const assets = parseFloat(savedDemoAssets);
        setDemoAssets(assets);
        setDemo_assets(assets);
      } else {
        setDemoAssets(demo_assets);
        saveDemoAssets(demo_assets);
      }

      const now = new Date();
      const loadedTrades = loadDemoTrades().map((trade) => {
        if (trade.status !== "running") return trade;

        const elapsed = Math.floor((now - new Date(trade.startedAt)) / 1000);
        const remaining = Math.max(trade.duration - elapsed, 0);

        if (remaining <= 0) {
          return {
            ...trade,
            remainingTime: 0,
            status: "can_close",
            canClose: true,
          };
        }

        return {
          ...trade,
          remainingTime: remaining,
        };
      });

      setTrades(loadedTrades);
    }
  }, [isDemo, demo_assets]);

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
              try {
                let currentPrice;
                if (trade.coinType === "Live") {
                  const priceRes = await fetch(
                    `https://api.binance.com/api/v3/ticker/price?symbol=${trade.coin}USDT`
                  );
                  const priceData = await priceRes.json();
                  currentPrice = parseFloat(priceData.price);
                } else {
                  const priceRes = await axios.get(
                    `http://localhost:5000/api/coins/price/${trade.coin}`
                  );
                  currentPrice =
                    typeof priceRes.data === "object"
                      ? parseFloat(priceRes.data.price)
                      : parseFloat(priceRes.data);
                }

                const isWin =
                  trade.type === "Buy"
                    ? currentPrice > trade.entryPrice
                    : currentPrice < trade.entryPrice;

                const coinData = coins.find((c) => c.name === trade.coin);
                const profitPercentage = coinData?.profitPercentage || 0;
                const randomFactor = 0.8 + Math.random() * 0.4;
                const reward = isWin
                  ? (
                      trade.investment *
                      (1 + (profitPercentage / 100) * randomFactor)
                    ).toFixed(2)
                  : -(trade.investment * randomFactor).toFixed(2);

                await updateTradeResultInDB({
                  email: user.email,
                  startedAt: trade.startedAt,
                  result: "can_close",
                  calculatedReward: parseFloat(reward),
                  exitPrice: currentPrice,
                });

                return {
                  ...trade,
                  price: trade.investment,
                  coinName: trade.coin,
                  remainingTime: 0,
                  status: "can_close",
                  calculatedReward: parseFloat(reward),
                  canClose: true,
                  exitPrice: currentPrice,
                };
              } catch (err) {
                return {
                  ...trade,
                  price: trade.investment,
                  coinName: trade.coin,
                  remainingTime: 0,
                  status: "can_close",
                  calculatedReward: -trade.investment,
                  canClose: true,
                  exitPrice: trade.entryPrice,
                };
              }
            }

            return {
              ...trade,
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

  const handleTradeButtonClick = (tradeType) => {
    if (!isDemo && !isVerified) {
      toast.error("Please verify your account to start trading");
      return;
    }
    handleTrade(tradeType);
  };

  const currentAssets = isDemo ? demoAssets : userAssets;

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
              {currentAssets}
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
              onCloseTrade={handleCloseTrade}
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
    </>
  );
};

export default BinaryChart;
