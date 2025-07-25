import { RiArrowDropDownLine } from "react-icons/ri";
import React, { useEffect, useRef, useState } from "react";
import {
  AiOutlinePlus,
  AiOutlineBgColors,
  AiOutlineClose,
} from "react-icons/ai";
import { BsBarChartFill } from "react-icons/bs";
import { BiLineChart, BiPencil } from "react-icons/bi";
import { FiMaximize2 } from "react-icons/fi";
import Tabs from "./components/Tabs/Tabs";
import "./LiveCandleChart.css";
import styles from "./Forex.module.css";
import CoinSelector from "./components/CoinSelector/CoinSelector";
import PreviousCoinsSelector from "./components/PreviousCoinsSelector/PreviousCoinsSelector";
import Trades from "./components/Trades/Trades";
import { useTheme } from "../../Context/ThemeContext";

const CANDLE_STYLES = {
  CANDLE: "Candlestick",
  BAR: "Bar",
  LINE: "Line",
  HOLLOW: "Hollow Candle",
};

const THEMES = {
  LIGHT: {
    name: "Light",
    background: "rgb(255,255,255)",
    textColor: "rgb(51,51,51)",
    gridColor: "rgba(60,60,60,1)", // lighter, more transparent
    upColor: "rgb(38,166,154)",
    downColor: "rgb(239,83,80)",
    borderVisible: true,
    wickVisible: true,
    wickUpColor: "rgb(38,166,154)",
    wickDownColor: "rgb(239,83,80)",
    wickWidth: 4,
  },
  DARK: {
    name: "Dark",
    background: "rgb(18,18,18)",
    textColor: "rgb(209,212,220)",
    gridColor: "rgba(200,200,200,1)", // lighter, more transparent
    upColor: "rgb(0,230,118)",
    downColor: "rgb(255,23,68)",
    borderVisible: true,
    wickVisible: true,
    wickUpColor: "rgb(0,230,118)",
    wickDownColor: "rgb(255,23,68)",
    wickWidth: 4,
  },
  BLUE: {
    name: "Blue",
    background: "rgb(14,26,47)",
    textColor: "rgb(255,255,255)",
    gridColor: "rgba(30,42,63,1)", // lighter, more transparent
    upColor: "rgb(76,175,80)",
    downColor: "rgb(244,67,54)",
    borderVisible: true,
    wickVisible: true,
    wickUpColor: "rgb(76,175,80)",
    wickDownColor: "rgb(244,67,54)",
    wickWidth: 4,
  },
};

// Supported intervals for TradingView
const intervalToSeconds = {
  "1m": 60,
  "3m": 180,
  "5m": 300,
  "15m": 900,
  "30m": 1800,
  "1h": 3600,
  "4h": 14400,
  "1d": 86400,
};

const SUPPORTED_INTERVALS = {
  "1m": "1",
  "3m": "3",
  "5m": "5",
  "15m": "15",
  "30m": "30",
  "1h": "60",
  "4h": "240",
  "1d": "1D",
};

// Indicator options
const INDICATORS = {
  NONE: "None",
  SMA: "SMA (20)",
  EMA: "EMA (20)",
  RSI: "RSI (14)",
  MACD: "MACD",
  BB: "Bollinger Bands",
};

// Drawing tool options
const DRAWING_TOOLS = {
  NONE: "None",
  HORIZONTAL_LINE: "Horizontal Line",
  VERTICAL_LINE: "Vertical Line",
  TREND_LINE: "Trend Line",
};

