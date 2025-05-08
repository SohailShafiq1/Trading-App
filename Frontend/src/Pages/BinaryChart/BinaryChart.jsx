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

const s = styles;

const BinaryChart = () => {
  const [coins, setCoins] = useState([]); // State to store coins
  const [selectedCoin, setSelectedCoin] = useState("");
  const [coinPrice, setCoinPrice] = useState(0);
  const [timer, setTimer] = useState(60); // Default trade time
  const [investment, setInvestment] = useState(10);
  const [popupMessage, setPopupMessage] = useState("");
  const [popupColor, setPopupColor] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [trades, setTrades] = useState([]);
  const { user } = useAuth();
  const { userAssets, setUserAssets } = useUserAssets();
  const updateUserAssetsInDB = async (newAssets) => {
    try {
      await axios.put(`http://localhost:5000/api/users/update-assets`, {
        email: user.email,
        assets: newAssets,
      });
    } catch (err) {
      console.error("Error updating user assets in the database:", err);
    }
  };

  // Fetch coins from the backend
  useEffect(() => {
    const fetchCoins = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/coins"); // Replace with your backend URL
        setCoins(response.data); // Set coins from the backend
      } catch (err) {
        console.error("Error fetching coins:", err);
      }
    };
    fetchCoins();
  }, []);

  // Fetch coin price based on selected coin
  useEffect(() => {
    const selectedCoinType = coins.find(
      (coin) => coin.name === selectedCoin
    )?.type;

    if (selectedCoinType === "Live") {
      const fetchPrice = async () => {
        try {
          const response = await fetch(
            `https://api.binance.com/api/v3/ticker/price?symbol=${selectedCoin}USDT`
          );
          const data = await response.json();
          setCoinPrice(parseFloat(data.price).toFixed(2));
        } catch (err) {
          console.error("Failed to fetch coin price:", err);
        }
      };
      fetchPrice();
      const interval = setInterval(fetchPrice, 5000);
      return () => clearInterval(interval);
    } else {
      setCoinPrice((Math.random() * 100 + 10).toFixed(2)); // Random price for OTC coins
    }
  }, [selectedCoin, coins]);

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

  const handleBuy = async () => {
    if (investment > userAssets) {
      toast.error("Insufficient funds!", {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: false,
      });
      return;
    }

    const buyPrice = parseFloat(coinPrice);

    // Deduct investment from userAssets using a functional update
    setUserAssets((prevAssets) => {
      const updatedAssets = prevAssets - investment;
      updateUserAssetsInDB(updatedAssets); // Update in database
      return updatedAssets;
    });

    toast.success(`Buy ${selectedCoin} at $${buyPrice} with $${investment}`, {
      position: "top-right",
      autoClose: 1000,
      hideProgressBar: true,
      closeOnClick: true,
      pauseOnHover: false,
    });

    const tradeId = Date.now(); // Unique ID for the trade
    setTrades((prev) => [
      ...prev,
      {
        id: tradeId,
        type: "Buy",
        price: investment,
        coinPrice: buyPrice,
        coinName: selectedCoin,
        remainingTime: timer,
        status: "running", // Initial status
        reward: 0, // Initial reward
      },
    ]);

    // Wait for the trade time and check the price
    setTimeout(async () => {
      try {
        const response = await fetch(
          `https://api.binance.com/api/v3/ticker/price?symbol=${selectedCoin}USDT`
        );
        const data = await response.json();
        const currentPrice = parseFloat(data.price);

        let reward = 0;
        let status = "";

        const selectedCoinData = coins.find(
          (coin) => coin.name === selectedCoin
        );
        const profitPercentage = selectedCoinData?.profitPercentage || 0;

        if (currentPrice > buyPrice) {
          reward = (investment * (1 + profitPercentage / 100)).toFixed(2); // Calculate profit dynamically
          setUserAssets((prevAssets) => {
            const newAssets = prevAssets + parseFloat(reward);
            updateUserAssetsInDB(newAssets); // Update in database
            return newAssets;
          });
          status = "win";
        } else {
          reward = -investment; // Loss is the investment amount
          status = "loss";
        }

        setTrades((prev) =>
          prev.map((trade) =>
            trade.id === tradeId
              ? { ...trade, status, reward, remainingTime: 0 }
              : trade
          )
        );

        setPopupMessage(
          status === "win"
            ? `Trade Win! You got $${reward}`
            : `Trade Loss! You lost $${-reward}`
        );
        setPopupColor(status === "win" ? "#10A055" : "#FF1600"); // Green for win, red for loss
        setShowPopup(true);
        setTimeout(() => setShowPopup(false), 3000); // Hide popup after 3 seconds
      } catch (err) {
        console.error("Failed to fetch coin price:", err);
      }
    }, timer * 1000); // Wait for the selected trade time
  };

  const handleSell = async () => {
    if (investment > userAssets) {
      toast.error("Insufficient funds!", {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: false,
      });
      return;
    }

    const sellPrice = parseFloat(coinPrice);

    // Deduct investment from userAssets using a functional update
    setUserAssets((prevAssets) => {
      const updatedAssets = prevAssets - investment;
      updateUserAssetsInDB(updatedAssets); // Update in database
      return updatedAssets;
    });

    toast.error(`Sell ${selectedCoin} at $${sellPrice} with $${investment}`, {
      position: "top-right",
      autoClose: 1000,
      hideProgressBar: true,
      closeOnClick: true,
      pauseOnHover: false,
    });

    const tradeId = Date.now(); // Unique ID for the trade
    setTrades((prev) => [
      ...prev,
      {
        id: tradeId,
        type: "Sell",
        price: investment,
        coinPrice: sellPrice,
        coinName: selectedCoin,
        remainingTime: timer,
        status: "running", // Initial status
        reward: 0, // Initial reward
      },
    ]);

    // Wait for the trade time and check the price
    setTimeout(async () => {
      try {
        const response = await fetch(
          `https://api.binance.com/api/v3/ticker/price?symbol=${selectedCoin}USDT`
        );
        const data = await response.json();
        const currentPrice = parseFloat(data.price);

        let reward = 0;
        let status = "";

        const selectedCoinData = coins.find(
          (coin) => coin.name === selectedCoin
        );
        const profitPercentage = selectedCoinData?.profitPercentage || 0;

        if (currentPrice < sellPrice) {
          reward = (investment * (1 + profitPercentage / 100)).toFixed(2); // Calculate profit dynamically
          setUserAssets((prevAssets) => {
            const newAssets = prevAssets + parseFloat(reward);
            updateUserAssetsInDB(newAssets); // Update in database
            return newAssets;
          });
          status = "win";
        } else {
          reward = -investment; // Loss is the investment amount
          status = "loss";
        }

        setTrades((prev) =>
          prev.map((trade) =>
            trade.id === tradeId
              ? { ...trade, status, reward, remainingTime: 0 }
              : trade
          )
        );

        setPopupMessage(
          status === "win"
            ? `Trade Win! You got $${reward}`
            : `Trade Loss! You lost $${-reward}`
        );
        setPopupColor(status === "win" ? "#10A055" : "#FF1600"); // Green for win, red for loss
        setShowPopup(true);
        setTimeout(() => setShowPopup(false), 3000); // Hide popup after 3 seconds
      } catch (err) {
        console.error("Failed to fetch coin price:", err);
      }
    }, timer * 1000); // Wait for the selected trade time
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(
      remainingSeconds
    ).padStart(2, "0")}`;
  };

  return (
    <>
      <div className={s.container}>
        <div className={s.box}>
          <div className={s.chart}>
            <div className={s.coinList}>
              <select
                className={s.coinSelect}
                value={selectedCoin}
                onChange={(e) => setSelectedCoin(e.target.value)}
              >
                {coins.map((coin) => (
                  <option key={coin._id} value={coin.name}>
                    {coin.type === "OTC"
                      ? `${coin.firstName}/${coin.lastName}`
                      : coin.name}
                  </option>
                ))}
              </select>
              {trades.length > 0 && (
                <div className={s.timer}>
                  <p>
                    Latest Trade Timer:{" "}
                    {trades[trades.length - 1].remainingTime}s
                  </p>
                </div>
              )}
            </div>

            {coins.length > 0 &&
            coins.find((coin) => coin.name === selectedCoin)?.type ===
              "Live" ? (
              <TradingViewChart coinName={selectedCoin} />
            ) : coins.length > 0 ? (
              <LiveCandleChart coinName={selectedCoin} />
            ) : (
              <p>Loading chart...</p>
            )}
          </div>

          <div className={s.control}>
            <h1>{selectedCoin} Trading</h1>
            <p>Current Coin Price: ${coinPrice}</p>
            <div className={s.controlStuff}>
              <div className={s.controlBox}>
                <button
                  className={s.iconBtn}
                  onClick={() => setTimer((prev) => Math.max(prev - 30, 30))}
                >
                  −
                </button>
                <div className={s.value}>{formatTime(timer)}</div>
                <button
                  className={s.iconBtn}
                  onClick={() => setTimer((prev) => Math.min(prev + 30, 300))}
                >
                  +
                </button>
              </div>
              <div className={s.moneyBox}>
                <button
                  className={s.iconBtn}
                  onClick={() => setInvestment((prev) => Math.max(prev - 1, 1))}
                >
                  −
                </button>
                <input
                  type="number"
                  className={s.value}
                  value={investment}
                  onChange={(e) =>
                    setInvestment(
                      Math.max(parseInt(e.target.value, 10) || 1, 1)
                    )
                  }
                  min="1"
                />
                <button
                  className={s.iconBtn}
                  onClick={() => setInvestment((prev) => prev + 1)}
                >
                  +
                </button>
              </div>
            </div>
            <div className={s.buySelling}>
              <div className={s.buyBox} onClick={handleBuy}>
                <FiArrowDownRight className={s.icons} />
                <p>Buy</p>
              </div>
              <div className={s.SellBox} onClick={handleSell}>
                <FiArrowDownRight className={s.icons} />
                <p>Sell</p>
              </div>
            </div>
            <Trades trades={trades} timer={timer} formatTime={formatTime} />
          </div>
        </div>
      </div>

      {showPopup && (
        <div className={s.popup} style={{ backgroundColor: popupColor }}>
          <p>{popupMessage}</p>
        </div>
      )}
      <ToastContainer />
    </>
  );
};

export default BinaryChart;
