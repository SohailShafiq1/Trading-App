import { RiArrowDropDownLine } from "react-icons/ri";
import React, { useEffect, useRef, useState } from "react";
import { createChart, CrosshairMode } from "lightweight-charts";
import {
  AiOutlinePlus,
  AiOutlineBgColors,
  AiOutlineClose,
} from "react-icons/ai";
import { BsBarChartFill } from "react-icons/bs";
import { BiPencil } from "react-icons/bi";
import { FiMaximize2 } from "react-icons/fi";
import Tabs from "./components/Tabs/Tabs";
import "./LiveCandleChart.css";
import CoinSelector from "./components/CoinSelector/CoinSelector";

const CANDLE_STYLES = {
  CANDLE: "Candlestick",
  BAR: "Bar",
  LINE: "Line",
  HOLLOW: "Hollow Candle",
};
const THEMES = {
  LIGHT: {
    name: "Light",
    background: "#ffffff",
    textColor: "#333333",
    gridColor: "#3A3A3A",
    upColor: "#26a69a",
    downColor: "#ef5350",
    borderVisible: true,
    wickVisible: true,
  },
  DARK: {
    name: "Dark",
    background: "#121212",
    textColor: "#d1d4dc",
    gridColor: "#444444",
    upColor: "#00e676",
    downColor: "#ff1744",
    borderVisible: true,
    wickVisible: true,
  },
  BLUE: {
    name: "Blue",
    background: "#0e1a2f",
    textColor: "#ffffff",
    gridColor: "#1e2a3f",
    upColor: "#4caf50",
    downColor: "#f44336",
    borderVisible: true,
    wickVisible: true,
  },
};

const INDICATORS = {
  NONE: "None",
  SMA: "SMA (20)",
  EMA: "EMA (20)",
  RSI: "RSI (14)",
  MACD: "MACD",
  BB: "Bollinger Bands",
};
const DRAWING_TOOLS = {
  NONE: "None",
  HORIZONTAL_LINE: "Horizontal Line",
  VERTICAL_LINE: "Vertical Line",
  TREND_LINE: "Trend Line",
};

const intervalToSeconds = {
  "1m": 60,
  "2m": 120,
  "3m": 180,
  "5m": 300,
  "15m": 900,
  "30m": 1800,
  "1h": 3600,
  "4h": 14400,
  "1d": 86400,
};