// Convert coin names to TradingView symbols
const getCoinSymbol = (coinName) => {
  // Handle forex pairs
  if (
    coinName.includes("USD") &&
    !coinName.includes("BTC") &&
    !coinName.includes("ETH")
  ) {
    // For forex pairs like EURUSD, GBPUSD, etc.
    return `FX:${coinName}`;
  }

  // Handle crypto pairs
  const cryptoMap = {
    BTCUSD: "BINANCE:BTCUSDT",
    ETHUSD: "BINANCE:ETHUSDT",
    ADAUSD: "BINANCE:ADAUSDT",
    XRPUSD: "BINANCE:XRPUSDT",
    DOTUSD: "BINANCE:DOTUSDT",
    SOLUSD: "BINANCE:SOLUSDT",
    AVAXUSD: "BINANCE:AVAXUSDT",
    MATICUSD: "BINANCE:MATICUSDT",
    LINKUSD: "BINANCE:LINKUSDT",
    LTCUSD: "BINANCE:LTCUSDT",
    BCHUSD: "BINANCE:BCHUSDT",
    UNIUSD: "BINANCE:UNIUSDT",
    ATOMUSD: "BINANCE:ATOMUSDT",
    ALGOUSD: "BINANCE:ALGOUSDT",
    FILUSD: "BINANCE:FILUSDT",
    TRXUSD: "BINANCE:TRXUSDT",
    XLMUSD: "BINANCE:XLMUSDT",
    VETUSD: "BINANCE:VETUSDT",
    ICPUSD: "BINANCE:ICPUSDT",
    THETAUSD: "BINANCE:THETAUSDT",
    FTMUSD: "BINANCE:FTMUSDT",
    AXSUSD: "BINANCE:AXSUSDT",
    SANDUSD: "BINANCE:SANDUSDT",
    MANAUSD: "BINANCE:MANAUSDT",
    GALAUSD: "BINANCE:GALAUSDT",
    APEUSD: "BINANCE:APEUSDT",
    GMTUSD: "BINANCE:GMTUSDT",
    NEARUSD: "BINANCE:NEARUSDT",
    ROSEUSD: "BINANCE:ROSEUSDT",
    DARTUSD: "BINANCE:DARTUSDT",
    SHIBUSD: "BINANCE:SHIBUSDT",
    DOGEUSD: "BINANCE:DOGEUSDT",
  };

  if (cryptoMap[coinName]) {
    return cryptoMap[coinName];
  }

  // Default fallback - try to format as crypto pair
  if (coinName.length === 6) {
    const base = coinName.substring(0, 3);
    const quote = coinName.substring(3, 6);
    return `BINANCE:${base}${quote}T`;
  }

  // If still not matched, default to forex
  return `FX:${coinName}`;
};

