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

  // Fetch candle data from Twelve Data
  const fetchCandles = async () => {
    try {
      const apiKey = import.meta.env.VITE_API_KEY;

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

  // Main chart setup
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
        height: 200,
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
      trendLinePoints.length > 2 ||
      activeDrawingTool !== DRAWING_TOOLS.TREND_LINE
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
      console.warn(
        "Some indicator data points were invalid and filtered out:",
        (arr || []).length - filtered.length
      );
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
                      if (activeIndicator === ind) {
                        selectIndicator(null);
                      } else {
                        selectIndicator(ind);
                      }
                    }}
                    style={{ padding: "5px 10px", cursor: "pointer" }}
                  >
                    {ind} {activeIndicator === ind ? "✓" : ""}
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
                  top: "150%",
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
      {(activeIndicator === INDICATORS.RSI ||
        activeIndicator === INDICATORS.MACD) && (
        <div
          ref={indicatorContainerRef}
          style={{ width: "100%", height: 200, marginTop: 10 }}
        />
      )}
    </div>
  );
};

export default ForexTradingChart;