const ForexTradingChart = ({
  coinName,
  setSelectedCoin,
  coins,
  profit,
  type,
  trades = [],
  handleCloseTrade,
}) => {
  const containerRef = useRef();
  const chartRef = useRef(null);
  const seriesRef = useRef(null);
  const [showCoinSelector, setShowCoinSelector] = useState(false);
  const coinSelectorRef = useRef();
  const [interval, setInterval] = useState("30min");
  const [candles, setCandles] = useState([]);
  const [currentPrice, setCurrentPrice] = useState(null);
  const [theme, setTheme] = useState(THEMES.LIGHT);
  const [candleStyle, setCandleStyle] = useState(CANDLE_STYLES.CANDLE);
  const [indicator, setIndicator] = useState(INDICATORS.NONE);
  const [drawingTool, setDrawingTool] = useState(DRAWING_TOOLS.NONE);
  const [showIndicatorPopup, setShowIndicatorPopup] = useState(false);
  const [showDrawingPopup, setShowDrawingPopup] = useState(false);
  const [showThemePopup, setShowThemePopup] = useState(false);
  const [showStylePopup, setShowStylePopup] = useState(false);
  const buttonRefs = useRef([]);

  // Fetch candle data from Twelve Data
  const fetchCandles = async () => {
    try {
      const apiKey = "d26b112fa4dd46858146b3ff1bdd4c16"; // Your API key
      // Use coinName from prop, format as EUR/USD for API
      let symbol = coinName.includes("/")
        ? coinName
        : coinName.replace(/(\w{3})(\w{3})/, "$1/$2");
      const url = `https://api.twelvedata.com/time_series?symbol=${symbol}&interval=${interval}&outputsize=100&apikey=${apiKey}`;
      const response = await fetch(url);
      const data = await response.json();
      if (data && data.values) {
        const formattedCandles = data.values.reverse().map((candle) => ({
          time: Math.floor(new Date(candle.datetime).getTime() / 1000),
          open: parseFloat(candle.open),
          high: parseFloat(candle.high),
          low: parseFloat(candle.low),
          close: parseFloat(candle.close),
          volume: parseFloat(candle.volume),
        }));
        setCandles(formattedCandles);
        if (formattedCandles.length > 0) {
          setCurrentPrice(formattedCandles[formattedCandles.length - 1].close);
        }
      } else {
        console.error("Twelve Data API error or no data:", data);
      }
    } catch (error) {
      console.error("Error fetching candle data:", error);
    }
  };

  useEffect(() => {
    const chart = createChart(containerRef.current, {
      layout: {
        background: { color: theme.background },
        textColor: theme.textColor,
      },
      grid: {
        vertLines: { color: theme.gridColor },
        horzLines: { color: theme.gridColor },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
      },
      width: containerRef.current.clientWidth,
      height: 600,
      timeScale: {
        borderColor: theme.gridColor,
      },
    });
    chartRef.current = chart;
    seriesRef.current = chart.addCandlestickSeries({
      upColor: theme.upColor,
      downColor: theme.downColor,
      borderUpColor: theme.upColor,
      borderDownColor: theme.downColor,
      wickUpColor: theme.upColor,
      wickDownColor: theme.downColor,
    });
    return () => chart.remove();
  }, []);

  useEffect(() => {
    fetchCandles();
  }, [coinName, interval]);

  useEffect(() => {
    if (!chartRef.current || !seriesRef.current) return;
    chartRef.current.applyOptions({
      layout: {
        background: { color: theme.background },
        textColor: theme.textColor,
      },
      grid: {
        vertLines: { color: theme.gridColor },
        horzLines: { color: theme.gridColor },
      },
      timeScale: {
        borderColor: theme.gridColor,
      },
    });
    seriesRef.current.setData(candles);
  }, [candles, theme]);

  return (
    <div
      className="liveCHART"
      style={{
        background: theme.background,
        color: theme.textColor,
        borderRadius: 10,
        position: "relative",
      }}
    >
      <div className="liveChartBtns">
        <div
          style={{ display: "flex", flexDirection: "row", marginBottom: 10 }}
        >
          {/* Coin Selector Button*/}
          <div
            className="coinSelectorMobile"
            ref={(el) => (buttonRefs.current[0] = el)}
          >
            <button
              id="indicator-btn"
              className="chartBtns"
              onClick={() => setShowCoinSelector(true)}
              style={{
                fontSize: "1rem",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                color: theme.textColor,
                cursor: "pointer",
                height: 50,
              }}
            >
              <AiOutlinePlus
                className="coinAdd"
                style={{
                  color: "white",
                  fontSize: "1.5rem",
                  fontWeight: "bolder",
                }}
              />
              <div
                className="lines"
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  width: "100%",
                }}
              >
                <p className="nameProfit">
                  {coinName}({type})
                </p>
                <p className="nameProfit">
                  &nbsp;&nbsp;{profit}
                  {"% "}
                </p>
                <p className="nameProfit">
                  <RiArrowDropDownLine style={{ fontSize: "1.4rem" }} />
                </p>
              </div>
            </button>
            {showCoinSelector && (
              <div
                ref={coinSelectorRef}
                style={{
                  position: "absolute",
                  top: "110%",
                  left: 0,
                  zIndex: 200,
                  minWidth: 260,
                }}
              >
                <CoinSelector
                  selectedCoin={coinName}
                  setSelectedCoin={(coin) => {
                    setShowCoinSelector(false);
                    setSelectedCoin(coin);
                  }}
                  disabled={false}
                  isOpen={showCoinSelector}
                  setIsOpen={setShowCoinSelector}
                  coins={coins}
                />
              </div>
            )}
          </div>
          <div className="webCoinInfoT" style={{ position: "absolute" }}>
            <div className="coininfoBox">
              <p className="nameProfitWeb">
                {coinName}({type})
              </p>
              <p className="nameProfitWeb">
                &nbsp;&nbsp;{profit}
                {"% "}
              </p>
            </div>
          </div>
          {/* Drawing tools button */}
          <div
            style={{
              position: "relative",
              display: "flex",
              flexDirection: "row",
            }}
            ref={(el) => (buttonRefs.current[1] = el)}
          >
            <button
              className="chartBtns"
              onClick={() => {
                setShowIndicatorPopup(!showIndicatorPopup);
                setShowStylePopup(false);
                setShowThemePopup(false);
                setShowDrawingPopup(false);
              }}
              style={{
                color: "black",
                cursor: "pointer",
                height: 50,
                fontSize: "1.5rem",
                background: "#E0E0E0",
              }}
            >
              <FiMaximize2 />
            </button>
            {showIndicatorPopup && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  zIndex: 100,
                  background: "#E0E0E0",
                  border: `1px solid ${theme.gridColor}`,
                  borderRadius: 4,
                  padding: 10,
                  display: "flex",
                  flexDirection: "column",
                  gap: 5,
                }}
              >
                {Object.values(INDICATORS).map((ind) => (
                  <div
                    key={ind}
                    onClick={() => {
                      setIndicator(ind);
                      setShowIndicatorPopup(false);
                    }}
                    style={{ padding: "5px 10px", cursor: "pointer" }}
                  >
                    {ind}
                  </div>
                ))}
              </div>
            )}
            <button
              id="drawing-btn"
              className="chartBtns"
              onClick={() => {
                setShowIndicatorPopup(false);
                setShowStylePopup(false);
                setShowThemePopup(false);
                setShowDrawingPopup(!showDrawingPopup);
              }}
              style={{
                color: "black",
                cursor: "pointer",
                height: 50,
                fontSize: "1.5rem",
                background: "#E0E0E0",
              }}
            >
              <BiPencil />
            </button>
            {showDrawingPopup && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  zIndex: 100,
                  background: "#E0E0E0",
                  border: `1px solid ${theme.gridColor}`,
                  borderRadius: 4,
                  padding: 10,
                  display: "flex",
                  flexDirection: "column",
                  gap: 5,
                }}
              >
                {Object.values(DRAWING_TOOLS).map((tool) => (
                  <div
                    key={tool}
                    onClick={() => {
                      setDrawingTool(tool);
                      setShowDrawingPopup(false);
                    }}
                    style={{
                      padding: "5px 10px",
                      color: theme.textColor,
                      cursor: "pointer",
                    }}
                  >
                    {tool}
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* Interval selector */}
          <div ref={(el) => (buttonRefs.current[2] = el)}>
            <select
              id="interval-select"
              value={interval}
              className="chartBtns"
              onChange={(e) => setInterval(e.target.value)}
              style={{
                appearance: "none",
                color: "black",
                cursor: "pointer",
                height: 50,
                fontSize: "1rem",
                background: "#E0E0E0",
              }}
            >
              {Object.keys(intervalToSeconds).map((i) => (
                <option key={i} value={i}>
                  {i}
                </option>
              ))}
            </select>
          </div>
          {/* Theme selector */}
          <div
            style={{ position: "relative" }}
            ref={(el) => (buttonRefs.current[3] = el)}
          >
            <button
              id="theme-btn"
              className="chartBtns"
              onClick={() => {
                setShowThemePopup(!showThemePopup);
                setShowIndicatorPopup(false);
                setShowStylePopup(false);
                setShowDrawingPopup(false);
              }}
              style={{
                color: "black",
                cursor: "pointer",
                height: 50,
                fontSize: "1.5rem",
                background: "#E0E0E0",
              }}
            >
              <AiOutlineBgColors />
            </button>
            {showThemePopup && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  zIndex: 100,
                  background: "#E0E0E0",
                  border: `1px solid ${theme.gridColor}`,
                  borderRadius: 4,
                  padding: 10,
                  display: "flex",
                  flexDirection: "column",
                  gap: 5,
                }}
              >
                {Object.values(THEMES).map((t) => (
                  <div
                    key={t.name}
                    onClick={() => {
                      setTheme(t);
                      setShowThemePopup(false);
                    }}
                    style={{
                      padding: "5px 10px",
                      borderRadius: 4,
                      color: t.textColor,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <div
                      style={{ width: 30, height: 30, background: t.upColor }}
                    />
                    <div
                      style={{ width: 30, height: 30, background: t.downColor }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* Chart style selector */}
          <div
            style={{ position: "relative" }}
            ref={(el) => (buttonRefs.current[4] = el)}
          >
            <button
              id="style-btn"
              className="chartBtns"
              onClick={() => {
                setShowStylePopup(!showStylePopup);
                setShowIndicatorPopup(false);
                setShowThemePopup(false);
                setShowDrawingPopup(false);
              }}
              style={{
                color: "black",
                cursor: "pointer",
                height: 50,
                fontSize: "1.5rem",
                background: "#E0E0E0",
              }}
            >
              <BsBarChartFill />
            </button>
            {showStylePopup && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  zIndex: 100,
                  background: "#E0E0E0",
                  border: `1px solid ${theme.gridColor}`,
                  borderRadius: 4,
                  padding: 10,
                  display: "flex",
                  flexDirection: "column",
                  gap: 5,
                }}
              >
                {Object.values(CANDLE_STYLES).map((style) => (
                  <div
                    key={style}
                    onClick={() => {
                      setCandleStyle(style);
                      setShowStylePopup(false);
                    }}
                    style={{ padding: "5px 10px", cursor: "pointer" }}
                  >
                    {style}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div>
          <Tabs />
        </div>
      </div>
      <div ref={containerRef} style={{ width: "100%", height: 600 }} />
    </div>
  );
};

export default ForexTradingChart;
