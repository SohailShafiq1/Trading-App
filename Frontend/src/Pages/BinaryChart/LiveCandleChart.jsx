// Import required libraries and icons
import { AiOutlinePlus } from "react-icons/ai";
import { AiOutlineBgColors } from "react-icons/ai";
import { BsBarChartFill } from "react-icons/bs";
import { AiOutlinePlusSquare } from "react-icons/ai";
import { BiPencil } from "react-icons/bi";
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

// Initialize socket connection to backend
const socket = io("http://localhost:5000");
const BACKEND_URL = "http://localhost:5000";

// Time interval mapping to seconds
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
    gridColor: "#3A3A3A+",
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

// Function to group raw candle data into specified intervals
const groupCandles = (candles, interval) => {
  const intervalSec = intervalToSeconds[interval];
  const grouped = [];
  const sorted = [...candles]
    .filter((c) => c?.time && c?.open != null)
    .sort((a, b) => {
      // Convert ISO string to timestamp if needed for sorting
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
    // --- Always convert ISO string to UNIX seconds ---
    let ts;
    if (typeof c.time === "string") {
      ts = Math.floor(Date.parse(c.time) / 1000);
    } else {
      ts = Number(c.time);
    }
    if (isNaN(ts)) continue;

    // --- BUCKET ONLY IN FRONTEND ---
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

// Function to calculate Simple Moving Average
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

// Function to calculate Exponential Moving Average
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

// Function to calculate Relative Strength Index
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

// Function to calculate Moving Average Convergence Divergence
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

// Function to calculate Bollinger Bands
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

// Main chart component
const LiveCandleChart = ({
  coinName,
  setSelectedCoin,
  coins,
  profit,
  type,
  trades,
  handleCloseTrade,
}) => {
  // Refs for chart elements
  const chartContainerRef = useRef();
  const chartRef = useRef(null);
  const seriesRef = useRef(null);
  const coinSelectorRef = useRef();

  // State for various chart controls
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

  // Refs for indicators
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

  // Refs for drawing tools
  const countdownRef = useRef();
  const activeDrawingToolRef = useRef(null);
  const drawingStartPointRef = useRef(null);
  const drawingsRef = useRef([]);

  // State for zoom control
  const [autoZoom, setAutoZoom] = useState(true);
  const [firstLoad, setFirstLoad] = useState(true);

  // Update countdown reference
  countdownRef.current = countdown;

  // Fix for the oscillation glitch
  const lastCandleRef = useRef(null);
  const lastUpdateRef = useRef(0);

  // Countdown timer for next candle
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

  // Effect for countdown animation
  useEffect(() => {
    let animationFrameId;
    const tick = () => {
      updateCountdown();
      animationFrameId = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(animationFrameId);
  }, [interval]);

  // Position the countdown label on the chart
  const updateCountdownPosition = () => {
    if (!chartRef.current || !liveCandle || !seriesRef.current) return;

    const chart = chartRef.current;
    const timeScale = chart.timeScale();
    const x = timeScale.timeToCoordinate(liveCandle.time);
    const y = seriesRef.current.priceToCoordinate(liveCandle.close);
    const label = document.getElementById("candle-countdown");

    if (!label || x == null || y == null) return;

    // Get chart container bounds
    const containerRect = chartContainerRef.current.getBoundingClientRect();
    const labelWidth = label.offsetWidth;
    const labelHeight = label.offsetHeight;

    // Constrain position within chart bounds
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

    // Adjust font size based on zoom level
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

  // Effect for countdown position animation
  useEffect(() => {
    let raf;
    const animate = () => {
      updateCountdownPosition();
      raf = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(raf);
  }, [liveCandle, interval]);

  // Apply selected theme to chart
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
      });
    }
  };

  // Apply selected candle style to chart
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
          wickUpColor: theme.upColor,
          wickDownColor: theme.downColor,
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
          wickUpColor: theme.upColor,
          wickDownColor: theme.downColor,
        });
        break;
      default:
        seriesRef.current = chartRef.current.addCandlestickSeries({
          upColor: theme.upColor,
          downColor: theme.downColor,
          borderUpColor: theme.upColor,
          borderDownColor: theme.downColor,
          wickUpColor: theme.upColor,
          wickDownColor: theme.downColor,
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

  // Apply selected indicators to chart
  const applyIndicators = () => {
    // Remove previous indicators
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

            // Configure RSI scale
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

  // Handle drawing tool selection
  const handleDrawingToolClick = (tool) => {
    setDrawingTool(tool);
    setShowDrawingPopup(false);
    activeDrawingToolRef.current = tool;
    drawingStartPointRef.current = null;
  };

  // Handle chart click events for drawing tools
  const handleChartClick = (param) => {
    if (!activeDrawingToolRef.current || !chartRef.current || !param.point)
      return;

    const point = param.point;
    const price = seriesRef.current.coordinateToPrice(point.y);
    const time = chartRef.current.timeScale().coordinateToTime(point.x);

    if (!drawingStartPointRef.current) {
      // First click - set the starting point
      drawingStartPointRef.current = { time, price, x: point.x, y: point.y };
    } else {
      // Second click - draw the line
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

      // Reset drawing state
      drawingStartPointRef.current = null;
      activeDrawingToolRef.current = null;
      setDrawingTool(DRAWING_TOOLS.NONE);
    }
  };

  // Clear all drawings from chart
  const clearAllDrawings = () => {
    drawingsRef.current.forEach((drawing) => {
      if (drawing.remove) drawing.remove();
    });
    drawingsRef.current = [];
  };

  // Toggle auto-zoom behavior
  const toggleAutoZoom = () => {
    setAutoZoom(!autoZoom);
    if (!autoZoom) {
      chartRef.current.timeScale().fitContent();
    }
  };

  // Initialize chart
  useEffect(() => {
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
      height: 600,
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

    // Subscribe to click events for drawing tools
    chart.subscribeClick(handleChartClick);

    // Configure time scale behavior
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

      // Adjust visible range to maintain proper candle display
      if (chartRef.current) {
        const timeScale = chartRef.current.timeScale();
        const visibleRange = timeScale.getVisibleLogicalRange();
        if (visibleRange) {
          const totalCandles = updated.length;
          const visibleCandles = visibleRange.to - visibleRange.from;

          // Ensure at least 10 candles are visible
          if (visibleCandles < 10) {
            timeScale.setVisibleLogicalRange({
              from: totalCandles - 10,
              to: totalCandles,
            });
          }
        }
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

      <div style={{ position: "relative" }}>
        <div
          ref={chartContainerRef}
          className="chartMain"
          style={{ width: "100%", height: "500px", position: "relative" }}
        />
        <div
          id="candle-countdown"
          style={{
            position: "absolute",
            transform: "translate(-50%, -50%)",
            color: theme.textColor,
            background: "rgba(0, 0, 0, 0.2)",
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
        {Array.isArray(trades) &&
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
            .map((trade, idx, arr) => {
              const tradeId =
                trade.id || trade._id || `${trade.startedAt}-${trade.coinName}`;
              const showClose = trade.remainingTime === 0;
              const isBuy = trade.type === "Buy";
              const boxColor = isBuy ? "#10A055" : "#FF0000";
              const borderColor = isBuy ? "#0d7a3a" : "#b80000";
              const textColor = "#fff";

              // --- Calculate chart coordinates for each trade box ---
              let left = 0,
                top = 0;
              let opacity = 0.95;
              if (
                chartRef.current &&
                seriesRef.current &&
                chartContainerRef.current
              ) {
                // Bucket trade time to match chart candle times
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
                const intervalSec = intervalToSeconds[interval];
                let mappedTime =
                  Math.floor(tradeTimestamp / intervalSec) * intervalSec;

                // Find the closest chart time if not present
                let chartTimes = [];
                let chartData = [];
                if (seriesRef.current._internal__data?._data) {
                  chartData = seriesRef.current._internal__data._data;
                  chartTimes = chartData.map((c) =>
                    typeof c.time === "string"
                      ? Math.floor(Date.parse(c.time) / 1000)
                      : Number(c.time)
                  );
                }
                if (!chartTimes.includes(mappedTime) && chartTimes.length > 0) {
                  mappedTime = chartTimes.reduce((prev, curr) =>
                    Math.abs(curr - mappedTime) < Math.abs(prev - mappedTime)
                      ? curr
                      : prev
                  );
                }

                const x = chartRef.current
                  .timeScale()
                  .timeToCoordinate(mappedTime);
                const y = seriesRef.current.priceToCoordinate(
                  Number(trade.entryPrice ?? trade.coinPrice ?? trade.price)
                );
                const containerRect =
                  chartContainerRef.current.getBoundingClientRect();
                const containerWidth = containerRect.width;
                const containerHeight = containerRect.height;

                // --- Prevent overlap: stack vertically if multiple trades at same candle/price ---
                // Find all trades at this mappedTime and price, and use their index for stacking
                const tradesAtSameSpot = arr.filter((t) => {
                  let tTimestamp;
                  if (typeof t.startedAt === "number") {
                    tTimestamp =
                      t.startedAt > 1e12
                        ? Math.floor(t.startedAt / 1000)
                        : t.startedAt;
                  } else if (typeof t.startedAt === "string") {
                    const parsed = Date.parse(t.startedAt);
                    if (!isNaN(parsed)) {
                      tTimestamp = Math.floor(parsed / 1000);
                    }
                  } else if (t.startedAt instanceof Date) {
                    tTimestamp = Math.floor(t.startedAt.getTime() / 1000);
                  }
                  let tMapped =
                    Math.floor(tTimestamp / intervalSec) * intervalSec;
                  if (!chartTimes.includes(tMapped) && chartTimes.length > 0) {
                    tMapped = chartTimes.reduce((prev, curr) =>
                      Math.abs(curr - tMapped) < Math.abs(prev - tMapped)
                        ? curr
                        : prev
                    );
                  }
                  const tPrice = t.entryPrice ?? t.coinPrice ?? t.price;
                  return (
                    tMapped === mappedTime &&
                    Number(tPrice) ===
                      Number(trade.entryPrice ?? trade.coinPrice ?? trade.price)
                  );
                });
                const stackIndex = tradesAtSameSpot.findIndex(
                  (t) => t.id === trade.id
                );

                // Position: if x/y are valid, use them, else stack at right
                if (x != null && y != null && !isNaN(x) && !isNaN(y)) {
                  // Stack vertically with 22px spacing for each trade at same candle/price
                  left = Math.max(0, Math.min(x, containerWidth - 60));
                  top = Math.max(
                    0,
                    Math.min(y + stackIndex * 22, containerHeight - 28)
                  );
                  opacity = 1;
                } else {
                  // fallback: stack at right, spaced vertically
                  left = containerWidth - 70;
                  top = 20 + idx * 38;
                  opacity = 0.7;
                }
              }

              return (
                <div
                  key={tradeId}
                  style={{
                    position: "absolute",
                    left,
                    top,
                    background: boxColor,
                    color: textColor,
                    border: `1.2px solid ${borderColor}`,
                    borderRadius: 5,
                    minWidth: 38,
                    minHeight: 18,
                    fontWeight: 600,
                    fontSize: 10,
                    boxShadow: "0 1px 4px rgba(0,0,0,0.13)",
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "2px 7px",
                    gap: 6,
                    transition:
                      "box-shadow 0.2s, background 0.2s, left 0.15s, top 0.15s",
                    cursor: "pointer",
                    zIndex: 10,
                    pointerEvents: "auto",
                    opacity,
                  }}
                  onMouseEnter={() =>
                    setTradeHover((h) => ({ ...h, [tradeId]: true }))
                  }
                  onMouseLeave={() =>
                    setTradeHover((h) => ({ ...h, [tradeId]: false }))
                  }
                >
                  <span style={{ fontWeight: 700, fontSize: 11 }}>
                    {isBuy ? "B" : "S"}
                  </span>
                  <span style={{ fontWeight: 600, fontSize: 10 }}>
                    ${trade.investment ?? trade.price ?? trade.coinPrice}
                  </span>
                  <span style={{ fontSize: 9, color: "#fff", opacity: 0.85 }}>
                    {trade.remainingTime > 0 ? `${trade.remainingTime}s` : "⏰"}
                  </span>
                  {tradeHover[tradeId] && (
                    <div
                      style={{
                        position: "absolute",
                        top: "-22px",
                        left: "50%",
                        transform: "translateX(-50%)",
                        background: "#222",
                        color: "#fff",
                        padding: "2px 7px",
                        borderRadius: 4,
                        fontSize: 10,
                        whiteSpace: "nowrap",
                        zIndex: 10001,
                        boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
                      }}
                    >
                      Payout: ${getTradePayout(trade)}
                    </div>
                  )}
                  {showClose && (
                    <button
                      style={{
                        position: "absolute",
                        top: 1,
                        right: 1,
                        background: "rgba(255,255,255,0.15)",
                        border: "none",
                        color: "#fff",
                        fontSize: 10,
                        cursor: "pointer",
                        zIndex: 30,
                        borderRadius: 2,
                        padding: 0,
                        transition: "background 0.2s",
                        width: 16,
                        height: 16,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                      onClick={() =>
                        handleCloseTrade && handleCloseTrade(trade)
                      }
                      title="Close Trade"
                    >
                      <AiOutlineClose />
                    </button>
                  )}
                </div>
              );
            })}
        {/* --- END TRADE BOXES --- */}
      </div>
    </div>
  );
};

export default LiveCandleChart;
