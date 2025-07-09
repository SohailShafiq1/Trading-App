import React, { useState, useEffect, useRef } from "react";
import { FiArrowDownRight } from "react-icons/fi";
import { AiOutlineClose, AiOutlineRocket } from "react-icons/ai"; // For close icon
import styles from "./BinaryChart.module.css";
import TradingViewChart from "./TradingViewChart";
import LiveCandleChart from "./LiveCandleChart";
import ForexTradingChart from "./ForexTradingChart";
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
import track from "./assets/tradeopen.mp3";
import { useNavigate } from "react-router-dom";
import ForexChart from "./ForexChart";
import { useTheme } from "../../Context/ThemeContext";

const BinaryChart = () => {
  const { theme } = useTheme();

  // Function to get current price for a trade object (used in trade display)
  const getPriceForTrade = (trade) => {
    const coinData = coins.find((c) => c.name === trade.coinName);
    if (!coinData) {
      return 0;
    }

    if (trade.coinType === "Live") {
      const price =
        coinData.currentPrice && coinData.currentPrice > 0
          ? coinData.currentPrice
          : parseFloat(livePrice) || 0;
      return price;
    } else if (trade.coinType === "Forex") {
      const price =
        coinData.currentPrice && coinData.currentPrice > 0
          ? coinData.currentPrice
          : parseFloat(forexPrice) || 0;

      return price;
    } else {
      const price =
        coinData.currentPrice && coinData.currentPrice > 0
          ? coinData.currentPrice
          : parseFloat(otcPrice) || 0;
      return price;
    }
  };

  // Function to get current price for trade execution
  const getCurrentPriceForExecution = (coinName, coinType) => {
    const coinData = coins.find((c) => c.name === coinName);

    if (coinType === "Live") {
      const price =
        coinData?.currentPrice && coinData.currentPrice > 0
          ? coinData.currentPrice
          : parseFloat(livePrice) || 0;
      return price;
    } else if (coinType === "Forex") {
      const price =
        coinData?.currentPrice && coinData.currentPrice > 0
          ? coinData.currentPrice
          : parseFloat(forexPrice) || 0;
      return price;
    } else {
      const price =
        coinData?.currentPrice && coinData.currentPrice > 0
          ? coinData.currentPrice
          : parseFloat(otcPrice) || 0;
      return price;
    }
  };

  // State declarations
  const socket = useRef(null);

  useEffect(() => {
    socket.current = io(import.meta.env.VITE_BACKEND_URL);
    return () => {
      socket.current.disconnect();
    };
  }, []);

  const { isDemo, demo_assets, setDemo_assets, mute } = useAccountType();
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
  const [allInClicked, setAllInClicked] = useState(false);
  const [showBonusPopup, setShowBonusPopup] = useState(true);
  const [latestBonus, setLatestBonus] = useState(null);
  const [forexPrice, setForexPrice] = useState(0);
  const [forexMarketStatus, setForexMarketStatus] = useState("open"); // "open", "closed"

  const navigate = useNavigate();

  // Check verification status (only for real account)
  useEffect(() => {
    const fetchLatestBonus = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/bonuses`
        );
        if (Array.isArray(res.data) && res.data.length > 0) {
          // Get the last (latest) bonus
          const latest = res.data[res.data.length - 1];
          setLatestBonus(latest);
        }
      } catch (err) {
        // Optionally handle error
      }
    };
    fetchLatestBonus();
  }, []);
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
          `${import.meta.env.VITE_BACKEND_URL}/api/users/is-verified/${
            user._id
          }`
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
  // Make demo trades behave like real trades: timer, result lock, asset update
  useEffect(() => {
    if (!isDemo) return;
    if (!trades.some((t) => t.status === "running")) return;

    const interval = setInterval(() => {
      setTrades((prevTrades) => {
        let updatedAssets = demoAssets;
        let changed = false;
        const updated = prevTrades.map((trade) => {
          if (trade.status !== "running") return trade;
          if (trade.remainingTime > 1) {
            changed = true;
            return { ...trade, remainingTime: trade.remainingTime - 1 };
          } else if (trade.remainingTime === 1) {
            // Timer hits 0, lock result
            const endPrice = getPriceForTrade(trade) ?? 0;
            const coinData = coins.find((c) => c.name === trade.coinName);
            const profitPercentage = coinData?.profitPercentage || 0;
            const tradeInvestment = trade.investment ?? trade.price ?? 0;
            let isWin = false;
            if (trade.type === "Buy") {
              isWin = endPrice > trade.entryPrice;
            } else {
              isWin = endPrice < trade.entryPrice;
            }
            const basePayout = tradeInvestment * (1 + profitPercentage / 100);
            const lockedReward = isWin ? basePayout : 0;
            const lockedStatus = isWin ? "win" : "loss";
            if (isWin) {
              updatedAssets += lockedReward;
            }
            changed = true;
            return {
              ...trade,
              remainingTime: 0,
              lockedStatus,
              lockedReward,
              status: lockedStatus,
              reward: lockedReward,
            };
          } else {
            return trade;
          }
        });
        if (changed) {
          // Save updated trades and assets
          saveDemoTrades(updated);
          setDemoAssets(updatedAssets);
          setDemo_assets(updatedAssets);
          saveDemoAssets(updatedAssets);
        }
        return updated;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isDemo, trades, coins, demoAssets, setDemoAssets, setDemo_assets]);

  // Update user assets in database (only for real account)
  const updateUserAssetsInDB = async (newAssets) => {
    if (isDemo) return;

    try {
      await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/api/users/update-assets`,
        {
          email: user.email,
          assets: newAssets,
        }
      );
    } catch (err) {
      toast.error("Failed to update assets");
      throw err;
    }
  };

  // Fetch coins from backend
  useEffect(() => {
    const fetchCoins = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/coins`
        );
        setCoins(response.data);
      } catch (err) {
        toast.error("Failed to load coins");
      }
    };
    fetchCoins();
  }, []);

  // Set coin type when selected coin changes
  useEffect(() => {
    if (selectedCoin) {
      setPriceLoaded(false);
      const coin = coins.find((c) => c.name === selectedCoin);
      if (coin) {
        setSelectedCoinType(coin.type);
        // Reset all prices when switching coins
        setLivePrice(0);
        setOtcPrice(0);
        setForexPrice(0);
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
          const price = parseFloat(data.price);
          setLivePrice(price.toFixed(2));
          setPriceLoaded(true);
        }
      } catch (err) {
        console.error("Failed to fetch live price:", err);
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
      const price = parseFloat(priceValue);
      setOtcPrice(price);
      setPriceLoaded(true);
    };

    const currentSocket = socket.current;
    currentSocket.on(`price:${selectedCoin}`, handlePriceUpdate);

    return () => {
      currentSocket.off(`price:${selectedCoin}`, handlePriceUpdate);
    };
  }, [selectedCoin, selectedCoinType]);

  // Fetch and update forex price
  useEffect(() => {
    if (!selectedCoin || selectedCoinType !== "Forex") return;
    let isMounted = true;

    const fetchForexPrice = async () => {
      try {
        const apiKey = "947e8dde5aad425da8950b509decf8ca"; // Your API key
        let symbol = selectedCoin.includes("/")
          ? selectedCoin
          : selectedCoin.replace(/(\w{3})(\w{3})/, "$1/$2");

        // For testing, let's set a mock price immediately
        if (isMounted) {
          const mockPrice = 1.17661; // EUR/USD example rate

          setForexPrice(mockPrice);
          setForexMarketStatus("open");
          setPriceLoaded(true);
        }

        // Check market status first
        const statusUrl = `https://api.twelvedata.com/market_state?symbol=${symbol}&apikey=${apiKey}`;
        const statusResponse = await fetch(statusUrl);
        const statusData = await statusResponse.json();

        if (
          isMounted &&
          statusData &&
          statusData.is_market_open !== undefined
        ) {
          const isMarketOpen = statusData.is_market_open;
          setForexMarketStatus(isMarketOpen ? "open" : "closed");

          if (isMarketOpen) {
            // Market is open, fetch price
            const url = `https://api.twelvedata.com/price?symbol=${symbol}&apikey=${apiKey}`;
            const response = await fetch(url);
            const data = await response.json();

            if (isMounted && data && data.price) {
              const price = parseFloat(data.price);
              setForexPrice(price);
              setPriceLoaded(true);
            } else if (isMounted) {
              setPriceLoaded(false);
            }
          } else {
            // Market is closed
            if (isMounted) {
              setPriceLoaded(true);
            }
          }
        } else {
          // Fallback: try to fetch price anyway if market status is unavailable
          const url = `https://api.twelvedata.com/price?symbol=${symbol}&apikey=${apiKey}`;
          const response = await fetch(url);
          const data = await response.json();

          if (isMounted && data && data.price) {
            const price = parseFloat(data.price);
            setForexPrice(price);
            setForexMarketStatus("open");
            setPriceLoaded(true);
          } else if (isMounted) {
            setForexMarketStatus("closed");
            setPriceLoaded(true);
          }
        }
      } catch (err) {
        if (isMounted) {
          // Set a mock price for testing if API fails
          const mockPrice = 1.17661; // EUR/USD example rate

          setForexPrice(mockPrice);
          setForexMarketStatus("open");
          setPriceLoaded(true);
        }
        console.error("Failed to fetch forex price:", err);
      }
    };
    fetchForexPrice();
    const interval = setInterval(fetchForexPrice, 10000); // Check every 10 seconds
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [selectedCoin, selectedCoinType]);

  // Update coins array with live price
  useEffect(() => {
    if (selectedCoin && selectedCoinType === "Live" && livePrice > 0) {
      setCoins((prev) =>
        prev.map((coin) =>
          coin.name === selectedCoin
            ? { ...coin, currentPrice: parseFloat(livePrice) }
            : coin
        )
      );
    }
  }, [selectedCoin, selectedCoinType, livePrice]);

  // Update coins array with OTC price
  useEffect(() => {
    if (selectedCoin && selectedCoinType === "OTC" && otcPrice > 0) {
      setCoins((prev) =>
        prev.map((coin) =>
          coin.name === selectedCoin
            ? { ...coin, currentPrice: parseFloat(otcPrice) }
            : coin
        )
      );
    }
  }, [selectedCoin, selectedCoinType, otcPrice]);

  // Update coins array with Forex price
  useEffect(() => {
    if (selectedCoin && selectedCoinType === "Forex" && forexPrice > 0) {
      setCoins((prev) =>
        prev.map((coin) =>
          coin.name === selectedCoin
            ? { ...coin, currentPrice: parseFloat(forexPrice) }
            : coin
        )
      );
    }
  }, [selectedCoin, selectedCoinType, forexPrice]);

  // Update trade timers
  /*
  useEffect(() => {
    const interval = setInterval(() => {
      setTrades((prevTrades) =>
        prevTrades.map((trade) => {
          // When timer hits 0, lock status and reward, and keep them fixed after that
          if (trade.remainingTime > 1) {
            return { ...trade, remainingTime: trade.remainingTime - 1 };
          } else if (trade.remainingTime === 1) {
            // Timer will hit 0 now, lock status and reward
            const endPrice = getPriceForTrade(trade) ?? 0;
            const coinData = coins.find((c) => c.name === trade.coinName);
            const profitPercentage = coinData?.profitPercentage || 0;
            const tradeInvestment = trade.investment ?? trade.price ?? 0;
            let isWin = false;
            if (trade.type === "Buy") {
              isWin = endPrice > trade.entryPrice;
            } else {
              isWin = endPrice < trade.entryPrice;
            }
            const basePayout = tradeInvestment * (1 + profitPercentage / 100);
            const lockedReward = isWin ? basePayout : 0;
            const lockedStatus = isWin ? "win" : "loss";
            // Optionally update backend if not demo
            if (!isDemo && trade.status === "running") {
              updateTradeResultInDB({
                email: user.email,
                startedAt: trade.startedAt,
                result: lockedStatus,
                reward: lockedReward,
                exitPrice: endPrice,
              });
            }
            return {
              ...trade,
              remainingTime: 0,
              lockedStatus,
              lockedReward,
              status: lockedStatus,
              reward: lockedReward,
            };
          } else {
            // After timer 0, do not recalculate anything, just keep locked values
            return trade;
          }
        })
      );
    }, 1000);
    return () => clearInterval(interval);
  }, [coins, getPriceForTrade, isDemo, user?.email]);
  */

  // Set timeout for trade completion (auto-close logic)
  useEffect(() => {
    // For each running trade, set a timeout to auto-close at expiry
    trades.forEach((trade) => {
      if (
        trade.status === "running" &&
        typeof trade.remainingTime === "number" &&
        trade.remainingTime > 0
      ) {
        const timeoutId = setTimeout(async () => {
          try {
            let endPrice = getPriceForTrade(trade) ?? 0;
            const coinData = coins.find((c) => c.name === trade.coinName);
            const profitPercentage = coinData?.profitPercentage || 0;
            const tradeInvestment = trade.investment ?? trade.price ?? 0;
            let isWin = false;
            if (trade.type === "Buy") {
              isWin = endPrice > trade.entryPrice;
            } else {
              isWin = endPrice < trade.entryPrice;
            }
            const reward = isWin
              ? (tradeInvestment * (1 + profitPercentage / 100)).toFixed(2)
              : 0; // For losing trades, reward is 0 (investment already deducted)
            const lockedStatus = isWin ? "win" : "loss";
            // Update backend if not demo
            if (!isDemo) {
              await updateTradeResultInDB({
                email: user.email,
                // Always send startedAt as a timestamp (number)
                startedAt: new Date(trade.startedAt).getTime(),
                result: lockedStatus,
                reward: parseFloat(reward),
                exitPrice: endPrice,
              });
            }
            // Update local state
            setTrades((prev) =>
              prev.map((t) =>
                t.id === trade.id
                  ? {
                      ...t,
                      status: lockedStatus,
                      reward: parseFloat(reward),
                      remainingTime: 0,
                      lockedStatus,
                      lockedReward: parseFloat(reward),
                    }
                  : t
              )
            );
            setPopupMessage(
              isWin
                ? `Trade Win! You got $${reward}`
                : `Trade Loss! You lost $${Math.abs(reward)}`
            );
            setPopupColor(isWin ? "#10A055" : "#FF1600");
            setShowPopup(true);
            setTimeout(() => setShowPopup(false), 3000);
          } catch (err) {
            console.error("Failed to auto-close trade:", err);
            toast.error("Failed to determine trade result");
          }
        }, trade.remainingTime * 1000);
        // Clean up timeout if trade is removed or component unmounts
        return () => clearTimeout(timeoutId);
      }
      return undefined;
    });
  }, [trades, coins, isDemo, user?.email]);

  const saveTradeToDB = async (trade) => {
    if (isDemo) return { status: "demo" };

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/users/trade`,
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
      // Debug log for payload
      await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/api/users/trade/result`,
        tradeData
      );
    } catch (err) {
      // Log error details for debugging
      if (err.response) {
        console.error("[DEBUG] Backend error:", err.response.data);
        // Suppress toast for 'Trade already closed' error
        if (err.response.data?.error === "Trade already closed") {
          // Optionally update local state here if needed
          return;
        }
        toast.error(
          `Failed to update trade result: ${
            err.response.data.error || err.message
          }`
        );
      } else {
        console.error("[DEBUG] Network or unknown error:", err);
        toast.error("Failed to update trade result (network or unknown error)");
      }
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

    if (selectedCoinType === "Forex" && forexMarketStatus === "closed") {
      toast.error(
        "Forex market is currently closed. Trading will resume when the market opens."
      );
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
      // Get the most current price using the correct function
      let tradePrice = getCurrentPriceForExecution(
        selectedCoin,
        selectedCoinType
      );

      // Validate that we have a valid price
      if (!tradePrice || isNaN(tradePrice) || tradePrice <= 0) {
        console.error(`[TRADE EXECUTION] Invalid price: ${tradePrice}`);
        toast.error("Unable to get current price. Please try again.");
        setIsProcessingTrade(false);
        return;
      }
      // When creating a new trade
      const tradeId = `${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      const startedAt = new Date();

      // Create trade object
      const trade = {
        type: tradeType,
        coin: selectedCoin,
        coinType: selectedCoinType,
        coinId: coins.find((c) => c.name === selectedCoin)?._id,
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
              `${BACKEND_URL}/api/coins/price/${selectedCoin}`
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
  }, [isDemo, demo_assets, setDemo_assets]);

  // Fetch and recover trades (only for real account)
  useEffect(() => {
    if (isDemo) return;
    if (!user?.email) return;

    const fetchAndRecoverTrades = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/users/trades/${user.email}`
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
    const interval = setInterval(fetchAndRecoverTrades, 3000);
    return () => clearInterval(interval);
  }, [user?.email, coins, isDemo]);

  // 1. Add a ref for the audio element
  const clickAudioRef = useRef(null);

  // 2. Play sound on Buy/Sell
  // Forex: Prevent Buy/Sell and show toast (remove this block when live market is open)
  const handleTradeButtonClick = (tradeType) => {
    if (selectedCoinType === "Forex") {
      toast.info("Live Market coming soon");
      return;
    }
    if (clickAudioRef.current) {
      clickAudioRef.current.currentTime = 0; // rewind to start
    }
    if (!mute) {
      clickAudioRef.current.play();
    }
    if (!isDemo && !isVerified) {
      toast.error("Please verify your account to start trading");
      return;
    }
    handleTrade(tradeType);
  };

  const currentAssets = isDemo ? demoAssets : userAssets;

  // Handle manual close of trade (show toast for demo win only)
  const handleCloseTrade = async (trade) => {
    try {
      if (isDemo) {
        // For demo mode, handle locally
        let endPrice;
        if (trade.coinType === "Live") {
          const response = await fetch(
            `https://api.binance.com/api/v3/ticker/price?symbol=${trade.coinName}USDT`
          );
          const data = await response.json();
          endPrice = parseFloat(data.price);
        } else {
          const response = await axios.get(
            `${import.meta.env.VITE_BACKEND_URL}/api/coins/price/${
              trade.coinName
            }`
          );
          endPrice =
            typeof response.data === "object"
              ? parseFloat(response.data.price)
              : parseFloat(response.data);
        }

        const coinData = coins.find((c) => c.name === trade.coinName);
        const profitPercentage = coinData?.profitPercentage || 0;
        const tradeInvestment = trade.investment ?? trade.price ?? 0;

        let isWin = false;
        if (trade.type === "Buy") {
          isWin = endPrice > trade.entryPrice;
        } else {
          isWin = endPrice < trade.entryPrice;
        }

        let reward = isWin
          ? (tradeInvestment * (1 + profitPercentage / 100)).toFixed(2)
          : 0;

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

        // Update demo assets
        if (isWin) {
          const newAssets = demoAssets + parseFloat(reward);
          setDemoAssets(newAssets);
          setDemo_assets(newAssets);
          saveDemoAssets(newAssets);
          toast.success(`Demo Trade Closed: Win! Payout $${reward}`);
        }
      } else {
        // For real mode, call manual close API
        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/users/trade/manual-close`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: user.email,
              startedAt: new Date(trade.startedAt).getTime(),
            }),
          }
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to close trade");
        }

        // Update local trade state
        setTrades((prev) =>
          prev.map((t) =>
            t.id === trade.id || t._id === trade._id
              ? {
                  ...t,
                  manualClose: false, // Trade is now fully closed
                  status: "win", // Already confirmed as win
                }
              : t
          )
        );

        // Update user assets
        setUserAssets(result.newBalance - (user.totalBonus || 0));

        toast.success(`Trade closed successfully! Earned $${result.reward}`);
      }
    } catch (err) {
      console.error("Failed to close trade:", err);
      toast.error("Failed to close trade: " + (err.message || "Unknown error"));
    }
  };

  // Set selected coin to a forex coin if not already selected
  useEffect(() => {
    if (!selectedCoin && coins.length > 0) {
      const otcCoin = coins.find((c) => c.type === "otc" || c.type === "OTC");
      if (otcCoin) {
        setSelectedCoin(otcCoin.name);
      }
    }
  }, [coins, selectedCoin]);

  return (
    <>
      {showBonusPopup &&
        latestBonus &&
        user &&
        Array.isArray(user.usedBonuses) &&
        !user.usedBonuses.includes(latestBonus._id) && (
          <div
            className={styles.bonusPopupWrapper}
            onClick={() => navigate("/binarychart/bankinglayout/deposit")}
            style={{ color: theme.textColor, background: theme.box }}
          >
            <div
              className={styles.bonusPopupContent}
              style={{ color: theme.textColor, background: theme.box }}
            >
              <AiOutlineRocket
                className={styles.bonusIcon}
                style={{ color: theme.textColor }}
              />
              <span
                className={styles.bonusText}
                style={{ color: theme.textColor }}
              >
                Get a{" "}
                <b style={{ color: theme.textColor }}>
                  {latestBonus.percent}% bonus
                </b>{" "}
                on your first deposit of{" "}
                <b style={{ color: theme.textColor }}>${latestBonus.min}</b> or
                more!
              </span>
              <span
                className={styles.bonusBadge}
               
              >
                {latestBonus.percent}%
              </span>
              <button
                className={styles.closeBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowBonusPopup(false);
                }}
                aria-label="Close"
                style={{ color: theme.textColor, background: theme.box }}
              >
                <AiOutlineClose />
              </button>
            </div>
          </div>
        )}

      <div className={styles.container} style={{ color: theme.textColor }}>
        <div className={styles.Cbox} style={{ color: theme.textColor }}>
          <div className={styles.chart}>
            {selectedCoinType === "Forex" && forexMarketStatus === "closed" ? (
              <div
                className={styles.marketClosedContainer}
                style={{ background: theme.box, color: theme.textColor }}
              >
                <div className={styles.marketClosedContent}>
                  <h2
                    style={{
                      color: theme.textColor,
                      fontSize: "2rem",
                      fontWeight: "bold",
                      marginBottom: "1rem",
                      textAlign: "center",
                    }}
                  >
                    Market Closed
                  </h2>
                  <p
                    style={{
                      color: theme.textColor,
                      fontSize: "1.2rem",
                      textAlign: "center",
                      marginBottom: "1rem",
                    }}
                  >
                    {coins.find((c) => c.name === selectedCoin)?.firstName}/
                    {coins.find((c) => c.name === selectedCoin)?.lastName}{" "}
                    market is currently closed
                  </p>
                  <p
                    style={{
                      color: theme.textColor,
                      fontSize: "1rem",
                      textAlign: "center",
                    }}
                  >
                    Trading will resume when the market opens
                  </p>
                </div>
              </div>
            ) : (
              selectedCoin && (
                <>
                  {selectedCoinType === "Live" && (
                    <TradingViewChart
                      coinName={selectedCoin}
                      setSelectedCoin={setSelectedCoin}
                      coins={coins}
                      profit={
                        coins.find((c) => c.name === selectedCoin)
                          ?.profitPercentage || 0
                      }
                      type={selectedCoinType}
                      trades={[...trades].reverse()}
                      handleCloseTrade={handleCloseTrade}
                    />
                  )}
                  {selectedCoinType === "OTC" && (
                    <div className={styles.chartBoxOTC}>
                      <LiveCandleChart
                        coinName={selectedCoin}
                        setSelectedCoin={setSelectedCoin}
                        coins={coins}
                        profit={
                          coins.find((c) => c.name === selectedCoin)
                            ?.profitPercentage || 0
                        }
                        type={selectedCoinType}
                        trades={[...trades].reverse()}
                        handleCloseTrade={handleCloseTrade} // <-- pass this
                      />
                    </div>
                  )}
                  {selectedCoinType === "Forex" && (
                    <ForexTradingChart
                      coinName={selectedCoin}
                      setSelectedCoin={setSelectedCoin}
                      coins={coins}
                      profit={
                        coins.find((c) => c.name === selectedCoin)
                          ?.profitPercentage
                      }
                      type={selectedCoinType}
                      trades={trades}
                      handleCloseTrade={handleCloseTrade}
                      getPriceForTrade={getPriceForTrade}
                      livePrice={livePrice}
                      otcPrice={otcPrice}
                      forexPrice={forexPrice}
                    />
                  )}
                </>
              )
            )}
          </div>

          <div
            className={styles.control}
            style={{ color: theme.textColor, background: theme.box }}
          >
            <h1
              className={styles.selectedCoinTitle}
              style={{ color: theme.textColor }}
            >
              {selectedCoin
                ? selectedCoinType === "Live"
                  ? `${selectedCoin} Trading`
                  : `${
                      coins.find((c) => c.name === selectedCoin)?.firstName
                    }/$${
                      coins.find((c) => c.name === selectedCoin)?.lastName
                    }  Trading`
                : "Select Coin Trading"}
              {selectedCoin && (
                <>
                  {" "}
                  <span
                    style={{
                      fontSize: "1rem",
                      color: theme.textColor,
                      background: "#10a055",
                      borderRadius: "1rem",
                      padding: "2px 10px",
                      marginLeft: 8,
                      fontWeight: 600,
                      display: "inline-block",
                      verticalAlign: "middle",
                    }}
                  >
                    {coins.find((c) => c.name === selectedCoin)
                      ?.profitPercentage ?? 0}
                    %
                  </span>
                </>
              )}
            </h1>
            <p
              className={styles.selectedCoinPrice}
              style={{ color: theme.textColor }}
            >
              {/* Forex: Hide current price and show 'Coming soon' (remove this block when live market is open) */}
              {selectedCoinType === "Forex" ? (
                <span style={{ color: theme.textColor, fontWeight: 600 }}>
                  Coming soon
                </span>
              ) : (
                selectedCoin && (
                  <span style={{ color: theme.textColor }}>
                    Current Price:{" "}
                    {getCurrentPriceForExecution(
                      selectedCoin,
                      selectedCoinType
                    ).toFixed(3)}
                  </span>
                )
              )}
            </p>
            <div className={styles.controlStuff}>
              <div
                className={styles.controlBox}
                style={{
                  background: theme.box,
                  border: `1px solid ${theme.textColor}`,
                }}
              >
                <button
                  className={styles.iconBtn}
                  style={{
                    background: theme.background,
                    color: theme.textColor,
                  }}
                  onClick={() => setTimer((prev) => Math.max(prev - 30, 30))}
                  disabled={
                    isProcessingTrade ||
                    (!isDemo && !isVerified) ||
                    (selectedCoinType === "Forex" &&
                      forexMarketStatus === "closed")
                  }
                >
                  −
                </button>
                <div
                  style={{ color: theme.textColor }}
                  className={styles.value}
                  onClick={() => setShowTimestampPopup((prev) => !prev)}
                >
                  {formatTime(timer)}
                </div>
                <button
                  className={styles.iconBtn}
                  style={{
                    background: theme.background,
                    color: theme.textColor,
                  }}
                  onClick={() => setTimer((prev) => Math.min(prev + 30, 300))}
                  disabled={
                    isProcessingTrade ||
                    (!isDemo && !isVerified) ||
                    (selectedCoinType === "Forex" &&
                      forexMarketStatus === "closed")
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

              <div
                className={styles.moneyBox}
                style={{
                  background: theme.box,
                  border: `1px solid ${theme.textColor}`,
                }}
              >
                <button
                  className={styles.iconBtn}
                  style={{
                    background: theme.background,
                    color: theme.textColor,
                  }}
                  onClick={() => setInvestment((prev) => Math.max(prev - 1, 1))}
                  disabled={
                    isProcessingTrade ||
                    (!isDemo && !isVerified) ||
                    (selectedCoinType === "Forex" &&
                      forexMarketStatus === "closed")
                  }
                >
                  −
                </button>
                <input
                  type="number"
                  className={styles.value}
                  value={investment}
                  onChange={(e) =>
                    setInvestment(Math.max(parseInt(e.target.value)))
                  }
                  min="1"
                  disabled={
                    isProcessingTrade ||
                    (!isDemo && !isVerified) ||
                    (selectedCoinType === "Forex" &&
                      forexMarketStatus === "closed")
                  }
                  style={{
                    color: theme.textColor,
                  }}
                />
                <button
                  className={styles.iconBtn}
                  style={{
                    background: theme.background,
                    color: theme.textColor,
                  }}
                  onClick={() => setInvestment((prev) => prev + 1)}
                  disabled={
                    isProcessingTrade ||
                    (!isDemo && !isVerified) ||
                    (selectedCoinType === "Forex" &&
                      forexMarketStatus === "closed")
                  }
                >
                  +
                </button>
              </div>
            </div>
            <div>
              <p
                className={styles.selectedCoinPayout}
                style={{ textAlign: "center" }}
              >
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
              {/* Forex: Prevent Buy/Sell and show toast (remove this block when live market is open) */}
              <div
                className={`${styles.buyBox} ${
                  !priceLoaded ||
                  isProcessingTrade ||
                  (!isDemo && !isVerified) ||
                  (selectedCoinType === "Forex" &&
                    forexMarketStatus === "closed") ||
                  selectedCoinType === "Forex" // Forex: always disable
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
                  !priceLoaded ||
                  isProcessingTrade ||
                  (!isDemo && !isVerified) ||
                  (selectedCoinType === "Forex" &&
                    forexMarketStatus === "closed") ||
                  selectedCoinType === "Forex" // Forex: always disable
                    ? styles.disabled
                    : ""
                }`}
                onClick={() => handleTradeButtonClick("Sell")}
              >
                <FiArrowDownRight className={styles.icons} />
                <p>Sell</p>
              </div>
            </div>
            <button
              className={styles.allInBtn}
              style={{
                width: "100%",
                background: allInClicked ? "#FF1600" : "#10A055",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                padding: "6px 0",
                fontWeight: 600,
                fontSize: "1rem",
                cursor: "pointer",
                transition: "background 0.2s",
              }}
              onClick={() => {
                if (allInClicked) {
                  setInvestment(0);
                  setAllInClicked(false);
                } else {
                  setInvestment(currentAssets);
                  setAllInClicked(true);
                }
              }}
              disabled={
                isProcessingTrade ||
                (!isDemo && !isVerified) ||
                (selectedCoinType === "Forex" && forexMarketStatus === "closed")
              }
            >
              {allInClicked ? "Clear All" : "All In"}
            </button>
            {window.innerWidth > 768 && (
              <Trades
                trades={[...trades].reverse()}
                formatTime={formatTime}
                handleCloseTrade={handleCloseTrade}
                coins={coins}
                livePrice={livePrice}
                otcPrice={otcPrice}
                forexPrice={forexPrice}
                getPriceForTrade={getPriceForTrade}
              />
            )}
          </div>
        </div>
      </div>

      <ToastContainer />
      {/* 3. Add the audio element at the bottom of your JSX */}
      <audio ref={clickAudioRef} src={track} preload="auto" />
    </>
  );
};

export default BinaryChart;
