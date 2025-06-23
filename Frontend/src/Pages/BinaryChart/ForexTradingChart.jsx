import { RiArrowDropDownLine } from "react-icons/ri";
import React, { useEffect, useRef, useState } from "react";
import { createChart, CrosshairMode } from "lightweight-charts";
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
import CoinSelector from "./components/CoinSelector/CoinSelector";
import Trades from "./components/Trades/Trades";

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
    gridColor: "rgba(60,60,60,0.10)", // lighter, more transparent
    upColor: "#26a69a",
    downColor: "#ef5350",
    borderVisible: true,
    wickVisible: true,
  },
  DARK: {
    name: "Dark",
    background: "#121212",
    textColor: "#d1d4dc",
    gridColor: "rgba(200,200,200,0.08)", // lighter, more transparent
    upColor: "#00e676",
    downColor: "#ff1744",
    borderVisible: true,
    wickVisible: true,
  },
  BLUE: {
    name: "Blue",
    background: "#0e1a2f",
    textColor: "#ffffff",
    gridColor: "rgba(30,42,63,0.12)", // lighter, more transparent
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

// Supported intervals for Twelve Data API
const SUPPORTED_INTERVALS = [
  { label: "1m", value: "1min" },
  { label: "5m", value: "5min" },
  { label: "15m", value: "15min" },
  { label: "30m", value: "30min" },
  { label: "1h", value: "1h" },
  { label: "4h", value: "4h" },
  { label: "1d", value: "1day" },
];

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

// --- INTERVAL NORMALIZATION ---
const normalizeInterval = (interval) => {
  switch (interval) {
    case "1min":
      return "1m";
    case "5min":
      return "5m";
    case "15min":
      return "15m";
    case "30min":
      return "30m";
    case "1h":
      return "1h";
    case "4h":
      return "4h";
    case "1day":
      return "1d";
    default:
      return interval;
  }
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
  // Set default interval to 1min
  const [interval, setInterval] = useState("1min");
  const [candles, setCandles] = useState([]);
  const [currentPrice, setCurrentPrice] = useState(null);
  const [theme, setTheme] = useState(THEMES.LIGHT);
  const [candleStyle, setCandleStyle] = useState(CANDLE_STYLES.CANDLE);
  // Use single value for indicator and drawing tool
  const [activeIndicator, setActiveIndicator] = useState(null);
  const [activeDrawingTool, setActiveDrawingTool] = useState(null);
  const [showIndicatorPopup, setShowIndicatorPopup] = useState(false);
  const [showDrawingPopup, setShowDrawingPopup] = useState(false);
  const [showThemePopup, setShowThemePopup] = useState(false);
  const [showStylePopup, setShowStylePopup] = useState(false);
  const buttonRefs = useRef([]);

  // Drawing tool state for trend line
  const [trendLinePoints, setTrendLinePoints] = useState([]);
  const trendLineSeriesRef = useRef(null);

  // New refs for indicator chart
  const indicatorContainerRef = useRef();
  const indicatorChartRef = useRef(null);
  const indicatorSeriesRef = useRef([]);

  // Trade popup state
  const [tradePopup, setTradePopup] = useState(false);
  const [chartHeight, setChartHeight] = useState(600);

  // Fetch candle data from Twelve Data
  const fetchCandles = async () => {
    try {
      const apiKey = import.meta.env.VITE_API_KEY;
      let symbol = coinName.includes("/")
        ? coinName
        : coinName.replace(/(\w{3})(\w{3})/, "$1/$2");
      const url = `https://api.twelvedata.com/time_series?symbol=${symbol}&interval=${interval}&outputsize=5000&apikey=${apiKey}`;
      const response = await fetch(url);
      const data = await response.json();
      if (data && data.values) {
        // --- Floor candle time to nearest interval for all supported intervals ---
        const normalizedInterval = normalizeInterval(interval);
        const intervalSec = intervalToSeconds[normalizedInterval] || 60;
        const formattedCandles = data.values.reverse().map((candle) => {
          const origTime = Math.floor(
            new Date(candle.datetime).getTime() / 1000
          );
          // Floor to nearest interval
          const flooredTime = Math.floor(origTime / intervalSec) * intervalSec;
          return {
            time: flooredTime,
            open: parseFloat(candle.open),
            high: parseFloat(candle.high),
            low: parseFloat(candle.low),
            close: parseFloat(candle.close),
            volume: parseFloat(candle.volume),
          };
        });
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

  // Chart height update effect
  useEffect(() => {
    const updateChartHeight = () => {
      let chartHeight;
      const width = window.innerWidth;
      // Large desktops
      if (width > 1920) {
        chartHeight = 750;
      } else if (width > 1800) {
        chartHeight = 700;
      } else if (width > 1700) {
        chartHeight = 650;
      } else if (width > 1600) {
        chartHeight = 600;
      } else if (width > 1400) {
        chartHeight = 500;
      } else if (width > 1300) {
        chartHeight = 400;
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

  // Main chart setup (recreate chart on theme or interval change, like ForexChart.jsx)
  useEffect(() => {
    if (!containerRef.current) return;
    // Remove previous chart if it exists
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
      seriesRef.current = null;
    }
    const chart = createChart(containerRef.current, {
      layout: {
        background: { color: theme.background },
        textColor: theme.textColor,
      },
      grid: {
        vertLines: { color: theme.gridColor },
        horzLines: { color: theme.gridColor },
      },
      crosshair: { mode: CrosshairMode.Normal },
      width: containerRef.current.clientWidth,
      height: chartHeight, // Responsive height
      timeScale: {
        borderColor: theme.gridColor,
        timeVisible: true,
        secondsVisible: false,
        tickMarkFormatter: (time) => {
          const date = new Date(time * 1000);
          if (interval === "1day") {
            return `${date.getFullYear()}-${(date.getMonth() + 1)
              .toString()
              .padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;
          }
          return `${date.getHours().toString().padStart(2, "0")}:${date
            .getMinutes()
            .toString()
            .padStart(2, "0")}`;
        },
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
    // Set initial data
    if (candles.length > 0) {
      seriesRef.current.setData(candles);
    }
    return () => {
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, [theme, interval, chartHeight]);

  // Update chart data when candles change
  useEffect(() => {
    if (seriesRef.current) {
      seriesRef.current.setData(candles);
    }
  }, [candles]);

  // Indicator chart setup (for RSI/MACD)
  useEffect(() => {
    // Only run if indicator panel is needed and container is mounted
    if (!indicatorContainerRef.current) return;
    // Only create chart if it doesn't exist and indicator is RSI or MACD
    if (
      !indicatorChartRef.current &&
      (activeIndicator === INDICATORS.RSI ||
        activeIndicator === INDICATORS.MACD)
    ) {
      const chart = createChart(indicatorContainerRef.current, {
        layout: {
          background: { color: theme.background },
          textColor: theme.textColor,
        },
        grid: {
          vertLines: { color: theme.gridColor },
          horzLines: { color: theme.gridColor },
        },
        width: indicatorContainerRef.current.clientWidth,
        height: 100,
        timeScale: {
          borderColor: theme.gridColor,
        },
      });
      indicatorChartRef.current = chart;
    }
    // Clean up on unmount or when indicator type changes away from RSI/MACD
    return () => {
      if (
        indicatorChartRef.current &&
        !(
          activeIndicator === INDICATORS.RSI ||
          activeIndicator === INDICATORS.MACD
        )
      ) {
        indicatorChartRef.current.remove();
        indicatorChartRef.current = null;
      }
    };
  }, [activeIndicator, theme]);

  useEffect(() => {
    fetchCandles();
  }, [coinName, interval]);

  // Add indicator
  const selectIndicator = (ind) => {
    setActiveIndicator(ind);
  };
  // Add drawing tool
  const selectDrawingTool = (tool) => {
    setActiveDrawingTool(tool);
  };

  // Drawing tool mouse logic
  useEffect(() => {
    if (!containerRef.current || activeDrawingTool !== DRAWING_TOOLS.TREND_LINE)
      return;
    const handleClick = (e) => {
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      // Convert x to time
      const timeScale = chartRef.current.timeScale();
      const logical = chartRef.current.coordinateToLogical(x);
      const time = timeScale.coordinateToTime(x);
      // Convert y to price
      const priceScale = seriesRef.current.priceScale();
      const price = priceScale.coordinateToPrice(y);
      if (trendLinePoints.length === 0) {
        setTrendLinePoints([{ time, price }]);
      } else if (trendLinePoints.length === 1) {
        setTrendLinePoints((prev) => [...prev, { time, price }]);
      }
    };
    containerRef.current.addEventListener("click", handleClick);
    return () => containerRef.current.removeEventListener("click", handleClick);
  }, [activeDrawingTool, trendLinePoints]);

  // Render trend line
  useEffect(() => {
    if (!chartRef.current) return;
    if (trendLineSeriesRef.current) {
      chartRef.current.removeSeries(trendLineSeriesRef.current);
      trendLineSeriesRef.current = null;
    }
    if (trendLinePoints.length === 2) {
      trendLineSeriesRef.current = chartRef.current.addLineSeries({
        color: "red",
        lineWidth: 2,
      });
      trendLineSeriesRef.current.setData(trendLinePoints);
    }
    if (
      (trendLinePoints.length > 2 ||
        activeDrawingTool !== DRAWING_TOOLS.TREND_LINE) &&
      trendLinePoints.length > 0
    ) {
      setTrendLinePoints([]);
      if (trendLineSeriesRef.current) {
        chartRef.current.removeSeries(trendLineSeriesRef.current);
        trendLineSeriesRef.current = null;
      }
    }
  }, [trendLinePoints, activeDrawingTool]);

  // Indicator calculation utilities from LiveCandleChart
  const calculateSMA = (data, period) => {
    if (!data || data.length < period) return [];
    const sma = [];
    for (let i = period - 1; i < data.length; i++) {
      const sum = data
        .slice(i - period + 1, i + 1)
        .reduce((acc, val) => acc + val.close, 0);
      sma.push({ time: data[i].time, value: sum / period });
    }
    return sma;
  };
  const calculateEMA = (data, period) => {
    if (!data || data.length < period) return [];
    const ema = [];
    const k = 2 / (period + 1);
    let emaPrev =
      data.slice(0, period).reduce((acc, val) => acc + val.close, 0) / period;
    ema.push({ time: data[period - 1].time, value: emaPrev });
    for (let i = period; i < data.length; i++) {
      emaPrev = data[i].close * k + emaPrev * (1 - k);
      ema.push({ time: data[i].time, value: emaPrev });
    }
    return ema;
  };
  const calculateRSI = (data, period = 14) => {
    if (!data || data.length <= period) return [];
    const rsi = [];
    let gains = 0;
    let losses = 0;
    for (let i = 1; i <= period; i++) {
      const change = data[i].close - data[i - 1].close;
      if (change > 0) gains += change;
      else losses -= change;
    }
    let avgGain = gains / period;
    let avgLoss = losses / period;
    const rs = avgLoss !== 0 ? avgGain / avgLoss : 0;
    rsi.push({ time: data[period].time, value: 100 - 100 / (1 + rs) });
    for (let i = period + 1; i < data.length; i++) {
      const change = data[i].close - data[i - 1].close;
      let currentGain = 0;
      let currentLoss = 0;
      if (change > 0) currentGain = change;
      else currentLoss = -change;
      avgGain = (avgGain * (period - 1) + currentGain) / period;
      avgLoss = (avgLoss * (period - 1) + currentLoss) / period;
      const rs = avgLoss !== 0 ? avgGain / avgLoss : 0;
      rsi.push({ time: data[i].time, value: 100 - 100 / (1 + rs) });
    }
    return rsi;
  };
  const calculateMACD = (
    data,
    fastPeriod = 12,
    slowPeriod = 26,
    signalPeriod = 9
  ) => {
    if (!data || data.length < slowPeriod + signalPeriod)
      return { macd: [], signal: [] };
    const emaFast = calculateEMA(data, fastPeriod);
    const emaSlow = calculateEMA(data, slowPeriod);
    const macdLine = [];
    for (let i = slowPeriod - fastPeriod; i < emaSlow.length; i++) {
      macdLine.push({
        time: emaSlow[i].time,
        value: emaFast[i + (slowPeriod - fastPeriod)].value - emaSlow[i].value,
      });
    }
    const signalLine = calculateEMA(
      macdLine.map((d) => ({ close: d.value, time: d.time })),
      signalPeriod
    );
    return {
      macd: macdLine.slice(signalPeriod - 1),
      signal: signalLine,
    };
  };
  const calculateBollingerBands = (data, period = 20, multiplier = 2) => {
    if (!data || data.length < period)
      return { upper: [], middle: [], lower: [] };
    const sma = calculateSMA(data, period);
    const bands = { upper: [], middle: sma, lower: [] };
    for (let i = period - 1; i < data.length; i++) {
      const slice = data.slice(i - period + 1, i + 1);
      const sum = slice.reduce(
        (acc, val) => acc + Math.pow(val.close - sma[i - period + 1].value, 2),
        0
      );
      const stdDev = Math.sqrt(sum / period);
      bands.upper.push({
        time: data[i].time,
        value: sma[i - period + 1].value + multiplier * stdDev,
      });
      bands.lower.push({
        time: data[i].time,
        value: sma[i - period + 1].value - multiplier * stdDev,
      });
    }
    return bands;
  };

  // Helper to filter and warn about bad data
  function filterValidData(arr) {
    const filtered = (arr || []).filter(
      (d) =>
        d && d.time !== undefined && d.value !== undefined && !isNaN(d.value)
    );
    if (filtered.length !== (arr || []).length) {
      console.warn((arr || []).length - filtered.length);
    }
    return filtered;
  }

  // Render indicator in the chart (fix RSI/MACD overlay)
  useEffect(() => {
    if (!chartRef.current || !seriesRef.current || candles.length === 0) return;
    // Remove overlays from main chart
    if (chartRef.current._indicatorSeries) {
      chartRef.current._indicatorSeries.forEach((s) =>
        chartRef.current.removeSeries(s)
      );
    }
    chartRef.current._indicatorSeries = [];
    // Remove indicator chart series
    if (indicatorChartRef.current && indicatorSeriesRef.current.length) {
      indicatorSeriesRef.current.forEach((s) =>
        indicatorChartRef.current.removeSeries(s)
      );
      indicatorSeriesRef.current = [];
    }
    // Overlays on main chart
    if (activeIndicator === INDICATORS.SMA) {
      const sma = filterValidData(calculateSMA(candles, 20));
      const smaSeries = chartRef.current.addLineSeries({ color: "orange" });
      smaSeries.setData(sma);
      chartRef.current._indicatorSeries.push(smaSeries);
    } else if (activeIndicator === INDICATORS.EMA) {
      const ema = filterValidData(calculateEMA(candles, 20));
      const emaSeries = chartRef.current.addLineSeries({ color: "blue" });
      emaSeries.setData(ema);
      chartRef.current._indicatorSeries.push(emaSeries);
    } else if (activeIndicator === INDICATORS.BB) {
      const bb = calculateBollingerBands(candles, 20, 2);
      const upperSeries = chartRef.current.addLineSeries({ color: "gray" });
      upperSeries.setData(filterValidData(bb.upper));
      chartRef.current._indicatorSeries.push(upperSeries);
      const lowerSeries = chartRef.current.addLineSeries({ color: "gray" });
      lowerSeries.setData(filterValidData(bb.lower));
      chartRef.current._indicatorSeries.push(lowerSeries);
    }
    // RSI/MACD in indicator chart
    if (indicatorChartRef.current) {
      if (activeIndicator === INDICATORS.RSI) {
        const rsi = filterValidData(calculateRSI(candles, 14));
        const rsiSeries = indicatorChartRef.current.addLineSeries({
          color: "purple",
        });
        rsiSeries.setData(rsi);
        indicatorSeriesRef.current = [rsiSeries];
      } else if (activeIndicator === INDICATORS.MACD) {
        const { macd, signal } = calculateMACD(candles, 12, 26, 9);
        const macdSeries = indicatorChartRef.current.addLineSeries({
          color: "green",
        });
        macdSeries.setData(filterValidData(macd));
        const signalSeries = indicatorChartRef.current.addLineSeries({
          color: "red",
        });
        signalSeries.setData(filterValidData(signal));
        indicatorSeriesRef.current = [macdSeries, signalSeries];
      }
    }
  }, [activeIndicator, candles]);

  // --- TRADE BOXES DYNAMIC SIZE AND POSITION ---
  const [tradeBoxSize, setTradeBoxSize] = useState({
    width: 44,
    height: 16,
    font: 9,
  });
  useEffect(() => {
    if (!chartRef.current) return;
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
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => {
      window.removeEventListener("resize", updateSize);
    };
  }, [interval]);

  // --- TRADE BOXES AND LINES RENDERING ---
  const renderTradeBoxesAndLines = () => {
    if (!chartRef.current || !seriesRef.current || !containerRef.current)
      return null;
    // Group trades by interval bucket (like TradingViewChart)
    const normalizedInterval = normalizeInterval(interval);
    const intervalSec = intervalToSeconds[normalizedInterval] || 60;
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
    (trades || [])
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
        let mappedTime = Math.floor(tradeTimestamp / intervalSec) * intervalSec;
        if (!chartTimes.includes(mappedTime) && chartTimes.length > 0) {
          mappedTime = chartTimes.reduce((prev, curr) =>
            Math.abs(curr - mappedTime) < Math.abs(prev - mappedTime)
              ? curr
              : prev
          );
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
              {/* Close button for finished trades */}
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
            if (
              typeof trade.remainingTime === "number" &&
              trade.remainingTime <= 0
            )
              return;
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
            if (visibleLength <= 0) return;
            const color = trade.type === "Buy" ? "#10A055" : "#FF0000";
            // Clamp lineLeft and visibleLength to stay within chart container
            let clampedLineLeft = Math.max(
              0,
              Math.min(leftLast + boxWidth / 2 + 16, containerRect.width - 20)
            );
            let clampedVisibleLength = Math.max(
              0,
              Math.min(visibleLength, containerRect.width - clampedLineLeft - 8)
            );
            let clampedLineTop = Math.max(
              0,
              Math.min(topLast + idx * 16 + 10, containerRect.height - 8)
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
                />
                <line
                  x1={clampedLineLeft}
                  y1={clampedLineTop}
                  x2={clampedLineLeft + clampedVisibleLength}
                  y2={clampedLineTop}
                  stroke={color}
                  strokeWidth={4}
                />
                <circle
                  cx={clampedLineLeft + clampedVisibleLength}
                  cy={clampedLineTop}
                  r={4}
                  fill={color}
                  stroke="#fff"
                  strokeWidth={1.5}
                />
              </svg>
            );
          });
        }
      });
    return <>{rendered}</>;
  };

  // --- Popup close on outside click ---
  useEffect(() => {
    if (
      !showIndicatorPopup &&
      !showDrawingPopup &&
      !showThemePopup &&
      !showStylePopup
    )
      return;
    function handlePopupClickOutside(event) {
      // Check for all popup refs (none are using refs, so check by class or id)
      // We'll use the button refs and the popups' parent containers
      const popups = [
        document.getElementById("indicator-btn"),
        document.getElementById("drawing-btn"),
        document.getElementById("theme-btn"),
        document.getElementById("style-btn"),
      ];
      let clickedInside = false;
      for (const el of popups) {
        if (el && el.contains(event.target)) {
          clickedInside = true;
          break;
        }
      }
      // Also check if the popup itself was clicked
      const popupDivs = document.querySelectorAll(".popup-green-border");
      for (const div of popupDivs) {
        if (div.contains(event.target)) {
          clickedInside = true;
          break;
        }
      }
      if (!clickedInside) {
        setShowIndicatorPopup(false);
        setShowDrawingPopup(false);
        setShowThemePopup(false);
        setShowStylePopup(false);
      }
    }
    document.addEventListener("mousedown", handlePopupClickOutside);
    return () =>
      document.removeEventListener("mousedown", handlePopupClickOutside);
  }, [showIndicatorPopup, showDrawingPopup, showThemePopup, showStylePopup]);

  // --- Coin selector close on outside click ---
  useEffect(() => {
    if (!showCoinSelector) return;
    function handleCoinSelectorClickOutside(event) {
      // Check if click is inside the coin selector popup or its button
      const popup = coinSelectorRef.current;
      const button = buttonRefs.current[0];
      if (
        (popup && popup.contains(event.target)) ||
        (button && button.contains(event.target))
      ) {
        return;
      }
      setShowCoinSelector(false);
    }
    document.addEventListener("mousedown", handleCoinSelectorClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleCoinSelectorClickOutside);
  }, [showCoinSelector]);

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
                  width: "100%",
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
                {coins.find((c) => c.name === coinName)?.firstName}/
                {coins.find((c) => c.name === coinName)?.lastName}({type})
              </p>
              <p className="nameProfitWeb">
                &nbsp;&nbsp;{profit}
                {"% "}
              </p>
            </div>
          </div>
          {/* Indicator selector */}
          <div
            style={{ position: "relative" }}
            ref={(el) => (buttonRefs.current[5] = el)}
          >
            <button
              id="indicator-btn"
              className="chartBtns"
              onClick={() => {
                setShowIndicatorPopup(!showIndicatorPopup);
                setShowDrawingPopup(false);
                setShowThemePopup(false);
                setShowStylePopup(false);
              }}
              style={{
                color: "black",
                cursor: "pointer",
                height: 50,
                fontSize: "1.5rem",
                background: "#E0E0E0",
              }}
            >
              {/* You can use a beaker or similar icon for indicator, or fallback to text */}
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
                  background: "#E0E0E0",
                  border: "2px solid #10A055",
                  borderRadius: 4,
                  padding: 10,
                  display: "flex",
                  flexDirection: "column",
                  gap: 5,
                }}
              >
                {Object.values(INDICATORS).map((indicator) => (
                  <div
                    key={indicator}
                    onClick={() => {
                      setActiveIndicator(
                        indicator === INDICATORS.NONE ? null : indicator
                      );
                      setShowIndicatorPopup(false);
                    }}
                    style={{
                      padding: "5px 10px",
                      color: theme.textColor,
                      cursor: "pointer",
                      fontWeight: activeIndicator === indicator ? 700 : 400,
                      background:
                        activeIndicator === indicator
                          ? "#e6f7ee"
                          : "transparent",
                      borderRadius: 4,
                    }}
                  >
                    {indicator} {activeIndicator === indicator ? "✓" : ""}
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* Drawing tool selector */}
          <div
            style={{ position: "relative" }}
            ref={(el) => (buttonRefs.current[1] = el)}
          >
            <button
              id="drawing-btn"
              className="chartBtns"
              onClick={() => {
                setShowDrawingPopup(!showDrawingPopup);
                setShowIndicatorPopup(false);
                setShowThemePopup(false);
                setShowStylePopup(false);
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
                className="popup-green-border"
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  zIndex: 100,
                  background: "#E0E0E0",
                  border: "2px solid #10A055",
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
                      if (activeDrawingTool === tool) {
                        selectDrawingTool(null);
                      } else {
                        selectDrawingTool(tool);
                      }
                    }}
                    style={{
                      padding: "5px 10px",
                      color: theme.textColor,
                      cursor: "pointer",
                    }}
                  >
                    {tool} {activeDrawingTool === tool ? "✓" : ""}
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
              {SUPPORTED_INTERVALS.map((i) => (
                <option key={i.value} value={i.value}>
                  {i.label}
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
                className="popup-green-border"
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  zIndex: 100,
                  background: "#E0E0E0",
                  border: "2px solid #10A055",
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
                className="popup-green-border"
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  zIndex: 100,
                  background: "#E0E0E0",
                  border: "2px solid #10A055",
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
      <div
        id="chart-container"
        ref={(el) => {
          containerRef.current = el;
          // If you use buttonRefs, add: buttonRefs.current[5] = el;
        }}
        style={{
          width: "100%",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {renderTradeBoxesAndLines()}
      </div>
      {(activeIndicator === INDICATORS.RSI ||
        activeIndicator === INDICATORS.MACD) && (
        <div
          ref={indicatorContainerRef}
          style={{ width: "100%", height: 200, marginTop: 10 }}
        />
      )}
      {window.innerWidth < 768 && (
        <button
          className="show-trades-btn"
          style={{
            marginRight: 8,
            background: "#10A055",
            color: "#fff",
            border: "none",
            width: "100px",
            borderRadius: "6px",
            padding: "8px 16px",
            fontWeight: 600,
            fontSize: "1rem",
            cursor: "pointer",
            top: "102px",
            left: 0,
            zIndex: 2,
            position: "absolute",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          }}
          onClick={() => setTradePopup(true)}
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
            zIndex: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={() => setTradePopup(false)}
        >
          <div
            style={{
              background: "#fff",
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
              // Add other props as needed
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ForexTradingChart;