const ForexTradingChart = ({
  coinName,
  setSelectedCoin,
  coins,
  profit,
  type,
  trades,
  handleCloseTrade,
  getPriceForTrade,
  livePrice,
  otcPrice,
  forexPrice,
}) => {
  const { theme: globalTheme } = useTheme();
  const chartContainerRef = useRef();
  const [showCoinSelector, setShowCoinSelector] = useState(false);
  const coinSelectorRef = useRef();
  // Set default interval to 1 minute for TradingView
  const [interval, setInterval] = useState("1m");
  const [theme, setTheme] = useState(THEMES.LIGHT);
  const [candleStyle, setCandleStyle] = useState(CANDLE_STYLES.CANDLE);
  const [indicator, setIndicator] = useState(INDICATORS.NONE);
  const [drawingTool, setDrawingTool] = useState(DRAWING_TOOLS.NONE);
  const [showThemePopup, setShowThemePopup] = useState(false);
  const [showStylePopup, setShowStylePopup] = useState(false);
  const [showIndicatorPopup, setShowIndicatorPopup] = useState(false);
  const [showDrawingPopup, setShowDrawingPopup] = useState(false);
  const buttonRefs = useRef([]);
  const [tradePopup, setTradePopup] = useState(false);
  const [chartHeight, setChartHeight] = useState(600);
  const [isShaking, setIsShaking] = useState(false);

  // Chart height update effect
  useEffect(() => {
    const updateChartHeight = () => {
      let chartHeight;
      const width = window.innerWidth;
      // Large desktops
      if (width > 2560) {
        chartHeight = 800;
      } else if (width > 2100) {
        chartHeight = 850;
      } else if (width > 1920) {
        chartHeight = 750;
      } else if (width > 1800) {
        chartHeight = 700;
      } else if (width > 1700) {
        chartHeight = 650;
      } else if (width > 1600) {
        chartHeight = 600;
      }
      // Medium desktops
      else if (width > 1500) {
        chartHeight = 530;
      } else if (width > 1400) {
        chartHeight = 500;
      } else if (width > 1300) {
        chartHeight = 450;
      } else if (width > 1024) {
        chartHeight = 350;
      }
      // iPad Pro 12.9" (1024x1366), iPad Air 11" (834x1194), landscape
      else if (width > 900) {
        chartHeight = 320;
      }
      // iPad Mini (768x1024), iPad portrait, Galaxy Tab S8 (800x1280)
      else if (width > 800) {
        chartHeight = 300;
      }
      // iPhone 15 Pro Max, 14 Pro Max, 13 Pro Max, Galaxy S24 Ultra, S23 Ultra, S22 Ultra, Z Fold
      // Heights: 2796, 2778, 2778, 3120, 3088, 3088, 2176
      else if (window.innerHeight > 1200) {
        chartHeight = 480;
      }
      // iPhone 15/14/13/12/11 Pro, Pro Max, Plus, Galaxy S24/S23/S22/S21/S20, Note, Pixel 8/7/6 Pro
      // Heights: 2556, 2532, 2532, 2400, 2340, 2400, 2400, 2268, 2992, 3120, 3120
      else if (window.innerHeight > 1100) {
        chartHeight = 510;
      }
      // iPhone 15/14/13/12/11, SE, Mini, Galaxy S24/S23/S22/S21/S20 FE, Pixel 8/7/6, Z Flip
      // Heights: 2340, 2266, 2340, 2400, 2400, 2400, 2400, 2400, 2400, 2400, 2400, 2400
      else if (window.innerHeight > 900) {
        chartHeight = 490;
      }
      // Smallest phones (iPhone SE, older Androids, height < 900)
      else if (window.innerHeight > 800) {
        chartHeight = 460;
      } else if (window.innerHeight > 700) {
        chartHeight = 350;
      } else {
        chartHeight = 300; // Default for very small screens
      }
      setChartHeight(chartHeight);
    };
    updateChartHeight();
    window.addEventListener("resize", updateChartHeight);
    return () => window.removeEventListener("resize", updateChartHeight);
  }, []);

  // TradingView widget setup
  useEffect(() => {
    // Clean up any existing widgets
    const existingWidget = document.getElementById(
      "tradingview_chart_container"
    );
    if (existingWidget) {
      existingWidget.innerHTML = "";
    }

    // Remove existing script if present
    const existingScript = document.getElementById("tradingview-widget-script");
    if (existingScript) {
      existingScript.remove();
    }

    const script = document.createElement("script");
    script.id = "tradingview-widget-script";
    script.src = "https://s3.tradingview.com/tv.js";
    script.async = true;
    script.onload = () => {
      try {
        const symbol = getCoinSymbol(coinName);
        const tvInterval = SUPPORTED_INTERVALS[interval] || "1";
        console.log(
          `Loading TradingView chart for symbol: ${symbol}, interval: ${interval} -> ${tvInterval}`
        );

        new window.TradingView.widget({
          width: "100%",
          height: chartHeight,
          symbol: symbol,
          interval: tvInterval,
          timezone: "Etc/UTC",
          theme: globalTheme.name.toLowerCase(),
          style:
            candleStyle === CANDLE_STYLES.CANDLE
              ? "1"
              : candleStyle === CANDLE_STYLES.BAR
              ? "8"
              : candleStyle === CANDLE_STYLES.LINE
              ? "2"
              : "9",
          locale: "en",
          hide_top_toolbar: true,
          hide_legend: true,
          save_image: false,
          container_id: "tradingview_chart_container",
          studies: [],
          withdateranges: false,
          hide_side_toolbar: true,
          allow_symbol_change: false,
          fullscreen: false,
          autosize: true,
          hide_volume: true,
          toolbar_bg: globalTheme.background,
          enable_publishing: false,
          hideideas: true,
          overrides: {
            "paneProperties.background": globalTheme.background,
            "paneProperties.vertGridProperties.color": globalTheme.gridColor,
            "paneProperties.horzGridProperties.color": globalTheme.gridColor,
          },
        });
      } catch (error) {
        console.error("Error creating TradingView widget:", error);
      }
    };

    script.onerror = () => {
      console.error("Failed to load TradingView script");
    };

    if (chartContainerRef.current) {
      chartContainerRef.current.appendChild(script);
    }

    // Cleanup function
    return () => {
      const scriptToRemove = document.getElementById(
        "tradingview-widget-script"
      );
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, [coinName, interval, theme, candleStyle, chartHeight]);

  // Handle click outside coin selector to close it
  useEffect(() => {
    if (!showCoinSelector) return;

    function handleClickOutside(event) {
      if (
        coinSelectorRef.current &&
        !coinSelectorRef.current.contains(event.target)
      ) {
        setShowCoinSelector(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showCoinSelector]);

  // Toggle trade popup
  const toggleTradePopup = () => {
    setTradePopup(!tradePopup);
  };

  // Handle drawing tool selection
  const handleDrawingToolClick = (tool) => {
    setDrawingTool(tool);
    setShowDrawingPopup(false);
  };

  // Clear all drawings (placeholder function)
  const clearAllDrawings = () => {
    setDrawingTool(DRAWING_TOOLS.NONE);
    setShowDrawingPopup(false);
  };

  // Close popups when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if the clicked element is not part of any popup
      if (
        !event.target.closest(".popup-green-border") &&
        !event.target.closest(".chartBtns")
      ) {
        setShowThemePopup(false);
        setShowStylePopup(false);
        setShowIndicatorPopup(false);
        setShowDrawingPopup(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Shake effect with randomized interval (2-3s)
  useEffect(() => {
    let timeoutId;
    function triggerShake() {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 700); // shake duration
      // Next shake in 2-3 seconds (random)
      const next = 2000 + Math.random() * 1000;
      timeoutId = setTimeout(triggerShake, next);
    }
    triggerShake();
    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <div
      className="mainBOX"
      style={{
        background: globalTheme.background,
        color: globalTheme.textColor,
        borderRadius: 10,
      }}
    >
      <div
        className="charting"
        style={{
          background:
            window.innerWidth < 768 ? globalTheme.background : "transparent",
          display: "flex",
          marginBottom: 10,
        }}
      >
        {/* Coin Selector Button */}
        <div style={{ display: "flex", flexDirection: "row" }}>
          <div className="coinSelectorMobile2">
            <button
              id="indicator-btn"
              className="chartBtns"
              onClick={() => setShowCoinSelector(!showCoinSelector)}
              style={{
                fontSize: "1rem",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                color: globalTheme.textColor,
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
                  {coins.find((c) => c.name === coinName)?.firstName}/
                  {coins.find((c) => c.name === coinName)?.lastName}
                  {"("}
                  {"Live"}
                  {")"}
                </p>
                <p className="nameProfit">
                  &nbsp;&nbsp;
                  {profit}
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
          <div
            className="webCoinInfo"
            style={{
              position: "absolute",
              color: globalTheme.textColor,
              background: globalTheme.box,
            }}
          >
            <div className="coininfoBox">
              <p className="nameProfitWeb">
                {coins.find((c) => c.name === coinName)?.firstName}/
                {coins.find((c) => c.name === coinName)?.lastName}
                {"("}
                {"Live"}
                {")"}
              </p>
              <p className="nameProfitWeb">
                &nbsp;&nbsp;
                {profit}
                {"% "}
              </p>
            </div>
          </div>
          <div
            style={{
              position: "absolute",
              top: 100,
              zIndex: 100,
              display: window.innerWidth < 768 ? "none" : "flex",
            }}
          >
            <PreviousCoinsSelector
              setSelectedCoin={setSelectedCoin}
              coins={coins}
              currentCoin={coinName}
            />
          </div>

          {window.innerWidth < 768 && (
            <button
              onClick={() => setTradePopup(true)}
              className="show-trades-btn"
              style={{
                marginRight: 8,
                background: "#10A055",
                color: "#fff",
                border: "none",
                width: "100px",
                padding: "8px 16px",
                fontWeight: 600,
                fontSize: "1rem",
                cursor: "pointer",
                top: "103px",
                left: 0,
                zIndex: 2,
                position: "absolute",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              }}
            >
              Trades
            </button>
          )}
          {tradePopup && (
            <div
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100vw",
                height: "100vh",
                background: "rgba(0,0,0,0.4)",
                zIndex: 3211312,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              onClick={() => setTradePopup(false)}
            >
              <div
                style={{
                  background: globalTheme.box,
                  color: globalTheme.textColor,
                  borderRadius: 10,
                  padding: 24,
                  minWidth: 320,
                  maxWidth: 400,
                  width: "90vw",
                  maxHeight: "80vh",
                  overflowY: "auto",
                  position: "relative",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  style={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    background: "transparent",
                    border: "none",
                    fontSize: 24,
                    cursor: "pointer",
                    color: "#222",
                    zIndex: 2,
                  }}
                  onClick={() => setTradePopup(false)}
                >
                  <AiOutlineClose />
                </button>
                <Trades
                  trades={trades}
                  coins={coins}
                  handleCloseTrade={handleCloseTrade}
                  getPriceForTrade={getPriceForTrade}
                  livePrice={livePrice}
                  otcPrice={otcPrice}
                  forexPrice={forexPrice}
                />
              </div>
            </div>
          )}
          <div style={{ position: "relative", display: "flex" }}>
            <button
              className="chartBtns"
              onClick={() => {
                setShowIndicatorPopup(!showIndicatorPopup);
                setShowStylePopup(false);
                setShowThemePopup(false);
                setShowDrawingPopup(false);
              }}
              style={{
                color: globalTheme.textColor,
                cursor: "pointer",
                height: 50,
                fontSize: "1.5rem",
                background: globalTheme.inputBackground,
                border: `1.5px solid ${globalTheme.box}`,
                borderRadius: 6,
                transition: "background 0.2s, color 0.2s, border 0.2s",
              }}
            >
              <BiLineChart />
            </button>

            {showIndicatorPopup && (
              <div
                className="popup-green-border"
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  zIndex: 100,
                  background: globalTheme.popup,
                  border: `2px solid ${globalTheme.tabBtnHoverColor}`,
                  borderRadius: 4,
                  padding: 10,
                  display: "flex",
                  flexDirection: "column",
                  gap: 5,
                  color: globalTheme.textColor,
                }}
              >
                {Object.values(INDICATORS).map((ind) => (
                  <div
                    key={ind}
                    onClick={() => {
                      setIndicator(ind);
                      setShowIndicatorPopup(false);
                    }}
                    style={{
                      padding: "5px 10px",
                      cursor: "pointer",
                      borderRadius: 4,
                      background: globalTheme.inputBackground,
                      color: globalTheme.textColor,
                      marginBottom: 2,
                      transition: "background 0.2s, color 0.2s",
                    }}
                  >
                    {ind}
                  </div>
                ))}
              </div>
            )}

            <button
              className="chartBtns"
              onClick={() => {
                setShowIndicatorPopup(false);
                setShowStylePopup(false);
                setShowThemePopup(false);
                setShowDrawingPopup(!showDrawingPopup);
              }}
              style={{
                color: globalTheme.textColor,
                cursor: "pointer",
                height: 50,
                fontSize: "1.5rem",
                background: globalTheme.inputBackground,
                border: `1.5px solid ${globalTheme.box}`,
                borderRadius: 6,
                transition: "background 0.2s, color 0.2s, border 0.2s",
              }}
            >
              <BiPencil />
            </button>
            {showDrawingPopup && (
              <div
                className="popup-green-border"
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  zIndex: 100,
                  background: globalTheme.popup,
                  border: `2px solid ${globalTheme.tabBtnHoverColor}`,
                  borderRadius: 4,
                  padding: 10,
                  display: "flex",
                  flexDirection: "column",
                  gap: 5,
                  color: globalTheme.textColor,
                }}
              >
                {Object.values(DRAWING_TOOLS).map((tool) => (
                  <div
                    key={tool}
                    onClick={() => handleDrawingToolClick(tool)}
                    style={{
                      padding: "5px 10px",
                      color: globalTheme.textColor,
                      background: globalTheme.inputBackground,
                      borderRadius: 4,
                      cursor: "pointer",
                      marginBottom: 2,
                      transition: "background 0.2s, color 0.2s",
                    }}
                  >
                    {tool}
                  </div>
                ))}
                <div
                  onClick={clearAllDrawings}
                  style={{
                    padding: "5px 10px",
                    borderRadius: 4,
                    cursor: "pointer",
                    borderTop: `1px solid ${globalTheme.gridColor}`,
                    marginTop: 5,
                    background: globalTheme.inputBackground,
                    color: globalTheme.textColor,
                  }}
                >
                  Clear All
                </div>
              </div>
            )}
          </div>
          <select
            value={interval}
            onClick={() => {
              setShowThemePopup(false);
              setShowIndicatorPopup(false);
              setShowStylePopup(false);
              setShowDrawingPopup(false);
            }}
            className="chartBtns"
            onChange={(e) => setInterval(e.target.value)}
            style={{
              appearance: "none",
              color: globalTheme.textColor,
              cursor: "pointer",
              height: 50,
              fontSize: "1rem",
              background: globalTheme.inputBackground,
              border: `1.5px solid ${globalTheme.box}`,
              borderRadius: 6,
              transition: "background 0.2s, color 0.2s, border 0.2s",
            }}
          >
            {Object.keys(intervalToSeconds).map((i) => (
              <option
                key={i}
                value={i}
                style={{
                  background: globalTheme.inputBackground,
                  color: globalTheme.textColor,
                }}
              >
                {i}
              </option>
            ))}
          </select>
          <div style={{ position: "relative" }}>
            <button
              className="chartBtns"
              onClick={() => {
                setShowThemePopup(!showThemePopup);
                setShowIndicatorPopup(false);
                setShowStylePopup(false);
                setShowDrawingPopup(false);
              }}
              style={{
                color: globalTheme.textColor,
                cursor: "pointer",
                height: 50,
                fontSize: "1.5rem",
                background: globalTheme.inputBackground,
                border: `1.5px solid ${globalTheme.box}`,
                borderRadius: 6,
                transition: "background 0.2s, color 0.2s, border 0.2s",
              }}
            >
              <AiOutlineBgColors />
            </button>
            {showThemePopup && (
              <div
                className="popup-green-border"
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  zIndex: 100,
                  background: globalTheme.popup,
                  border: `2px solid ${globalTheme.tabBtnHoverColor}`,
                  borderRadius: 4,
                  padding: 10,
                  display: "flex",
                  flexDirection: "column",
                  gap: 5,
                  color: globalTheme.textColor,
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
                      marginBottom: 2,
                      border:
                        t.name === globalTheme.name
                          ? `2px solid ${globalTheme.tabBtnHoverColor}`
                          : "none",
                      transition: "background 0.2s, color 0.2s, border 0.2s",
                    }}
                  >
                    <div
                      style={{
                        width: 30,
                        height: 30,
                        background: t.upColor,
                        borderRadius: 4,
                        marginRight: 6,
                      }}
                    />
                    <div
                      style={{
                        width: 30,
                        height: 30,
                        background: t.downColor,
                        borderRadius: 4,
                        marginRight: 6,
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
          <div style={{ position: "relative" }}>
            <button
              className="chartBtns"
              onClick={() => {
                setShowStylePopup(!showStylePopup);
                setShowIndicatorPopup(false);
                setShowThemePopup(false);
                setShowDrawingPopup(false);
              }}
              style={{
                color: globalTheme.textColor,
                cursor: "pointer",
                height: 50,
                fontSize: "1.5rem",
                background: globalTheme.inputBackground,
                border: `1.5px solid ${globalTheme.box}`,
                borderRadius: 6,
                transition: "background 0.2s, color 0.2s, border 0.2s",
              }}
            >
              <BsBarChartFill />
            </button>
            {showStylePopup && (
              <div
                className="popup-green-border"
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  zIndex: 100,
                  background: globalTheme.popup,
                  border: `2px solid ${globalTheme.tabBtnHoverColor}`,
                  borderRadius: 4,
                  padding: 10,
                  display: "flex",
                  flexDirection: "column",
                  gap: 5,
                  color: globalTheme.textColor,
                }}
              >
                {Object.values(CANDLE_STYLES).map((style) => (
                  <div
                    key={style}
                    onClick={() => {
                      setCandleStyle(style);
                      setShowStylePopup(false);
                    }}
                    style={{
                      padding: "5px 10px",
                      cursor: "pointer",
                      borderRadius: 4,
                      background: globalTheme.inputBackground,
                      color: globalTheme.textColor,
                      marginBottom: 2,
                      transition: "background 0.2s, color 0.2s",
                    }}
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

      <div
        style={{
          width: "100%",
          position: "relative",
          minHeight: `${chartHeight + 20}px`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          className={isShaking ? "popup-shake" : ""}
          style={{
            background: "linear-gradient(135deg, #10A055 0%, #38ef7d 100%)",
            color: "#fff",
            borderRadius: 18,
            padding:
              window.innerWidth < 600
                ? "28px 12px"
                : window.innerWidth < 900
                ? "36px 24px"
                : "48px 64px",
            fontSize:
              window.innerWidth < 600 ? 18 : window.innerWidth < 900 ? 24 : 32,
            fontWeight: 800,
            boxShadow: "0 8px 32px rgba(16,160,85,0.18)",
            border: "none",
            textAlign: "center",
            letterSpacing: 1.2,
            position: "relative",
            overflow: "hidden",
            maxWidth: 480,
            width: "90vw",
            transition: "box-shadow 0.2s, transform 0.2s",
          }}
        >
          <svg
            width={window.innerWidth < 600 ? 40 : 64}
            height={window.innerWidth < 600 ? 40 : 64}
            viewBox="0 0 64 64"
            fill="none"
            style={{ marginBottom: window.innerWidth < 600 ? 12 : 24 }}
          >
            <circle cx="32" cy="32" r="32" fill="#fff2" />
            <path
              d="M32 18v20M32 46h.02"
              stroke="#fff"
              strokeWidth="4"
              strokeLinecap="round"
            />
          </svg>
          <div
            style={{
              fontSize: window.innerWidth < 600 ? 22 : 36,
              fontWeight: 900,
              marginBottom: 12,
              letterSpacing: 1.5,
            }}
          >
            Live Market
          </div>
          <div
            style={{
              fontSize: window.innerWidth < 600 ? 15 : 22,
              fontWeight: 600,
              opacity: 0.95,
              marginBottom: 8,
            }}
          >
            Coming Soon
          </div>
          <div
            style={{
              fontSize: window.innerWidth < 600 ? 12 : 16,
              opacity: 0.8,
              marginTop: 8,
            }}
          >
            Stay tuned for real-time Forex trading charts and features!
          </div>
          <style>{`
            .popup-shake {
              animation: shakeY 0.6s cubic-bezier(.22,1.2,.36,1);
            }
            @keyframes shakeY {
              0% { transform: translateY(0); }
              15% { transform: translateY(-7px); }
              30% { transform: translateY(6px); }
              45% { transform: translateY(-4px); }
              60% { transform: translateY(3px); }
              75% { transform: translateY(-2px); }
              100% { transform: translateY(0); }
            }
          `}</style>
        </div>
      </div>
    </div>
  );
};

export default ForexTradingChart;
