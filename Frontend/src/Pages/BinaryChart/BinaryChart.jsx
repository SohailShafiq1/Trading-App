import React, { useState, useEffect } from "react";
import { FiArrowDownRight } from "react-icons/fi";
import styles from "./BinaryChart.module.css";
import TradingViewChart from "./TradingViewChart";
import LiveCandleChart from './LiveCandleChart'
const s = styles;

const BinaryChart = () => {
  const [timer, setTimer] = useState(60);
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

  const handleBuy = () => {
    setPopupMessage(`Buy ${selectedCoin} at $${coinPrice} with $${investment}`);
    setPopupColor("#10A055");
    setShowPopup(true);
    setTrades((prev) => [
      ...prev,
      { type: "Buy", price: investment, coinPrice, coinName: selectedCoin },
    ]);
    setTimeout(() => setShowPopup(false), 2000);
  };

  const handleSell = () => {
    setPopupMessage(`Sell ${selectedCoin} at $${coinPrice} with $${investment}`);
    setPopupColor("#FF1600");
    setShowPopup(true);
    setTrades((prev) => [
      ...prev,
      { type: "Sell", price: investment, coinPrice, coinName: selectedCoin },
    ]);
    setTimeout(() => setShowPopup(false), 2000);
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
        {/* Coin Selection */}
       

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
          {/* Pass the selected coin to the LiveCandleChart */}
          <TradingViewChart coinName={selectedCoin} />
        </div>

        <div className={s.control}>
          <h1>{selectedCoin} Trading</h1>
          <p>Current Coin Price: ${coinPrice}</p>

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
                setInvestment(Math.max(parseInt(e.target.value, 10) || 1, 1))
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
                  {trade.type}: ${trade.price} at Coin Price: ${trade.coinPrice}{" "}
                  ({trade.coinName})
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {showPopup && (
        <div className={s.popup} style={{ backgroundColor: popupColor }}>
          <p>{popupMessage}</p>
        </div>
      )}
    </>
  );
};

export default BinaryChart;
