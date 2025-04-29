import React, { useState, useEffect } from "react";
import { FiArrowDownRight } from "react-icons/fi";
import styles from "./BinaryChart.module.css";
import TradingViewChart from "./TradingViewChart";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { toast } from "react-toastify";

const s = styles;

const BinaryChart = () => {
  const [timer, setTimer] = useState(60); // Default trade time
  const [remainingTime, setRemainingTime] = useState(null); // Timer for active trade
  const [investment, setInvestment] = useState(10);
  const [popupMessage, setPopupMessage] = useState("");
  const [popupColor, setPopupColor] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [trades, setTrades] = useState([]);
  const [coinPrice, setCoinPrice] = useState(0);
  const [selectedCoin, setSelectedCoin] = useState("XRP");
  const [marketType, setMarketType] = useState("Live");

  const coinsLive = ["BTC", "ETH"];
  const coinsOTC = ["XRP", "SEI", "AED"];
  const coins = marketType === "Live" ? coinsLive : coinsOTC;

  useEffect(() => {
    if (marketType === "Live") {
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
      setCoinPrice((Math.random() * 100 + 10).toFixed(2));
    }
  }, [selectedCoin, marketType]);

  const handleBuy = async () => {
    const buyPrice = parseFloat(coinPrice); // Capture the current price at the time of the buy
    toast.success(`Buy ${selectedCoin} at $${buyPrice} with $${investment}`, {
      position: "top-right",
      autoClose: 1000,
      hideProgressBar: true,
      closeOnClick: true,
      pauseOnHover: false,
    });

    setTrades((prev) => [
      ...prev,
      { type: "Buy", price: investment, coinPrice: buyPrice, coinName: selectedCoin },
    ]);

    setRemainingTime(timer); // Start the countdown timer

    // Wait for the trade time and check the price
    setTimeout(async () => {
      try {
        const response = await fetch(
          `https://api.binance.com/api/v3/ticker/price?symbol=${selectedCoin}USDT`
        );
        const data = await response.json();
        const currentPrice = parseFloat(data.price);

        if (currentPrice > buyPrice) {
          const profit = (investment * 1.07).toFixed(2); // Calculate 7% profit
          setPopupMessage(`Trade Win! You got $${profit}`);
          setPopupColor("#10A055"); // Green for win
        } else {
          setPopupMessage(`Trade Loss! You lost $${investment}`);
          setPopupColor("#FF1600"); // Red for loss
        }
        setShowPopup(true);
        setTimeout(() => setShowPopup(false), 3000); // Hide popup after 3 seconds
      } catch (err) {
        console.error("Failed to fetch coin price:", err);
      }
    }, timer * 1000); // Wait for the selected trade time
  };

  const handleSell = async () => {
    const sellPrice = parseFloat(coinPrice); // Capture the current price at the time of the sell
    toast.error(`Sell ${selectedCoin} at $${sellPrice} with $${investment}`, {
      position: "top-right",
      autoClose: 1000,
      hideProgressBar: true,
      closeOnClick: true,
      pauseOnHover: false,
    });

    setTrades((prev) => [
      ...prev,
      { type: "Sell", price: investment, coinPrice: sellPrice, coinName: selectedCoin },
    ]);

    setRemainingTime(timer); // Start the countdown timer

    // Wait for the trade time and check the price
    setTimeout(async () => {
      try {
        const response = await fetch(
          `https://api.binance.com/api/v3/ticker/price?symbol=${selectedCoin}USDT`
        );
        const data = await response.json();
        const currentPrice = parseFloat(data.price);

        if (currentPrice < sellPrice) {
          const profit = (investment * 1.07).toFixed(2); // Calculate 7% profit
          setPopupMessage(`Trade Win! You got $${profit}`);
          setPopupColor("#10A055"); // Green for win
        } else {
          setPopupMessage(`Trade Loss! You lost $${investment}`);
          setPopupColor("#FF1600"); // Red for loss
        }
        setShowPopup(true);
        setTimeout(() => setShowPopup(false), 3000); // Hide popup after 3 seconds
      } catch (err) {
        console.error("Failed to fetch coin price:", err);
      }
    }, timer * 1000); // Wait for the selected trade time
  };

  // Countdown timer logic
  useEffect(() => {
    if (remainingTime === null) return;

    if (remainingTime > 0) {
      const interval = setInterval(() => {
        setRemainingTime((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [remainingTime]);

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
              {coins.map((coin) => (
                <button
                  key={coin}
                  className={`${s.coinButton} ${
                    selectedCoin === coin ? s.activeCoin : ""
                  }`}
                  onClick={() => setSelectedCoin(coin)}
                >
                  {coin}
                </button>
              ))}
            </div>
            <TradingViewChart coinName={selectedCoin} />
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
            {remainingTime !== null && (
              <div className={s.timer}>
                <p>Time Left: {remainingTime}s</p>
              </div>
            )}
              <div className={s.tradeHistory}>
              <p>Trades</p>
              <ul>
                {trades.map((trade, index) => (
                  <li
                    key={index}
                    style={{
                      color: trade.type === "Buy" ? "#10A055" : "#FF1600",
                    }}
                  >
                    {trade.type}: ${trade.price} at Coin Price: $
                    {trade.coinPrice} ({trade.coinName})
                  </li>
                ))}
              </ul>
            </div>
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
