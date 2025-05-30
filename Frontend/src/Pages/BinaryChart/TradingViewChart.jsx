import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { createChart, CrosshairMode } from "lightweight-charts";
import { AiOutlinePlus, AiOutlineBgColors } from "react-icons/ai";
import { BsBarChartFill } from "react-icons/bs";
import { BiPencil } from "react-icons/bi";
import "./LiveCandleChart.css";

// Time interval mapping
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

const TradingViewChart = ({ coinName }) => {
  const containerRef = useRef();
  const chartRef = useRef(null);
  const seriesRef = useRef(null);
  
  // State variables
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

  // Refs for indicators and drawings
  const smaSeriesRef = useRef(null);
  const emaSeriesRef = useRef(null);
  const rsiSeriesRef = useRef(null);
  const drawingsRef = useRef([]);

  // Fetch candle data
  const fetchCandles = async () => {
    try {
      const response = await axios.get(
        `https://api.binance.com/api/v3/klines?symbol=${coinName}USDT&interval=${interval.replace('m', '')}m&limit=1000`
      );
      
      const formattedCandles = response.data.map(candle => ({
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
    }

    if (candles.length > 0) {
      if (candleStyle === CANDLE_STYLES.LINE) {
        const lineData = candles.map(candle => ({
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
    if (smaSeriesRef.current) chartRef.current.removeSeries(smaSeriesRef.current);
    if (emaSeriesRef.current) chartRef.current.removeSeries(emaSeriesRef.current);
    if (rsiSeriesRef.current) chartRef.current.removeSeries(rsiSeriesRef.current);

    if (indicator === INDICATORS.NONE) return;

    // Simple indicator implementations
    switch (indicator) {
      case INDICATORS.SMA:
        const smaData = candles.map((candle, i, arr) => {
          if (i < 20) return null;
          const sum = arr.slice(i - 20, i).reduce((acc, val) => acc + val.close, 0);
          return {
            time: candle.time,
            value: sum / 20
          };
        }).filter(Boolean);
        
        smaSeriesRef.current = chartRef.current.addLineSeries({
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
    seriesRef.current = chart.addCandlestickSeries({
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

  return (
    <div
      style={{
        padding: 20,
        paddingTop: 0,
        background: theme.background,
        color: theme.textColor,
        borderRadius: 10,
      }}
    >
      <div
        style={{
          display: "flex",
          marginBottom: 10,
          flexWrap: "wrap",
        }}
      >
        {/* Indicator button */}
        <div style={{ position: "relative" }}>
          <button
            className="chartBtns"
            onClick={() => {
              setShowIndicatorPopup(!showIndicatorPopup);
              setShowStylePopup(false);
              setShowThemePopup(false);
              setShowDrawingPopup(false);
            }}
            style={{
              fontSize: "1rem",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              color: theme.textColor,
              cursor: "pointer",
              background: "linear-gradient(90deg, #66b544, #1a391d)",
              height: 50,
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
        </div>

        {/* Drawing tools button */}
        <div style={{ position: "relative" }}>
          <button
            className="chartBtns"
            onClick={() => {
              setShowIndicatorPopup(false);
              setShowStylePopup(false);
              setShowThemePopup(false);
              setShowDrawingPopup(!showDrawingPopup);
            }}
            style={{
              padding: "6px 12px",
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
        <select
          value={interval}
          className="chartBtns"
          onChange={(e) => setInterval(e.target.value)}
          style={{
            appearance: "none",
            padding: "6px 12px",
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

        {/* Theme selector */}
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
              padding: "6px 12px",
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
              padding: "6px 12px",
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

      {/* Chart container */}
      <div
        ref={containerRef}
        style={{ width: "100%", height: "600px", overflow: "hidden" }}
      />
    </div>
  );
};

export default TradingViewChart;