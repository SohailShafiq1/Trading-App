import React, { useEffect, useRef, useState } from "react";
import { AiOutlinePlus, AiOutlineBgColors } from "react-icons/ai";
import { BsBarChartFill } from "react-icons/bs";
import { BiPencil } from "react-icons/bi";
import axios from "axios";
import { createChart, CrosshairMode } from "lightweight-charts";

// Time interval mapping
const intervalToSeconds = {
  "1": 60,
  "3": 180,
  "5": 300,
  "15": 900,
  "30": 1800,
  "60": 3600,
  "120": 7200,
  "240": 14400,
  "D": 86400,
};

const TradingViewChart = ({ coinName }) => {
  const containerRef = useRef();
  const chartRef = useRef(null);
  const seriesRef = useRef(null);
  const [interval, setInterval] = useState("30");
  const [candles, setCandles] = useState([]);
  const [currentPrice, setCurrentPrice] = useState(null);
  const [theme, setTheme] = useState("light");

  // Fetch candle data
  const fetchCandles = async () => {
    try {
      // Replace with your actual API endpoint
      const response = await axios.get(
        `https://api.binance.com/api/v3/klines?symbol=${coinName}USDT&interval=${getBinanceInterval(interval)}&limit=1000`
      );
      
      const formattedCandles = response.data.map(candle => ({
        time: candle[0] / 1000, // Convert to seconds
        open: parseFloat(candle[1]),
        high: parseFloat(candle[2]),
        low: parseFloat(candle[3]),
        close: parseFloat(candle[4]),
        volume: parseFloat(candle[5]),
      }));
      
      setCandles(formattedCandles);
      
      // Set current price to the latest close price
      if (formattedCandles.length > 0) {
        setCurrentPrice(formattedCandles[formattedCandles.length - 1].close);
      }
    } catch (error) {
      console.error("Error fetching candle data:", error);
    }
  };

  // Convert our interval format to Binance's format
  const getBinanceInterval = (interval) => {
    switch (interval) {
      case "1": return "1m";
      case "3": return "3m";
      case "5": return "5m";
      case "15": return "15m";
      case "30": return "30m";
      case "60": return "1h";
      case "120": return "2h";
      case "240": return "4h";
      case "D": return "1d";
      default: return "30m";
    }
  };

  // Initialize chart
  useEffect(() => {
    const chart = createChart(containerRef.current, {
      layout: {
        background: { color: theme === "light" ? "#ffffff" : "#121212" },
        textColor: theme === "light" ? "#333333" : "#d1d4dc",
      },
      grid: {
        vertLines: { color: theme === "light" ? "#eeeeee" : "#444444" },
        horzLines: { color: theme === "light" ? "#eeeeee" : "#444444" },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
      },
      width: containerRef.current.clientWidth,
      height: 600,
      timeScale: {
        borderColor: theme === "light" ? "#eeeeee" : "#444444",
        timeVisible: true,
      },
    });

    chartRef.current = chart;
    seriesRef.current = chart.addCandlestickSeries({
      upColor: theme === "light" ? "#26a69a" : "#00e676",
      downColor: theme === "light" ? "#ef5350" : "#ff1744",
      borderUpColor: theme === "light" ? "#26a69a" : "#00e676",
      borderDownColor: theme === "light" ? "#ef5350" : "#ff1744",
      wickUpColor: theme === "light" ? "#26a69a" : "#00e676",
      wickDownColor: theme === "light" ? "#ef5350" : "#ff1744",
    });

    return () => {
      chart.remove();
    };
  }, [theme]);

  // Fetch data when coinName or interval changes
  useEffect(() => {
    fetchCandles();
  }, [coinName, interval]);

  // Update chart when candles data changes
  useEffect(() => {
    if (seriesRef.current && candles.length > 0) {
      seriesRef.current.setData(candles);
      chartRef.current.timeScale().fitContent();
    }
  }, [candles]);

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  return (
    <div
      style={{
        position: "relative",
        height: "600px",
        width: "100%",
        borderRadius: 10,
        overflow: "hidden",
        background: theme === "light" ? "#ffffff" : "#121212",
      }}
    >
      {/* Toolbar */}
      <div
        style={{
          position: "absolute",
          top: 10,
          left: 10,
          zIndex: 10,
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
        }}
      >
        {/* Current Price Display */}
        <div
          style={{
            padding: "8px 12px",
            borderRadius: 4,
            background: theme === "light" ? "#f5f5f5" : "#222",
            color: theme === "light" ? "#26a69a" : "#00e676",
            fontWeight: "bold",
            fontSize: "0.9rem",
          }}
        >
          {currentPrice ? `$${currentPrice.toFixed(4)}` : "Loading..."}
        </div>

        {/* Interval Selector */}
        <select
          value={interval}
          onChange={(e) => setInterval(e.target.value)}
          style={{
            height: 40,
            borderRadius: 4,
            border: `1px solid ${theme === "light" ? "#cccccc" : "#444"}`,
            background: theme === "light" ? "#ffffff" : "#222",
            boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
            padding: "0 10px",
            fontSize: "1rem",
            cursor: "pointer",
            color: theme === "light" ? "#333" : "#ddd",
          }}
        >
          {["1", "3", "5", "15", "30", "60", "120", "240", "D"].map((val) => (
            <option key={val} value={val}>
              {val === "60" ? "1h" : val === "D" ? "1d" : `${val}m`}
            </option>
          ))}
        </select>

        {/* Theme Button */}
        <button
          onClick={toggleTheme}
          style={{
            width: 40,
            height: 40,
            borderRadius: 4,
            border: `1px solid ${theme === "light" ? "#cccccc" : "#444"}`,
            background: theme === "light" ? "#ffffff" : "#222",
            boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <AiOutlineBgColors style={{ 
            fontSize: "1.5rem", 
            color: theme === "light" ? "#333" : "#ddd" 
          }} />
        </button>

        {/* Chart Style */}
        <button
          style={{
            width: 40,
            height: 40,
            borderRadius: 4,
            border: `1px solid ${theme === "light" ? "#cccccc" : "#444"}`,
            background: theme === "light" ? "#ffffff" : "#222",
            boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <BsBarChartFill style={{ 
            fontSize: "1.5rem", 
            color: theme === "light" ? "#333" : "#ddd" 
          }} />
        </button>
      </div>

      {/* Chart Container */}
      <div
        ref={containerRef}
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
};

export default TradingViewChart;