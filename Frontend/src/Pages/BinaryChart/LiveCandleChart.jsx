// Import required libraries and icons
import { AiOutlinePlus } from "react-icons/ai";
import { AiOutlineBgColors } from "react-icons/ai";
import { BsBarChartFill } from "react-icons/bs";
import { AiOutlinePlusSquare } from "react-icons/ai";
import { BiLineChart, BiPencil } from "react-icons/bi";
import { FiMaximize2, FiMinimize2 } from "react-icons/fi";
import React, { useEffect, useRef, useState } from "react";
import "./LiveCandleChart.css";
import axios from "axios";
import { createChart, CrosshairMode } from "lightweight-charts";
import { io } from "socket.io-client";
import Tabs from "./components/Tabs/Tabs";
import CoinSelector from "./components/CoinSelector/CoinSelector";
import { RiArrowDropDownLine } from "react-icons/ri";
import { AiOutlineClose } from "react-icons/ai"; // Add close icon
import Trades from "./components/Trades/Trades";
const socket = io(import.meta.env.VITE_BACKEND_URL, {
  withCredentials: true,
  transports: ["websocket"], // 👈 force WebSocket only
});

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL; // Adjust this if needed
const intervalToSeconds = {
  "30s": 30,
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
const CANDLE_STYLES = {
  CANDLE: "Candlestick",
  BAR: "Bar",
  LINE: "Line",
  HOLLOW: "Hollow Candle",
};
const INDICATORS = {
  NONE: "None",
  SMA: "SMA (20)",
  EMA: "EMA (20)",
  RSI: "RSI (14)",
  MACD: "MACD",
  BB: "Bollinger Bands",
};
const THEMES = {
  LIGHT: {
    name: "Light",
    background: "rgb(255,255,255)",
    textColor: "rgb(51,51,51)",
    gridColor: "rgba(60,60,60,0.10)", // lighter, more transparent
    upColor: "rgb(38,166,154)",
    downColor: "rgb(239,83,80)",
    borderVisible: true,
    wickVisible: true,
    wickUpColor: "rgb(0,153,0)",
    wickDownColor: "rgb(204,0,0)",
    wickWidth: 4,
  },
  DARK: {
    name: "Dark",
    background: "rgb(18,18,18)",
    textColor: "rgb(209,212,220)",
    gridColor: "rgba(200,200,200,0.08)", // lighter, more transparent
    upColor: "rgb(0,230,118)",
    downColor: "rgb(255,23,68)",
    borderVisible: true,
    wickVisible: true,
    wickUpColor: "rgb(0,255,0)",
    wickDownColor: "rgb(255,34,34)",
    wickWidth: 4,
  },
  BLUE: {
    name: "Blue",
    background: "rgb(14,26,47)",
    textColor: "rgb(255,255,255)",
    gridColor: "rgba(30,42,63,0.12)", // lighter, more transparent
    upColor: "rgb(76,175,80)",
    downColor: "rgb(244,67,54)",
    borderVisible: true,
    wickVisible: true,
    wickUpColor: "rgb(0,255,0)",
    wickDownColor: "rgb(255,34,34)",
    wickWidth: 4,
  },
};
const DRAWING_TOOLS = {
  NONE: "None",
  HORIZONTAL_LINE: "Horizontal Line",
  VERTICAL_LINE: "Vertical Line",
  TREND_LINE: "Trend Line",
};
const groupCandles = (candles, interval) => {
  const intervalSec = intervalToSeconds[interval];
  const grouped = [];
  const sorted = [...candles]
    .filter((c) => c?.time && c?.open != null)
    .sort((a, b) => {
      const aTime =
        typeof a.time === "string"
          ? Math.floor(Date.parse(a.time) / 1000)
          : Number(a.time);
      const bTime =
        typeof b.time === "string"
          ? Math.floor(Date.parse(b.time) / 1000)
          : Number(b.time);
      return aTime - bTime;
    });
  for (const c of sorted) {
    let ts;
    if (typeof c.time === "string") {
      ts = Math.floor(Date.parse(c.time) / 1000);
    } else {
      ts = Number(c.time);
    }
    if (isNaN(ts)) continue;
    const bucket = Math.floor(ts / intervalSec) * intervalSec;
    const last = grouped[grouped.length - 1];
    if (last && last.time === bucket) {
      last.high = Math.max(last.high, c.high);
      last.low = Math.min(last.low, c.low);
      last.close = c.close;
      last.volume = (last.volume || 0) + (c.volume || 0);
    } else {
      grouped.push({
        time: Number(bucket),
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
        volume: c.volume || 0,
      });
    }
  }
  return grouped;
};
const calculateSMA = (data, period) => {
  if (!data || data.length < period) return [];
  const sma = [];
  for (let i = period - 1; i < data.length; i++) {
    const sum = data
      .slice(i - period + 1, i + 1)
      .reduce((acc, val) => acc + val.close, 0);
    sma.push({
      time: data[i].time,
      value: sum / period,
    });
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
    if (change > 0) {
      gains += change;
    } else {
      losses -= change;
    }
  }
  let avgGain = gains / period;
  let avgLoss = losses / period;
  const rs = avgLoss !== 0 ? avgGain / avgLoss : 0;
  rsi.push({ time: data[period].time, value: 100 - 100 / (1 + rs) });
  for (let i = period + 1; i < data.length; i++) {
    const change = data[i].close - data[i - 1].close;
    let currentGain = 0;
    let currentLoss = 0;
    if (change > 0) {
      currentGain = change;
    } else {
      currentLoss = -change;
    }
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
const LiveCandleChart = ({
  coinName,
  setSelectedCoin,
  coins,
  profit,
  type,
  trades,
  handleCloseTrade,
}) => {
  const chartContainerRef = useRef();
  const chartRef = useRef(null);
  const seriesRef = useRef(null);
  const coinSelectorRef = useRef();
  const [countdown, setCountdown] = useState(0);
  const [interval, setInterval] = useState("1m");
  const [candles, setCandles] = useState([]);
  const [currentPrice, setCurrentPrice] = useState(null);
  const [liveCandle, setLiveCandle] = useState(null);
  const [renderKey, setRenderKey] = useState(0);
  const trendRef = useRef("Random");
  const trendCounterRef = useRef(0);
  const [theme, setTheme] = useState(THEMES.LIGHT);
  const [candleStyle, setCandleStyle] = useState(CANDLE_STYLES.CANDLE);
  const [indicator, setIndicator] = useState(INDICATORS.NONE);
  const [drawingTool, setDrawingTool] = useState(DRAWING_TOOLS.NONE);
  const [showThemePopup, setShowThemePopup] = useState(false);
  const [showStylePopup, setShowStylePopup] = useState(false);
  const [showIndicatorPopup, setShowIndicatorPopup] = useState(false);
  const [showDrawingPopup, setShowDrawingPopup] = useState(false);
  const [showCoinSelector, setShowCoinSelector] = useState(false);
  const smaSeriesRef = useRef(null);
  const emaSeriesRef = useRef(null);
  const rsiSeriesRef = useRef(null);
  const rsiPaneRef = useRef(null);
  const macdSeriesRef = useRef(null);
  const macdSignalSeriesRef = useRef(null);
  const macdPaneRef = useRef(null);
  const bbUpperSeriesRef = useRef(null);
  const bbMiddleSeriesRef = useRef(null);
  const bbLowerSeriesRef = useRef(null);
  const countdownRef = useRef();
  const activeDrawingToolRef = useRef(null);
  const drawingStartPointRef = useRef(null);
  const drawingsRef = useRef([]);
  const [autoZoom, setAutoZoom] = useState(true);
  const [firstLoad, setFirstLoad] = useState(true);
  const [tradePopup, setTradePopup] = useState(false);

  countdownRef.current = countdown;
  const lastCandleRef = useRef(null);
  const lastUpdateRef = useRef(0);
  const updateCountdown = () => {
    const intervalSec = intervalToSeconds[interval];
    const now = Math.floor(Date.now() / 1000);
    const currentBucket = Math.floor(now / intervalSec) * intervalSec;
    const nextCandle = currentBucket + intervalSec;
    const remaining = nextCandle - now;
    if (Math.abs(countdownRef.current - remaining) > 0.5) {
      setCountdown(remaining);
    }
  };
  useEffect(() => {
    let animationFrameId;
    const tick = () => {
      updateCountdown();
      animationFrameId = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(animationFrameId);
  }, [interval]);
  const updateCountdownPosition = () => {
    if (!chartRef.current || !liveCandle || !seriesRef.current) return;

    const chart = chartRef.current;
    const timeScale = chart.timeScale();
    const x = timeScale.timeToCoordinate(liveCandle.time);
    const y = seriesRef.current.priceToCoordinate(liveCandle.close);
    const label = document.getElementById("candle-countdown");
    if (!label || x == null || y == null) return;
    const containerRect = chartContainerRef.current.getBoundingClientRect();
    const labelWidth = label.offsetWidth;
    const labelHeight = label.offsetHeight;
    const constrainedX = Math.max(
      labelWidth / 2,
      Math.min(x, containerRect.width - labelWidth / 2)
    );
    const constrainedY = Math.max(
      labelHeight / 2,
      Math.min(y, containerRect.height - labelHeight / 2)
    );

    label.style.left = `${constrainedX}px`;
    label.style.top = `${constrainedY}px`;
    const width = timeScale.width();
    const range = timeScale.getVisibleLogicalRange();
    if (range) {
      const barWidth = width / (range.to - range.from) - 250;
      label.style.fontSize = `${Math.max(
        10,
        Math.min(16, barWidth * 0.1) + 30
      )}px`;
      label.style.padding = `${Math.max(2, barWidth * 0.05)}px ${Math.max(
        4,
        barWidth * 0.2
      )}px`;
    }
  };
  useEffect(() => {
    let raf;
    const animate = () => {
      updateCountdownPosition();
      raf = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(raf);
  }, [liveCandle, interval]);
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
        timeVisible: true,
        secondsVisible: true,
        tickMarkFormatter: (time) => {
          const date = new Date(time * 1000);
          return `${date.getHours()}:${date
            .getMinutes()
            .toString()
            .padStart(2, "0")}`;
        },
      },
      rightPriceScale: {
        borderColor: theme.gridColor,
      },
    });
    if (seriesRef.current) {
      seriesRef.current.applyOptions({
        upColor: theme.upColor,
        downColor: theme.downColor,
        borderVisible: theme.borderVisible,
        wickVisible: theme.wickVisible,
        wickUpColor: theme.wickUpColor,
        wickDownColor: theme.wickDownColor,
        wickWidth: theme.wickWidth,
      });
    }
  };
  const applyCandleStyle = () => {
    if (!chartRef.current) return;

    if (seriesRef.current) {
      chartRef.current.removeSeries(seriesRef.current);
    }
    switch (candleStyle) {
      case CANDLE_STYLES.CANDLE:
        seriesRef.current = chartRef.current.addCandlestickSeries({
          upColor: theme.upColor,
          downColor: theme.downColor,
          borderUpColor: theme.upColor,
          borderDownColor: theme.downColor,
          wickUpColor: theme.wickUpColor,
          wickDownColor: theme.wickDownColor,
          wickWidth: theme.wickWidth,
        });
        break;
      case CANDLE_STYLES.BAR:
        seriesRef.current = chartRef.current.addBarSeries({
          upColor: theme.upColor,
          downColor: theme.downColor,
        });
        break;
      case CANDLE_STYLES.LINE:
        seriesRef.current = chartRef.current.addLineSeries({
          color: theme.upColor,
          lineWidth: 2,
        });
        break;
      case CANDLE_STYLES.HOLLOW:
        seriesRef.current = chartRef.current.addCandlestickSeries({
          upColor: "transparent",
          downColor: "transparent",
          borderUpColor: theme.upColor,
          borderDownColor: theme.downColor,
          wickUpColor: theme.wickUpColor,
          wickDownColor: theme.wickDownColor,
          wickWidth: theme.wickWidth,
        });
        break;
      default:
        seriesRef.current = chartRef.current.addCandlestickSeries({
          upColor: theme.upColor,
          downColor: theme.downColor,
          borderUpColor: theme.upColor,
          borderDownColor: theme.downColor,
          wickUpColor: theme.wickUpColor,
          wickDownColor: theme.wickDownColor,
          wickWidth: theme.wickWidth,
        });
    }
    const data = groupCandles(candles, interval);
    if (candleStyle === CANDLE_STYLES.LINE) {
      const lineData = data.map((candle) => ({
        time: candle.time,
        value: candle.close,
      }));
      seriesRef.current.setData(lineData);
    } else {
      seriesRef.current.setData(data);
    }
    applyIndicators();
  };
  const applyIndicators = () => {
    const cleanupIndicator = (ref) => {
      if (ref.current) {
        try {
          chartRef.current?.removeSeries(ref.current);
          ref.current = null;
        } catch (e) {
          console.error("Error removing indicator:", e);
        }
      }
    };
    cleanupIndicator(smaSeriesRef);
    cleanupIndicator(emaSeriesRef);
    cleanupIndicator(rsiSeriesRef);
    cleanupIndicator(macdSeriesRef);
    cleanupIndicator(macdSignalSeriesRef);
    cleanupIndicator(bbUpperSeriesRef);
    cleanupIndicator(bbMiddleSeriesRef);
    cleanupIndicator(bbLowerSeriesRef);
    if (rsiPaneRef.current) {
      chartRef.current?.removePane(rsiPaneRef.current);
      rsiPaneRef.current = null;
    }
    if (macdPaneRef.current) {
      chartRef.current?.removePane(macdPaneRef.current);
      macdPaneRef.current = null;
    }
    if (indicator === INDICATORS.NONE) return;
    const data = groupCandles(candles, interval);
    try {
      switch (indicator) {
        case INDICATORS.SMA:
          {
            const smaData = calculateSMA(data, 20);
            smaSeriesRef.current = chartRef.current.addLineSeries({
              color: "#2962FF",
              lineWidth: 2,
            });
            smaSeriesRef.current.setData(smaData);
          }
          break;
        case INDICATORS.EMA:
          {
            const emaData = calculateEMA(data, 20);
            emaSeriesRef.current = chartRef.current.addLineSeries({
              color: "#FF6D00",
              lineWidth: 2,
            });
            emaSeriesRef.current.setData(emaData);
          }
          break;
        case INDICATORS.RSI:
          {
            const rsiData = calculateRSI(data);
            rsiSeriesRef.current = chartRef.current.addLineSeries({
              color: "#8A2BE2",
              lineWidth: 2,
              priceScaleId: "rsi-scale",
            });
            chartRef.current.priceScale("rsi-scale").applyOptions({
              scaleMargins: {
                top: 0.1,
                bottom: 0,
              },
              position: "right",
            });
            rsiSeriesRef.current.setData(rsiData);
          }
          break;
        case INDICATORS.MACD:
          {
            const macdData = calculateMACD(data);
            macdSeriesRef.current = chartRef.current.addLineSeries({
              color: "#2962FF",
              lineWidth: 2,
              priceScaleId: "macd",
            });
            macdSignalSeriesRef.current = chartRef.current.addLineSeries({
              color: "#FF6D00",
              lineWidth: 2,
              priceScaleId: "macd",
            });
            chartRef.current.priceScale("macd").applyOptions({
              scaleMargins: {
                top: 0.1,
                bottom: 0.1,
              },
              position: "right",
            });
            macdSeriesRef.current.setData(macdData.macd);
            macdSignalSeriesRef.current.setData(macdData.signal);
          }
          break;
        case INDICATORS.BB:
          {
            const bbData = calculateBollingerBands(data);
            bbUpperSeriesRef.current = chartRef.current.addLineSeries({
              color: "#2962FF",
              lineWidth: 1,
            });
            bbMiddleSeriesRef.current = chartRef.current.addLineSeries({
              color: "#FF6D00",
              lineWidth: 1,
            });
            bbLowerSeriesRef.current = chartRef.current.addLineSeries({
              color: "#2962FF",
              lineWidth: 1,
            });
            bbUpperSeriesRef.current.setData(bbData.upper);
            bbMiddleSeriesRef.current.setData(bbData.middle);
            bbLowerSeriesRef.current.setData(bbData.lower);
          }
          break;
      }
    } catch (e) {
      console.error("Error applying indicator:", e);
    }
  };
  const handleDrawingToolClick = (tool) => {
    setDrawingTool(tool);
    setShowDrawingPopup(false);
    activeDrawingToolRef.current = tool;
    drawingStartPointRef.current = null;
  };
  const handleChartClick = (param) => {
    if (!activeDrawingToolRef.current || !chartRef.current || !param.point)
      return;
    const point = param.point;
    const price = seriesRef.current.coordinateToPrice(point.y);
    const time = chartRef.current.timeScale().coordinateToTime(point.x);
    if (!drawingStartPointRef.current) {
      drawingStartPointRef.current = { time, price, x: point.x, y: point.y };
    } else {
      const start = drawingStartPointRef.current;
      let drawing;
      switch (activeDrawingToolRef.current) {
        case DRAWING_TOOLS.HORIZONTAL_LINE:
          drawing = seriesRef.current.createPriceLine({
            price: price,
            color: "#FF0000",
            lineWidth: 2,
            lineStyle: 2,
            axisLabelVisible: true,
          });
          break;
        case DRAWING_TOOLS.VERTICAL_LINE:
          drawing = chartRef.current.addTimeLine({
            time: time,
            color: "#FF0000",
            lineWidth: 2,
            lineStyle: 2,
          });
          break;
        case DRAWING_TOOLS.TREND_LINE:
          drawing = chartRef.current.addTrendLine({
            point1: { time: start.time, price: start.price },
            point2: { time, price },
            color: "#FF0000",
            lineWidth: 2,
            lineStyle: 2,
            axisLabelVisible: true,
          });
          break;
      }
      if (drawing) {
        drawingsRef.current.push(drawing);
      }
      drawingStartPointRef.current = null;
      activeDrawingToolRef.current = null;
      setDrawingTool(DRAWING_TOOLS.NONE);
    }
  };
  const clearAllDrawings = () => {
    drawingsRef.current.forEach((drawing) => {
      if (drawing.remove) drawing.remove();
    });
    drawingsRef.current = [];
  };
  const toggleAutoZoom = () => {
    setAutoZoom(!autoZoom);
    if (!autoZoom) {
      chartRef.current.timeScale().fitContent();
    }
  };
  useEffect(() => {
    let chartHeight;
    const width = window.innerWidth;
    // Large desktops
    if (width > 1600) {
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
      chartHeight = 480;
    }
    // iPhone 15/14/13/12/11, SE, Mini, Galaxy S24/S23/S22/S21/S20 FE, Pixel 8/7/6, Z Flip
    // Heights: 2340, 2266, 2340, 2400, 2400, 2400, 2400, 2400, 2400, 2400, 2400, 2400
    else if (window.innerHeight > 900) {
      chartHeight = 440;
    }
    // Smallest phones (iPhone SE, older Androids, height < 900)
    else if (window.innerHeight > 700) {
      chartHeight = 380;
    } else {
      chartHeight = 300; // Default for very small screens
    }
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: theme.background },
        textColor: theme.textColor,
        fontFamily: "Arial",
      },
      grid: {
        vertLines: { color: theme.gridColor },
        horzLines: { color: theme.gridColor },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
      },
      watermark: {
        visible: false,
      },
      timeScale: {
        borderColor: theme.gridColor,
        timeVisible: true,
        secondsVisible: true,
        rightOffset: 2, // Adjust to ensure space on the right
        barSpacing: 15, // Adjust bar spacing for zoom level
        minBarSpacing: 5, // Prevent excessive zoom out
      },
      rightPriceScale: {
        borderColor: theme.gridColor,
      },
      width: chartContainerRef.current.clientWidth,
      height: chartHeight,
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
    chart.subscribeClick(handleChartClick);
    chart.timeScale().applyOptions({
      rightOffset: 2,
      fixLeftEdge: false,
      fixRightEdge: false,
      lockVisibleTimeRangeOnResize: false,
      handleScroll: true,
      handleScale: true,
    });

    // Set initial visible range to show approximately 10 candles
    chart.timeScale().setVisibleLogicalRange({ from: -10, to: 0 });

    chart.timeScale().subscribeVisibleTimeRangeChange(() => {
      updateCountdownPosition();
    });

    return () => {
      chart.remove();
    };
  }, []);

  // Apply theme, style and indicators when they change
  useEffect(() => {
    applyTheme();
    applyCandleStyle();
    applyIndicators();
  }, [theme, candleStyle, indicator]);

  // Load initial data
  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get(
          `${BACKEND_URL}/api/coins/candles/${coinName}/${interval}`
        );
        const historical = res.data;
        setCandles(historical);

        const ts = Math.floor(Date.now() / 1000);
        const bucket =
          Math.floor(ts / intervalToSeconds[interval]) *
          intervalToSeconds[interval];

        const last = historical.at(-1);
        const lastClose = last?.close ?? 1.0;

        setLiveCandle({
          time: Number(bucket),
          open: lastClose,
          high: lastClose,
          low: lastClose,
          close: lastClose,
        });

        const grouped = groupCandles(historical, interval);
        if (seriesRef.current) {
          if (candleStyle === CANDLE_STYLES.LINE) {
            const lineData = grouped.map((candle) => ({
              time: candle.time,
              value: candle.close,
            }));
            seriesRef.current.setData(lineData);
          } else {
            seriesRef.current.setData(grouped);
          }
        }

        if (firstLoad) {
          chartRef.current.timeScale().fitContent();
          setFirstLoad(false);
        } else if (autoZoom) {
          chartRef.current.timeScale().fitContent();
        }

        applyIndicators();
        setRenderKey((k) => k + 1);
      } catch (err) {
        console.error("Initial candle fetch failed", err);
      }
    };
    load();
  }, [coinName, interval]);

  // Clear tradeHover when trades change to prevent stuck hover effect
  useEffect(() => {
    setTradeHover({});
  }, [trades]);

  // Update chart when data changes
  useEffect(() => {
    if (!liveCandle) return;

    const now = Date.now();
    if (
      lastCandleRef.current &&
      lastCandleRef.current.time === liveCandle.time &&
      lastCandleRef.current.close === liveCandle.close &&
      now - lastUpdateRef.current < 100
    ) {
      return;
    }

    lastCandleRef.current = liveCandle;
    lastUpdateRef.current = now;

    const frame = requestAnimationFrame(() => {
      const data = groupCandles(candles, interval);
      const updated = [...data];
      const liveTime = Number(liveCandle.time);
      const last = updated[updated.length - 1];

      if (last && Number(last.time) === liveTime) {
        last.high = Math.max(last.high, liveCandle.high);
        last.low = Math.min(last.low, liveCandle.low);
        last.close = liveCandle.close;
      } else {
        updated.push({ ...liveCandle, time: liveTime });
      }

      updated.sort((a, b) => a.time - b.time);
      if (seriesRef.current) {
        if (candleStyle === CANDLE_STYLES.LINE) {
          const lineData = updated.map((candle) => ({
            time: candle.time,
            value: candle.close,
          }));
          seriesRef.current.setData(lineData);
        } else {
          seriesRef.current.setData(updated);
        }
      }

      // Only fit content on first load or if autoZoom is toggled, not on every update
      if (chartRef.current && firstLoad) {
        chartRef.current.timeScale().fitContent();
        setFirstLoad(false);
      }

      applyIndicators();
    });

    return () => cancelAnimationFrame(frame);
  }, [candles, liveCandle, interval, renderKey, candleStyle]);

  // Socket event handlers
  useEffect(() => {
    const handlePrice = ({ price, trend, counter }) => {
      if (trend) trendRef.current = trend;
      if (counter != null) trendCounterRef.current = counter;

      const roundedPrice = parseFloat(price.toFixed(4));
      setCurrentPrice(roundedPrice);

      setLiveCandle((prev) => {
        if (!prev || !prev.time) return prev;

        const now = Math.floor(Date.now() / 1000);
        const bucket =
          Math.floor(now / intervalToSeconds[interval]) *
          intervalToSeconds[interval];

        if (bucket !== prev.time) return prev;

        const t = trendRef.current;
        const c = trendCounterRef.current ?? 0;

        let constrained = roundedPrice;
        switch (t) {
          case "Up":
            constrained = Math.max(prev.open, roundedPrice);
            break;
          case "Down":
            constrained = Math.min(prev.open, roundedPrice);
            break;
          case "Random":
            constrained = roundedPrice;
            break;
          case "Scenario1":
            constrained =
              c % 4 < 3
                ? Math.max(prev.open, roundedPrice)
                : Math.min(prev.open, roundedPrice);
            break;
          case "Scenario2":
            constrained =
              c % 10 < 5
                ? Math.min(prev.open, roundedPrice)
                : Math.max(prev.open, roundedPrice);
            break;
          case "Scenario3":
            constrained =
              c % 2 === 0
                ? Math.max(prev.open, roundedPrice)
                : Math.min(prev.open, roundedPrice);
            break;
          case "Scenario4":
            constrained = Math.max(prev.open, roundedPrice);
            break;
          case "Scenario5":
            constrained = Math.min(prev.open, roundedPrice);
            break;
          default:
            constrained = roundedPrice;
        }

        const updated = {
          ...prev,
          high: parseFloat(Math.max(prev.high, constrained).toFixed(4)),
          low: parseFloat(Math.min(prev.low, constrained).toFixed(4)),
          close: parseFloat(constrained.toFixed(4)),
        };

        try {
          if (seriesRef.current) {
            if (candleStyle === CANDLE_STYLES.LINE) {
              seriesRef.current.update({
                time: Number(updated.time),
                value: updated.close,
              });
            } else {
              seriesRef.current.update({
                time: Number(updated.time),
                ...updated,
              });
            }
          }
          setRenderKey((k) => k + 1);
        } catch (e) {
          console.error("Error updating series:", e);
        }
        return updated;
      });
    };

    const handleCandle = (candle) => {
      if (candle.trend) trendRef.current = candle.trend;

      setCandles((prev) => {
        const exists = prev.find((c) => c.time === candle.time);
        if (exists) {
          return prev.map((c) => (c.time === candle.time ? candle : c));
        } else {
          return [...prev, candle];
        }
      });

      const bucket = Math.floor(Date.parse(candle.time) / 1000);

      const newCandle = {
        time: Number(bucket),
        open: candle.close,
        high: candle.close,
        low: candle.close,
        close: candle.close,
      };

      const merged = [...candles, candle];
      const grouped = groupCandles(merged, interval);

      if (!grouped.find((c) => c.time === newCandle.time)) {
        grouped.push(newCandle);
      }

      grouped.sort((a, b) => a.time - b.time);
      if (seriesRef.current) {
        if (candleStyle === CANDLE_STYLES.LINE) {
          const lineData = grouped.map((c) => ({
            time: c.time,
            value: c.close,
          }));
          seriesRef.current.setData(lineData);
        } else {
          seriesRef.current.setData(grouped);
        }
      }
      setLiveCandle(newCandle);
      setRenderKey((k) => k + 1);
      applyIndicators();
    };

    socket.on(`price:${coinName}`, handlePrice);
    socket.on(`candle:${coinName}`, handleCandle);

    return () => {
      socket.off(`price:${coinName}`, handlePrice);
      socket.off(`candle:${coinName}`, handleCandle);
    };
  }, [coinName, interval, candleStyle]);

  // Update timeScale when autoZoom changes
  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.timeScale().applyOptions({
        rightOffset: 50, // Reduce the right offset for closer zoom
        fixLeftEdge: true,
        fixRightEdge: false, // Allow the last candle to move freely
        lockVisibleTimeRangeOnResize: false, // Allow resizing without locking the time range
        handleScroll: true,
        handleScale: true,
      });

      if (autoZoom) {
        chartRef.current.timeScale().fitContent();
      } else {
        chartRef.current.timeScale().zoomToLogicalRange({ from: 0, to: 100 }); // Increase zoom level
      }
    }
  }, [autoZoom]);

  // Close coin selector on outside click
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
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showCoinSelector]);

  // --- FIX: Render trade boxes inside chart container absolutely using chart-relative coordinates ---
  const [tradeHover, setTradeHover] = useState({});

  // --- TRADE BOXES DYNAMIC SIZE AND POSITION ---
  const [tradeBoxSize, setTradeBoxSize] = useState({
    width: 44,
    height: 16,
    font: 9,
  });
  const prevBoxSizeRef = useRef(tradeBoxSize);

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
      const newSize = { width, height, font };
      const prev = prevBoxSizeRef.current;
      if (
        prev.width !== width ||
        prev.height !== height ||
        prev.font !== font
      ) {
        setTradeBoxSize(newSize);
        prevBoxSizeRef.current = newSize;
      }
      raf = requestAnimationFrame(updateSize);
    };
    updateSize();
    return () => cancelAnimationFrame(raf);
  }, [interval]);

  // Helper: get chart coordinates for a trade (time, price)
  const getTradeBoxStyle = (trade) => {
    // Debug: log the trade object and key fields
    console.log("TRADE DEBUG", {
      startedAt: trade.startedAt,
      entryPrice: trade.entryPrice,
      coinPrice: trade.coinPrice,
      price: trade.price,
      investment: trade.investment,
      coinName: trade.coinName,
      trade,
    });

    if (!chartRef.current || !seriesRef.current || !chartContainerRef.current) {
      // Don't hide, just return minimal style so you can debug visually
      return {
        position: "absolute",
        left: 50,
        top: 0,
        zIndex: 100000000,
        background: "#fff",
        color: "#222",
        border: "1px solid #888",
        borderRadius: 6,
        padding: "6px 10px",
        minWidth: 60,
        minHeight: 32,
        fontSize: 13,
        opacity: 0.5,
        pointerEvents: "auto",
      };
    }

    // Parse trade time (convert to integer seconds)
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
      } else {
        // Debug: log invalid startedAt
        console.log("TRADE INVALID startedAt", trade.startedAt);
        // Show at left:0,top:0 for debugging
        return {
          position: "absolute",
          left: 0,
          top: 0,
          zIndex: 10,
          background: "#fff",
          color: "#222",
          border: "1px solid #888",
          borderRadius: 6,
          padding: "6px 10px",
          minWidth: 60,
          minHeight: 32,
          fontSize: 13,
          opacity: 0.5,
          pointerEvents: "auto",
        };
      }
    } else if (trade.startedAt instanceof Date) {
      tradeTimestamp = Math.floor(trade.startedAt.getTime() / 1000);
    } else {
      // Debug: log missing startedAt
      console.log("TRADE MISSING startedAt", trade);
      return {
        position: "absolute",
        left: 0,
        top: 0,
        zIndex: 10,
        background: "#fff",
        color: "#222",
        border: "1px solid #888",
        borderRadius: 6,
        padding: "6px 10px",
        minWidth: 60,
        minHeight: 32,
        fontSize: 13,
        opacity: 0.5,
        pointerEvents: "auto",
      };
    }

    if (isNaN(tradeTimestamp)) {
      // Debug: log NaN timestamp
      console.log("TRADE TIMESTAMP NaN", trade);
      return {
        position: "absolute",
        left: 0,
        top: 0,
        zIndex: 10,
        background: "#fff",
        color: "#222",
        border: "1px solid #888",
        borderRadius: 6,
        padding: "6px 10px",
        minWidth: 60,
        minHeight: 32,
        fontSize: 13,
        opacity: 0.5,
        pointerEvents: "auto",
      };
    }

    // Get trade price
    const tradePrice = trade.entryPrice ?? trade.coinPrice ?? trade.price;
    if (tradePrice == null || isNaN(Number(tradePrice))) {
      // Debug: log invalid price
      console.log("TRADE INVALID PRICE", tradePrice, trade);
      return {
        position: "absolute",
        left: 0,
        top: 0,
        zIndex: 10,
        background: "#fff",
        color: "#222",
        border: "1px solid #888",
        borderRadius: 6,
        padding: "6px 10px",
        minWidth: 60,
        minHeight: 32,
        fontSize: 13,
        opacity: 0.5,
        pointerEvents: "auto",
      };
    }

    // Convert to chart coordinates
    const timeScale = chartRef.current.timeScale();

    // --- Extract chartTimes from the actual chart data (bucketed) ---
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

    // --- Bucket tradeTimestamp to match chart candle times ---
    const intervalSec = intervalToSeconds[interval];
    let mappedTime = Math.floor(tradeTimestamp / intervalSec) * intervalSec;

    // Find the closest chart time if not present
    if (!chartTimes.includes(mappedTime) && chartTimes.length > 0) {
      mappedTime = chartTimes.reduce((prev, curr) =>
        Math.abs(curr - mappedTime) < Math.abs(prev - mappedTime) ? curr : prev
      );
    }

    // --- KEY: log mappedTime and chartTimes for debugging ---
    console.log("TRADE MAPPING", { tradeTimestamp, mappedTime, chartTimes });

    // --- DEBUG: log if mappedTime is in chartTimes ---
    console.log(
      "MAPPED TIME IN CHART TIMES?",
      chartTimes.includes(mappedTime),
      "mappedTime:",
      mappedTime
    );

    // --- DEBUG: log difference to closest chartTime ---
    if (chartTimes.length > 0) {
      const closest = chartTimes.reduce((prev, curr) =>
        Math.abs(curr - mappedTime) < Math.abs(prev - mappedTime) ? curr : prev
      );
      console.log(
        "CLOSEST CHART TIME TO mappedTime",
        closest,
        "DIFF",
        Math.abs(closest - mappedTime)
      );
    }

    const x = chartRef.current.timeScale().timeToCoordinate(mappedTime);
    const y = seriesRef.current.priceToCoordinate(Number(tradePrice));

    // If coordinates are not available, show at left:0,top:0 for debugging
    if (x == null || y == null || isNaN(x) || isNaN(y)) {
      return {
        position: "absolute",
        left: 0,
        top: 0,
        zIndex: 10,
        background: "#fff",
        color: "#222",
        border: "1px solid #888",
        borderRadius: 6,
        padding: "6px 10px",
        minWidth: 60,
        minHeight: 32,
        fontSize: 13,
        opacity: 0.5,
        pointerEvents: "auto",
      };
    }

    // Get container dimensions
    const containerRect = chartContainerRef.current.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const containerHeight = containerRect.height;

    // Clamp coordinates within visible area
    const left = Math.max(0, Math.min(x, containerWidth - 60));
    const top = Math.max(0, Math.min(y, containerHeight - 40));

    return {
      position: "absolute",
      left: `${left}px`,
      top: `${top}px`,
      zIndex: 10,
      background: "#fff",
      color: "#222",
      border: "1px solid #888",
      borderRadius: 6,
      padding: "6px 10px",
      minWidth: 60,
      minHeight: 32,
      fontSize: 13,
      boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
      cursor: "pointer",
      opacity: 0.95,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      transition: "box-shadow 0.2s",
      pointerEvents: "auto",
    };
  };

  // Helper: get payout for a trade
  const getTradePayout = (trade) => {
    const coinData = coins.find((c) => c.name === trade.coinName);
    const profitPercentage = coinData?.profitPercentage || 0;
    return (trade.investment * (1 + profitPercentage / 100)).toFixed(2);
  };

  // --- TRADE BOXES COMPONENT FOR LIVE POSITIONING ---
  const TradeBoxes = ({
    trades,
    chartRef,
    seriesRef,
    chartContainerRef,
    coinName,
    interval,
    tradeBoxSize,
    getTradePayout,
    handleCloseTrade,
    tradeHover,
    setTradeHover,
  }) => {
    const [, setRerender] = React.useState(0);
    React.useEffect(() => {
      let raf;
      const rerender = () => {
        setRerender((v) => v + 1);
        raf = requestAnimationFrame(rerender);
      };
      rerender();
      return () => cancelAnimationFrame(raf);
    }, [interval]);

    // Group trades by mapped interval (ignore type)
    const intervalSec = intervalToSeconds[interval];
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
        // Sort by startedAt ascending (oldest first)
        tradesArr.sort((a, b) => {
          const aTime = new Date(a.startedAt).getTime();
          const bTime = new Date(b.startedAt).getTime();
          return aTime - bTime;
        });
        // Calculate total width needed for all boxes and center them on the candle
        const gap = 28; // space between boxes
        const totalWidth =
          tradesArr.length * boxWidth + (tradesArr.length - 1) * gap;
        const x = chartRef.current
          ?.timeScale()
          .timeToCoordinate(Number(mappedTime));
        const containerRect =
          chartContainerRef.current?.getBoundingClientRect() || {
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
        tradesArr.forEach((trade, idx, arr) => {
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
                  Payout: ${getTradePayout(trade)}
                </div>
              )}
              {trade.remainingTime === 0 && tradeId && (
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
                  onClick={() =>
                    handleCloseTrade &&
                    handleCloseTrade({ ...trade, id: tradeId })
                  }
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
          chartContainerRef.current
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
          // Draw a line for every trade (including the first)
          tradesArr.forEach((trade, idx) => {
            if (
              typeof trade.remainingTime === "number" &&
              trade.remainingTime <= 0
            )
              return;
            // Calculate line length in pixels based on trade duration (in seconds)
            let durationSec = 60; // default 1m
            if (typeof trade.duration === "number") {
              durationSec = trade.duration;
            } else if (
              typeof trade.remainingTime === "number" &&
              typeof trade.startedAt !== "undefined"
            ) {
              // Estimate duration as (expiry - startedAt)
              const now = Math.floor(Date.now() / 1000);
              const started =
                typeof trade.startedAt === "number"
                  ? trade.startedAt > 1e12
                    ? Math.floor(trade.startedAt / 1000)
                    : trade.startedAt
                  : Math.floor(new Date(trade.startedAt).getTime() / 1000);
              durationSec = trade.remainingTime + (now - started);
            }
            // Calculate the time in seconds for the line's end
            let tradeStartSec =
              typeof trade.startedAt === "number"
                ? trade.startedAt > 1e12
                  ? Math.floor(trade.startedAt / 1000)
                  : trade.startedAt
                : Math.floor(new Date(trade.startedAt).getTime() / 1000);
            let tradeEndSec = tradeStartSec + durationSec;
            // Use chart time scale to get pixel length
            let x0 = chartRef.current
              .timeScale()
              .timeToCoordinate(tradeStartSec);
            let x1 = chartRef.current.timeScale().timeToCoordinate(tradeEndSec);
            let lineLength = 80; // fallback
            if (x0 != null && x1 != null && !isNaN(x0) && !isNaN(x1)) {
              lineLength = Math.max(20, Math.abs(x1 - x0));
            }
            // Shrink the line as remainingTime decreases
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
            const lineLeft = leftLast + boxWidth / 2 + 16;
            const lineTop = topLast + idx * 16 + 10;
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
                  zIndex: 20, // ensure in front of trade boxes
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
    return rendered;
  };

  // Render the chart component
  return (
    <div
      className="mainBOX"
      style={{
        background: theme.background,
        color: theme.textColor,
        borderRadius: 10,
      }}
    >
      <div
        className="charting"
        style={{
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
          <div className="webCoinInfo" style={{ position: "absolute" }}>
            <div className="coininfoBox">
              <p className="nameProfitWeb">
                {coins.find((c) => c.name === coinName)?.firstName}/
                {coins.find((c) => c.name === coinName)?.lastName}
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
                top: "103px",
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
                color: "black",
                cursor: "pointer",
                height: 50,
                fontSize: "1.5rem",
                background: "#E0E0E0",
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
                  background: "#E0E0E0",
                  border: "2px solid #10A055",
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
                    onClick={() => handleDrawingToolClick(tool)}
                    style={{
                      padding: "5px 10px",
                      color: theme.textColor,
                      cursor: "pointer",
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
                    borderTop: `1px solid ${theme.gridColor}`,
                    marginTop: 5,
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
          <div style={{ position: "relative" }}>
            <button
              class
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

      <div style={{ position: "relative" }}>
        <div
          ref={chartContainerRef}
          className="chartMain"
          style={{ width: "100%", position: "relative" }}
        />
        <div
          id="candle-countdown"
          style={{
            position: "absolute",
            transform: "translate(-50%, -50%)",
            color: theme.textColor,
            background: "rgba(0, 0,  0, 0.2)",
            borderRadius: 4,
            pointerEvents: "none",
            zIndex: 2,
            fontWeight: "bold",
            whiteSpace: "nowrap",
          }}
        >
          {countdown}s
        </div>
        {/* --- TRADE BOXES ON CHART --- */}
        <TradeBoxes
          trades={trades}
          chartRef={chartRef}
          seriesRef={seriesRef}
          chartContainerRef={chartContainerRef}
          coinName={coinName}
          interval={interval}
          tradeBoxSize={tradeBoxSize}
          getTradePayout={getTradePayout}
          handleCloseTrade={handleCloseTrade}
          tradeHover={tradeHover}
          setTradeHover={setTradeHover}
        />
      </div>
    </div>
  );
};

export default LiveCandleChart;
