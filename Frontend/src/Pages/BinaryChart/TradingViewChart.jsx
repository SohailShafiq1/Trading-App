import { RiArrowDropDownLine } from "react-icons/ri";
import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import {
  createChart,
  CrosshairMode,
  CandlestickSeries,
  BarSeries,
  LineSeries,
} from "lightweight-charts";
import {
  AiOutlinePlus,
  AiOutlineBgColors,
  AiOutlineClose,
} from "react-icons/ai";
import { BsBarChartFill } from "react-icons/bs";
import { BiPencil } from "react-icons/bi";
import "./LiveCandleChart.css";
import Tabs from "./components/Tabs/Tabs";
import { useAuth } from "../../Context/AuthContext";
import { FiMaximize2, FiMinimize2 } from "react-icons/fi";
import CoinSelector from "./components/CoinSelector/CoinSelector";
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

// Time interval mapping
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

// Chart style options
const CANDLE_STYLES = {
  CANDLE: "Candlestick",
  BAR: "Bar",
  LINE: "Line",
  HOLLOW: "Hollow Candle",
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

// Theme options
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

// Drawing tool options
const DRAWING_TOOLS = {
  NONE: "None",
  HORIZONTAL_LINE: "Horizontal Line",
  VERTICAL_LINE: "Vertical Line",
  TREND_LINE: "Trend Line",
};

const TradingViewChart = ({
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
  const { user, updateUserTipStatus } = useAuth();
  const [showCoinSelector, setShowCoinSelector] = useState(false);
  const coinSelectorRef = useRef();
  const [interval, setInterval] = useState("30m");
  const [candles, setCandles] = useState([]);
  const [currentPrice, setCurrentPrice] = useState(null);
  const [theme, setTheme] = useState(THEMES.LIGHT);
  const [candleStyle, setCandleStyle] = useState(CANDLE_STYLES.CANDLE);
  const [indicator, setIndicator] = useState(INDICATORS.NONE);
  const [drawingTool, setDrawingTool] = useState(DRAWING_TOOLS.NONE);
  const [showThemePopup, setShowThemePopup] = useState(false);
  const [showStylePopup, setShowStylePopup] = useState(false);
  const [showIndicatorPopup, setShowIndicatorPopup] = useState(false);
  const [showDrawingPopup, setShowDrawingPopup] = useState(false);

  // Tutorial state
  const [showTutorial, setShowTutorial] = useState(false);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const buttonRefs = useRef([]);

  // Tips data
  const tips = [
    {
      id: "indicator-btn",
      text: "⬆️ Add technical indicators like SMA, EMA, RSI to analyze price trends",
    },
    {
      id: "drawing-btn",
      text: "⬆️ Use drawing tools to mark support/resistance levels and trends",
    },
    {
      id: "interval-select",
      text: "⬆️ Change the time interval to view different timeframes (1m, 5m, 1h, etc.)",
    },
    {
      id: "theme-btn",
      text: "⬆️ Switch between light, dark, and other color themes",
    },
    {
      id: "style-btn",
      text: "⬆️ Change chart style between candlesticks, bars, and line charts",
    },
    {
      id: "chart-container",
      text: "⬇️ This is your main chart area. Hover to see price details at specific times",
    },
  ];

  // Refs for indicators and drawings
  const smaSeriesRef = useRef(null);
  const emaSeriesRef = useRef(null);
  const rsiSeriesRef = useRef(null);
  const drawingsRef = useRef([]);

  // Initialize tutorial
  useEffect(() => {
    // Refetch user from backend when tip1 or tip2 might have changed
    const fetchUser = async () => {
      try {
        const res = await axios.get(`${BACKEND_URL}/api/users/${user._id}`);
        const updatedUser = res.data;
        const tip2 = updatedUser?.tips?.find(
          (tip) => tip.text === "tip2"
        )?.status;
        const tip1 = updatedUser?.tips?.find(
          (tip) => tip.text === "tip1"
        )?.status;
        if (!tip1 && tip2) {
          setShowTutorial(true);
          buttonRefs.current = buttonRefs.current.slice(0, tips.length);
        }
      } catch (err) {
        // fallback to local user if fetch fails
        const tip2 = user?.tips?.find((tip) => tip.text === "tip2")?.status;
        const tip1 = user?.tips?.find((tip) => tip.text === "tip1")?.status;
        if (!tip1 && tip2) {
          setShowTutorial(true);
          buttonRefs.current = buttonRefs.current.slice(0, tips.length);
        }
      }
    };

    if (user && user._id) {
      fetchUser();
    }
    // eslint-disable-next-line
  }, [
    user?.tips?.find((tip) => tip.text === "tip1")?.status,
    user?.tips?.find((tip) => tip.text === "tip2")?.status,
  ]);

  // Fetch coin data
  useEffect(() => {
    axios
      .get(`${BACKEND_URL}/api/coins`)
      .then((res) => setCoins(res.data))
      .catch(() => setCoins([]));
  }, []);

  // Fetch candle data
  const fetchCandles = async () => {
    try {
      const response = await axios.get(
        `https://api.binance.com/api/v3/klines?symbol=${coinName}USDT&interval=${interval.replace(
          "m",
          ""
        )}m&limit=1000`
      );

      const formattedCandles = response.data.map((candle) => ({
        time: candle[0] / 1000,
        open: parseFloat(candle[1]),
        high: parseFloat(candle[2]),
        low: parseFloat(candle[3]),
        close: parseFloat(candle[4]),
        volume: parseFloat(candle[5]),
      }));

      setCandles(formattedCandles);
      if (formattedCandles.length > 0) {
        setCurrentPrice(formattedCandles[formattedCandles.length - 1].close);
      }
    } catch (error) {
      console.error("Error fetching candle data:", error);
    }
  };

  // Apply theme to chart
  const applyTheme = () => {
    if (!chartRef.current) return;

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

    if (seriesRef.current) {
      seriesRef.current.applyOptions({
        upColor: theme.upColor,
        downColor: theme.downColor,
        borderUpColor: theme.upColor,
        borderDownColor: theme.downColor,
        wickUpColor: theme.upColor,
        wickDownColor: theme.downColor,
      });
    }
  };

  // Apply candle style
  const applyCandleStyle = () => {
    if (!chartRef.current) return;

    if (seriesRef.current) {
      chartRef.current.removeSeries(seriesRef.current);
    }

    // Create new series based on style - using v5 API
    switch (candleStyle) {
      case CANDLE_STYLES.CANDLE:
        seriesRef.current = chartRef.current.addSeries(CandlestickSeries, {
          upColor: theme.upColor,
          downColor: theme.downColor,
          borderUpColor: theme.upColor,
          borderDownColor: theme.downColor,
          wickUpColor: theme.upColor,
          wickDownColor: theme.downColor,
        });
        break;
      case CANDLE_STYLES.BAR:
        seriesRef.current = chartRef.current.addSeries(BarSeries, {
          upColor: theme.upColor,
          downColor: theme.downColor,
        });
        break;
      case CANDLE_STYLES.LINE:
        seriesRef.current = chartRef.current.addSeries(LineSeries, {
          color: theme.upColor,
          lineWidth: 2,
        });
        break;
      case CANDLE_STYLES.HOLLOW:
        seriesRef.current = chartRef.current.addSeries(CandlestickSeries, {
          upColor: "transparent",
          downColor: "transparent",
          borderUpColor: theme.upColor,
          borderDownColor: theme.downColor,
          wickUpColor: theme.upColor,
          wickDownColor: theme.downColor,
        });
        break;
      default:
        seriesRef.current = chartRef.current.addSeries(CandlestickSeries, {
          upColor: theme.upColor,
          downColor: theme.downColor,
          borderUpColor: theme.upColor,
          borderDownColor: theme.downColor,
          wickUpColor: theme.upColor,
          wickDownColor: theme.downColor,
        });
    }

    if (candles.length > 0) {
      if (candleStyle === CANDLE_STYLES.LINE) {
        const lineData = candles.map((candle) => ({
          time: candle.time,
          value: candle.close,
        }));
        seriesRef.current.setData(lineData);
      } else {
        seriesRef.current.setData(candles);
      }
    }
  };

  // Apply indicators
  const applyIndicators = () => {
    // Remove previous indicators
    if (smaSeriesRef.current)
      chartRef.current.removeSeries(smaSeriesRef.current);
    if (emaSeriesRef.current)
      chartRef.current.removeSeries(emaSeriesRef.current);
    if (rsiSeriesRef.current)
      chartRef.current.removeSeries(rsiSeriesRef.current);

    if (indicator === INDICATORS.NONE) return;

    // Simple indicator implementations
    switch (indicator) {
      case INDICATORS.SMA:
        const smaData = candles
          .map((candle, i, arr) => {
            if (i < 20) return null;
            const sum = arr
              .slice(i - 20, i)
              .reduce((acc, val) => acc + val.close, 0);
            return {
              time: candle.time,
              value: sum / 20,
            };
          })
          .filter(Boolean);

        smaSeriesRef.current = chartRef.current.addSeries(LineSeries, {
          color: "#2962FF",
          lineWidth: 2,
        });
        smaSeriesRef.current.setData(smaData);
        break;

      case INDICATORS.EMA:
        // Similar EMA implementation would go here
        break;
    }
  };

  // Initialize chart
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
    seriesRef.current = chart.addSeries(CandlestickSeries, {
      upColor: theme.upColor,
      downColor: theme.downColor,
      borderUpColor: theme.upColor,
      borderDownColor: theme.downColor,
      wickUpColor: theme.upColor,
      wickDownColor: theme.downColor,
    });

    return () => {
      chart.remove();
    };
  }, []);

  // Fetch data when coinName or interval changes
  useEffect(() => {
    fetchCandles();
  }, [coinName, interval]);

  // Update chart when data or settings change
  useEffect(() => {
    applyTheme();
    applyCandleStyle();
    applyIndicators();
  }, [candles, theme, candleStyle, indicator]);

  // Get button position for tooltip
  const getButtonPosition = (index) => {
    if (buttonRefs.current[index]) {
      const rect = buttonRefs.current[index].getBoundingClientRect();
      return {
        top: rect.bottom + window.scrollY + 10,
        left: rect.left + window.scrollX + rect.width / 2,
        buttonWidth: rect.width,
      };
    }
    return { top: 0, left: 0, buttonWidth: 0 };
  };

  const handleNextTip = () => {
    if (currentTipIndex < tips.length - 1) {
      setCurrentTipIndex(currentTipIndex + 1);
    }
  };

  const handlePrevTip = () => {
    if (currentTipIndex > 0) {
      setCurrentTipIndex(currentTipIndex - 1);
    }
  };

  const handleCloseTutorial = async () => {
    setShowTutorial(false);
    try {
      await axios.put(`${BACKEND_URL}/api/users/update-tip/${user._id}`, {
        tipName: "tip2",
      });
    } catch (error) {
      console.error("Failed to update tip status:", error);
    }
  };

  const position = getButtonPosition(currentTipIndex);

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

  // --- TRADE BOXES DYNAMIC SIZE AND POSITION ---
  const [tradeBoxSize, setTradeBoxSize] = useState({
    width: 44,
    height: 16,
    font: 9,
  });
  const [tradeHover, setTradeHover] = useState({});
  useEffect(() => {
    if (!chartRef.current) return;
    let raf;
    const updateSize = () => {
      if (!chartRef.current) return;
      const timeScale = chartRef.current.timeScale();
      let barSpacing = 10;
      if (typeof timeScale.barSpacing === "function") {
        barSpacing = timeScale.barSpacing();
      } else if (timeScale.options && timeScale.options.barSpacing) {
        barSpacing = timeScale.options.barSpacing;
      }
      barSpacing = Math.max(3, Math.min(barSpacing, 40));
      const width = Math.max(28, Math.min(90, barSpacing * 4.2));
      const height = Math.max(14, Math.min(36, barSpacing * 1.6));
      const font = Math.max(8, Math.min(18, barSpacing * 0.85));
      setTradeBoxSize({ width, height, font });
      raf = requestAnimationFrame(updateSize);
    };
    updateSize();
    return () => cancelAnimationFrame(raf);
  }, [interval]);

  // --- TRADE BOXES AND LINES RENDERING ---
  const renderTradeBoxesAndLines = () => {
    if (!chartRef.current || !seriesRef.current || !containerRef.current)
      return null;
    // Group trades by interval bucket
    const intervalSec = intervalToSeconds[interval] || 60;
    let chartTimes = [];
    let chartData = [];
    if (seriesRef.current && seriesRef.current._internal__data?._data) {
      chartData = seriesRef.current._internal__data._data;
      chartTimes = chartData.map((c) =>
        typeof c.time === "string"
          ? Math.floor(Date.parse(c.time) / 1000)
          : Number(c.time)
      );
    }
    // Map: { intervalTime: [trades] }
    const grouped = {};
    trades
      .filter(
        (trade) =>
          trade &&
          trade.status === "running" &&
          trade.coinName === coinName &&
          (trade.investment !== undefined ||
            trade.price !== undefined ||
            trade.coinPrice !== undefined)
      )
      .forEach((trade) => {
        let tradeTimestamp;
        if (typeof trade.startedAt === "number") {
          tradeTimestamp =
            trade.startedAt > 1e12
              ? Math.floor(trade.startedAt / 1000)
              : trade.startedAt;
        } else if (typeof trade.startedAt === "string") {
          const parsed = Date.parse(trade.startedAt);
          if (!isNaN(parsed)) {
            tradeTimestamp = Math.floor(parsed / 1000);
          }
        } else if (trade.startedAt instanceof Date) {
          tradeTimestamp = Math.floor(trade.startedAt.getTime() / 1000);
        }
        
        // Instead of bucketing, find the closest existing chart time that is >= trade time
        let mappedTime = tradeTimestamp;
        if (chartTimes.length > 0) {
          // Find the closest chart time that is at or after the trade time
          const futureOrCurrentTimes = chartTimes.filter(time => time >= tradeTimestamp);
          if (futureOrCurrentTimes.length > 0) {
            mappedTime = Math.min(...futureOrCurrentTimes);
          } else {
            // If no future times, use the latest available time
            mappedTime = Math.max(...chartTimes);
          }
        }
        
        if (!grouped[mappedTime]) grouped[mappedTime] = [];
        grouped[mappedTime].push(trade);
      });
    // For each interval, render all trades in the same row (horizontal offset)
    const boxWidth = tradeBoxSize.width;
    const boxHeight = tradeBoxSize.height;
    const fontSize = tradeBoxSize.font;
    let rendered = [];
    Object.keys(grouped)
      .sort((a, b) => a - b)
      .forEach((mappedTime) => {
        const tradesArr = grouped[mappedTime];
        tradesArr.sort((a, b) => {
          const aTime = new Date(a.startedAt).getTime();
          const bTime = new Date(b.startedAt).getTime();
          return aTime - bTime;
        });
        const gap = 28;
        const totalWidth =
          tradesArr.length * boxWidth + (tradesArr.length - 1) * gap;
        const x = chartRef.current
          ?.timeScale()
          .timeToCoordinate(Number(mappedTime));
        const containerRect = containerRef.current.getBoundingClientRect() || {
          width: 600,
          height: 500,
        };
        let startLeft =
          x != null && !isNaN(x)
            ? Math.max(
                boxWidth / 2,
                Math.min(
                  x - totalWidth + boxWidth,
                  x - totalWidth / 2,
                  containerRect.width - totalWidth + boxWidth / 2
                )
              )
            : containerRect.width - totalWidth - 10;
        const latestBoxRight =
          startLeft + (tradesArr.length - 1) * (boxWidth + gap) + boxWidth;
        if (x != null && latestBoxRight > x + boxWidth / 2) {
          startLeft -= latestBoxRight - (x + boxWidth / 2);
        }
        // Render trade boxes
        tradesArr.forEach((trade, idx) => {
          const tradeId =
            trade.id || trade._id || `${trade.startedAt}-${trade.coinName}`;
          const tradePrice = trade.entryPrice ?? trade.coinPrice ?? trade.price;
          const y = seriesRef.current?.priceToCoordinate(Number(tradePrice));
          const left = startLeft + idx * (boxWidth + gap);
          const top =
            y != null && !isNaN(y)
              ? Math.max(
                  boxHeight / 2,
                  Math.min(y, containerRect.height - boxHeight / 2)
                )
              : 40;
          const isBuy = trade.type === "Buy";
          const boxColor = isBuy ? "#10A055" : "#FF0000";
          const borderColor = isBuy ? "#0d7a3a" : "#b80000";
          const textColor = "#fff";
          rendered.push(
            <div
              key={tradeId}
              style={{
                position: "absolute",
                left: `${left}px`,
                top: `${top}px`,
                background: boxColor,
                color: textColor,
                border: `1.2px solid ${borderColor}`,
                borderRadius: 5,
                minWidth: 38,
                minHeight: 24,
                width: boxWidth,
                height: boxHeight,
                fontWeight: 600,
                fontSize: fontSize,
                boxShadow: "0 1px 4px rgba(0,0,0,0.13)",
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                padding: "2px 7px",
                gap: 6,
                transition:
                  "box-shadow 0.2s, background 0.2s, left 0.15s, top 0.15s, width 0.15s, height 0.15s, font-size 0.15s",
                cursor: "pointer",
                zIndex: 10,
                pointerEvents: "auto",
                opacity: 1,
              }}
              onMouseEnter={() =>
                setTradeHover((h) => ({ ...h, [tradeId]: true }))
              }
              onMouseLeave={() =>
                setTradeHover((h) => ({ ...h, [tradeId]: false }))
              }
            >
              <span style={{ fontWeight: 700, fontSize: fontSize + 1 }}>
                {isBuy ? "B" : "S"}
              </span>
              <span style={{ fontWeight: 600, fontSize: fontSize }}>
                ${trade.investment ?? trade.price ?? trade.coinPrice}
              </span>
              <span
                style={{ fontSize: fontSize - 1, color: "#fff", opacity: 0.85 }}
              >
                {trade.remainingTime > 0 ? `${trade.remainingTime}s` : ""}
              </span>
              {tradeHover[tradeId] && (
                <div
                  style={{
                    position: "absolute",
                    top: `-${boxHeight}px`,
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: "#222",
                    color: "#fff",
                    padding: "2px 7px",
                    borderRadius: 4,
                    fontSize: fontSize,
                    whiteSpace: "nowrap",
                    zIndex: 10001,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
                  }}
                >
                  Payout: $
                  {(
                    (trade.investment ?? trade.price ?? trade.coinPrice) *
                    (profit ? 1 + profit / 100 : 1)
                  ).toFixed(2)}
                </div>
              )}
              {trade.remainingTime === 0 && tradeId && handleCloseTrade && (
                <button
                  style={{
                    position: "absolute",
                    top: 1,
                    right: 1,
                    background: "rgba(255,255,255,0.15)",
                    border: "none",
                    color: "#fff",
                    fontSize: fontSize - 1,
                    cursor: "pointer",
                    zIndex: 30,
                    borderRadius: 2,
                    padding: 0,
                    transition: "background 0.2s",
                    width: fontSize + 6,
                    height: fontSize + 6,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  onClick={() => handleCloseTrade({ ...trade, id: tradeId })}
                  title="Close Trade"
                >
                  <AiOutlineClose />
                </button>
              )}
            </div>
          );
        });
        // --- Add lines for each trade after the latest trade ---
        if (
          tradesArr.length > 0 &&
          chartRef.current &&
          seriesRef.current &&
          containerRef.current
        ) {
          const lastTrade = tradesArr[tradesArr.length - 1];
          const lastTradePrice =
            lastTrade.entryPrice ?? lastTrade.coinPrice ?? lastTrade.price;
          const yLast = seriesRef.current.priceToCoordinate(
            Number(lastTradePrice)
          );
          const leftLast =
            startLeft +
            (tradesArr.length - 1) * (boxWidth + gap) +
            boxWidth / 2;
          const topLast =
            yLast != null && !isNaN(yLast)
              ? Math.max(
                  boxHeight / 2,
                  Math.min(yLast, containerRect.height - boxHeight / 2)
                )
              : 40;
          tradesArr.forEach((trade, idx) => {
            // Show lines for a short time even after timeout (don't return immediately)
            const isExpired = typeof trade.remainingTime === "number" && trade.remainingTime <= 0;
            
            // Skip only if trade has been expired for more than 5 seconds
            if (isExpired && trade.expiredAt && (Date.now() - trade.expiredAt) > 5000) {
              return;
            }
            let durationSec = 60;
            if (typeof trade.duration === "number") {
              durationSec = trade.duration;
            } else if (
              typeof trade.remainingTime === "number" &&
              typeof trade.startedAt !== "undefined"
            ) {
              const now = Math.floor(Date.now() / 1000);
              const started =
                typeof trade.startedAt === "number"
                  ? trade.startedAt > 1e12
                    ? Math.floor(trade.startedAt / 1000)
                    : trade.startedAt
                  : Math.floor(new Date(trade.startedAt).getTime() / 1000);
              durationSec = trade.remainingTime + (now - started);
            }
            let tradeStartSec =
              typeof trade.startedAt === "number"
                ? trade.startedAt > 1e12
                  ? Math.floor(trade.startedAt / 1000)
                  : trade.startedAt
                : Math.floor(new Date(trade.startedAt).getTime() / 1000);
            let tradeEndSec = tradeStartSec + durationSec;
            let x0 = chartRef.current
              .timeScale()
              .timeToCoordinate(tradeStartSec);
            let x1 = chartRef.current.timeScale().timeToCoordinate(tradeEndSec);
            let lineLength = 80;
            if (x0 != null && x1 != null && !isNaN(x0) && !isNaN(x1)) {
              lineLength = Math.max(20, Math.abs(x1 - x0));
            }
            let percentLeft = 1;
            if (typeof trade.remainingTime === "number" && durationSec > 0) {
              percentLeft = Math.max(
                0,
                Math.min(1, trade.remainingTime / durationSec)
              );
            }
            let visibleLength = lineLength * percentLeft;
            
            // For expired trades, show a short static line
            if (isExpired) {
              visibleLength = Math.min(40, lineLength * 0.3); // Show 30% of original length or 40px max
            }
            
            if (visibleLength <= 0) return;
            const color = trade.type === "Buy" ? "#10A055" : "#FF0000";
            
            // Fade out expired trades
            const opacity = isExpired ? 0.4 : 1;
            
            // Position line at the actual entry price of this trade (not with equal spacing)
            const tradePrice = trade.entryPrice ?? trade.coinPrice ?? trade.price;
            const yTrade = seriesRef.current.priceToCoordinate(Number(tradePrice));
            const lineTop = yTrade != null && !isNaN(yTrade)
              ? Math.max(
                  boxHeight / 2,
                  Math.min(yTrade, containerRect.height - boxHeight / 2)
                )
              : 40;
            
            // Position lines in front of the latest trade horizontally
            const lineLeft = leftLast + boxWidth / 2 + 16;
            
            // Clamp lineLeft and visibleLength to stay within chart container
            let clampedLineLeft = Math.max(
              0,
              Math.min(lineLeft, containerRect.width - 20)
            );
            let clampedVisibleLength = Math.max(
              0,
              Math.min(visibleLength, containerRect.width - clampedLineLeft - 8)
            );
            let clampedLineTop = Math.max(
              0,
              Math.min(lineTop, containerRect.height - 8)
            );
            rendered.push(
              <svg
                key={`afterline-${mappedTime}-${trade.id || trade._id || idx}`}
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  width: "100%",
                  height: "100%",
                  pointerEvents: "none",
                  zIndex: 20,
                }}
              >
                <circle
                  cx={clampedLineLeft}
                  cy={clampedLineTop}
                  r={4}
                  fill={color}
                  stroke="#fff"
                  strokeWidth={1.5}
                  opacity={opacity}
                />
                <line
                  x1={clampedLineLeft}
                  y1={clampedLineTop}
                  x2={clampedLineLeft + clampedVisibleLength}
                  y2={clampedLineTop}
                  stroke={color}
                  strokeWidth={4}
                  opacity={opacity}
                />
                <circle
                  cx={clampedLineLeft + clampedVisibleLength}
                  cy={clampedLineTop}
                  r={4}
                  fill={color}
                  stroke="#fff"
                  strokeWidth={1.5}
                  opacity={opacity}
                />
              </svg>
            );
          });
        }
      });
    return rendered;
  };

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
      {/* Tutorial Popup */}
      {showTutorial && currentTipIndex < tips.length && (
        <div
          className="tutorial-popup"
          style={{
            position: "absolute",
            top: 50,
            left: `${position.left + 50}px`,
            transform: "translateX(-50%)",
            zIndex: 1000,
            backgroundColor: "#2C2D35",
            color: "white",
            padding: "15px",
            borderRadius: "8px",
            boxShadow: "0 4px 8px rgba(0,0,0,0.3)",
            maxWidth: "300px",
            textAlign: "center",
            width: `${Math.max(position.buttonWidth, 200)}px`,
          }}
        >
          <div className="tutorial-content">
            <p>{tips[currentTipIndex].text}</p>
            <div
              className="tutorial-controls"
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: "15px",
              }}
            >
              {currentTipIndex > 0 && (
                <button
                  onClick={handlePrevTip}
                  style={{
                    background: "#64B243",
                    color: "white",
                    border: "none",
                    padding: "8px 15px",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  Previous
                </button>
              )}
              {currentTipIndex < tips.length - 1 ? (
                <button
                  onClick={handleNextTip}
                  style={{
                    background: "#64B243",
                    color: "white",
                    border: "none",
                    padding: "8px 15px",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={handleCloseTutorial}
                  style={{
                    background: "#64B243",
                    color: "white",
                    border: "none",
                    padding: "8px 15px",
                    borderRadius: "4px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <AiOutlineClose style={{ marginRight: "5px" }} />
                  Close Tutorial
                </button>
              )}
            </div>
          </div>
          <div
            className="tutorial-progress"
            style={{
              marginTop: "10px",
              fontSize: "0.8em",
              color: "#aaa",
            }}
          >
            {`${currentTipIndex + 1} of ${tips.length}`}
          </div>
        </div>
      )}

      <div className="liveChartBtns">
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            marginBottom: 10,
          }}
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
                  {coinName}
                  {"("}
                  {type}
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
          <div className="webCoinInfoT" style={{ position: "absolute" }}>
            <div className="coininfoBox">
              <p className="nameProfitWeb">
                {coinName}
                {"("}
                {type}
                {")"}
              </p>
              <p className="nameProfitWeb">
                &nbsp;&nbsp;
                {profit}
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
                    style={{
                      padding: "5px 10px",
                      cursor: "pointer",
                    }}
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
                      style={{
                        width: 30,
                        height: 30,
                        background: t.upColor,
                      }}
                    />
                    <div
                      style={{
                        width: 30,
                        height: 30,
                        background: t.downColor,
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Chart style selector */}
          <div
            style={{
              position: "relative",
            }}
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
                    style={{
                      padding: "5px 10px",
                      cursor: "pointer",
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

      {/* Chart container */}
      <div
        id="chart-container"
        ref={(el) => {
          containerRef.current = el;
          buttonRefs.current[5] = el;
        }}
        style={{
          width: "100%",
          height: "600px",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {renderTradeBoxesAndLines()}
      </div>
    </div>
  );
};

export default TradingViewChart;
