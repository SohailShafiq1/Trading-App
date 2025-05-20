import { AiOutlinePlus } from "react-icons/ai";
import { AiOutlineBgColors } from "react-icons/ai";
import { BsBarChartFill } from "react-icons/bs";
import { AiOutlinePlusSquare } from "react-icons/ai";
import { BiPencil } from "react-icons/bi";
import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { createChart, CrosshairMode } from "lightweight-charts";
import { io } from "socket.io-client";

const socket = io("http://localhost:5000");
const BACKEND_URL = "http://localhost:5000";

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
    background: "#ffffff  ",
    textColor: "#333333",
    gridColor: "#eeeeee",
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
    .sort((a, b) => Number(a.time) - Number(b.time));

  for (const c of sorted) {
    const utc = Date.parse(c.time);
    if (isNaN(utc)) continue;

    const ts = Math.floor(utc / 1000);
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

const LiveCandleChart = ({ coinName }) => {
  const chartContainerRef = useRef();
  const chartRef = useRef(null);
  const seriesRef = useRef(null);
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
  countdownRef.current = countdown;

  // Fix for the oscillation glitch
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
                bottom: 0, // Give more space at bottom
              },
              position: "right",
            });

            rsiSeriesRef.current.setData(rsiData);
          }
          break;

        case INDICATORS.MACD:
          {
            const macdData = calculateMACD(data);
            // For MACD, we'll use the main pane but separate scales
            macdSeriesRef.current = chartRef.current.addLineSeries({
              color: "#2962FF",
              lineWidth: 2,
              priceScaleId: "macd", // Custom scale
            });
            macdSignalSeriesRef.current = chartRef.current.addLineSeries({
              color: "#FF6D00",
              lineWidth: 2,
              priceScaleId: "macd", // Same scale
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
            lineStyle: 2, // Dashed
            axisLabelVisible: true,
          });
          break;
        case DRAWING_TOOLS.VERTICAL_LINE:
          drawing = chartRef.current.addTimeLine({
            time: time,
            color: "#FF0000",
            lineWidth: 2,
            lineStyle: 2, // Dashed
          });
          break;
        case DRAWING_TOOLS.TREND_LINE:
          drawing = chartRef.current.addTrendLine({
            point1: { time: start.time, price: start.price },
            point2: { time, price },
            color: "#FF0000",
            lineWidth: 2,
            lineStyle: 2, // Solid
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

  const clearAllDrawings = () => {
    drawingsRef.current.forEach((drawing) => {
      if (drawing.remove) drawing.remove();
    });
    drawingsRef.current = [];
  };

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
      width: chartContainerRef.current.clientWidth,
      height: 500,
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

    chart.timeScale().subscribeVisibleTimeRangeChange(() => {
      updateCountdownPosition();
    });

    return () => {
      chart.remove();
    };
  }, []);

  useEffect(() => {
    applyTheme();
    applyCandleStyle();
    applyIndicators();
  }, [theme, candleStyle, indicator]);

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

        seriesRef.current?.setData(groupCandles(historical, interval));

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
        applyIndicators();
        setRenderKey((k) => k + 1);
      } catch (err) {
        console.error("Initial candle fetch failed", err);
      }
    };
    load();
  }, [coinName, interval]);

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
          seriesRef.current.setData(lineData.slice(-999));
        } else {
          seriesRef.current.setData(updated.slice(-999));
        }
      }
      applyIndicators();
    });

    return () => cancelAnimationFrame(frame);
  }, [candles, liveCandle, interval, renderKey, candleStyle]);

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
          return [...prev.slice(-999), candle];
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
          seriesRef.current.setData(lineData.slice(-999));
        } else {
          seriesRef.current.setData(grouped.slice(-999));
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
  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.timeScale().applyOptions({
        rightOffset: 0,
        fixLeftEdge: true,
        fixRightEdge: true,
        lockVisibleTimeRangeOnResize: true,
        handleScroll: false,
        handleScale: false,
      });
    }
  }, []);
  return (
    <div
      style={{
        padding: 20,
        background: theme.background,
        color: theme.textColor,
        borderRadius: 10,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 10,
        }}
      >
        <h2 style={{ margin: 0 }}>{coinName} Chart</h2>
        <div
          style={{
            fontSize: 18,
            fontWeight: "bold",
            color: currentPrice ? theme.upColor : "#aaa",
            background: theme.background === "#ffffff" ? "#f5f5f5" : "#222",
            padding: "6px 12px",
            borderRadius: 6,
          }}
        >
          {currentPrice ? `$${currentPrice.toFixed(4)}` : "Loading..."}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: 10,
          marginBottom: 10,
          flexWrap: "wrap",
        }}
      >
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setShowIndicatorPopup(!showIndicatorPopup)}
            style={{
              fontSize: "1rem",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              borderRadius: 4,
              border: `1px solid ${theme.gridColor}`,
              color: theme.textColor,
              cursor: "pointer",
              background: "linear-gradient(90deg, #66b544, #1a391d)",
              height: 40,
            }}
          >
            <AiOutlinePlus
              style={{
                color: "white",
                fontSize: "1.5rem",
                fontWeight: "bolder",
              }}
            />
          </button>
          {showIndicatorPopup && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                zIndex: 100,
                background: theme.background,
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
                    borderRadius: 4,
                    background:
                      indicator === ind ? theme.gridColor : theme.background,
                    color: theme.textColor,
                    cursor: "pointer",
                  }}
                >
                  {ind}
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ position: "relative" }}>
          <button
            onClick={() => setShowDrawingPopup(!showDrawingPopup)}
            style={{
              padding: "6px 12px",
              borderRadius: 4,
              border: `1px solid ${theme.gridColor}`,
              background: theme.background,
              color: theme.textColor,
              cursor: "pointer",
              height: 40,
              fontSize: "1.5rem",
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
                background: theme.background,
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
                    borderRadius: 4,
                    background:
                      drawingTool === tool ? theme.gridColor : theme.background,
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
                  background: theme.background,
                  color: theme.textColor,
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
          onChange={(e) => setInterval(e.target.value)}
          style={{
            padding: "6px 12px",
            borderRadius: 4,
            border: `1px solid ${theme.gridColor}`,
            background: theme.background,
            color: theme.textColor,
            cursor: "pointer",
            height: 40,
            fontSize: "1rem",
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
            onClick={() => setShowThemePopup(!showThemePopup)}
            style={{
              padding: "6px 12px",
              borderRadius: 4,
              border: `1px solid ${theme.gridColor}`,
              background: theme.background,
              color: theme.textColor,
              cursor: "pointer",
              height: 40,
              fontSize: "1.5rem",
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
                background: theme.background,
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
                    background: t.background,
                    color: t.textColor,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      background: t.upColor,
                      border: `1px solid ${t.textColor}`,
                    }}
                  />
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      background: t.downColor,
                      border: `1px solid ${t.textColor}`,
                    }}
                  />
                  <span>{t.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setShowStylePopup(!showStylePopup)}
            style={{
              padding: "6px 12px",
              borderRadius: 4,
              border: `1px solid ${theme.gridColor}`,
              background: theme.background,
              color: theme.textColor,
              cursor: "pointer",
              height: 40,
              fontSize: "1.5rem",
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
                background: theme.background,
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
                    borderRadius: 4,
                    background:
                      candleStyle === style
                        ? theme.gridColor
                        : theme.background,
                    color: theme.textColor,
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

      <div style={{ position: "relative" }}>
        <div
          ref={chartContainerRef}
          style={{ width: "100%", height: "500px", overflow: "hidden" }}
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
      </div>
    </div>
  );
};

export default LiveCandleChart;
