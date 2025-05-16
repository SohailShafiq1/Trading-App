import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { createChart } from "lightweight-charts";
import { io } from "socket.io-client";

const socket = io("http://localhost:5000");
const BACKEND_URL = "http://localhost:5000";

const intervalToSeconds = {
  "30s": 30,
  "1m": 60,
  "2m": 120,
  "3m": 180,
  "5m": 300,
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
    } else {
      grouped.push({
        time: Number(bucket),
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      });
    }
  }

  return grouped;
};

const LiveCandleChart = ({ coinName }) => {
  const chartContainerRef = useRef();
  const chartRef = useRef(null);
  const seriesRef = useRef(null);
  const [countdown, setCountdown] = useState(0);
  const [interval, setInterval] = useState("30s");
  const [candles, setCandles] = useState([]);
  const [currentPrice, setCurrentPrice] = useState(null);
  const [liveCandle, setLiveCandle] = useState(null);
  const [renderKey, setRenderKey] = useState(0);
  const trendRef = useRef("Random");
  const trendCounterRef = useRef(0);

  const updateCountdown = () => {
    const intervalSec = intervalToSeconds[interval];
    const now = Math.floor(Date.now() / 1000);
    const nextCandle = Math.ceil(now / intervalSec) * intervalSec;
    setCountdown(nextCandle - now);
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

    label.style.left = `${x}px`;
    label.style.top = `${y}px`;

    const width = timeScale.width();
    const range = timeScale.getVisibleLogicalRange();
    if (range) {
      const barWidth = width / (range.to - range.from);
      label.style.fontSize = `${Math.max(10, barWidth * 0.1)}px`;
      label.style.padding = `${Math.max(2, barWidth * 0.1)}px ${Math.max(
        4,
        barWidth * 0.3
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

  useEffect(() => {
    const chart = createChart(chartContainerRef.current, {
      layout: { background: { color: "#121212" }, textColor: "#d1d4dc" },
      grid: {
        vertLines: { color: "#444" },
        horzLines: { color: "#444" },
      },
      timeScale: {
        borderColor: "#888",
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
      priceScale: { borderColor: "#888" },
      width: chartContainerRef.current.clientWidth,
      height: 400,
    });

    const series = chart.addCandlestickSeries({
      upColor: "#00e676",
      downColor: "#ff1744",
      borderUpColor: "#00e676",
      borderDownColor: "#ff1744",
      wickUpColor: "#00e676",
      wickDownColor: "#ff1744",
    });

    chartRef.current = chart;
    seriesRef.current = series;

    chart.timeScale().subscribeVisibleTimeRangeChange(() => {
      updateCountdownPosition();
    });

    return () => chart.remove();
  }, []);

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
        setRenderKey((k) => k + 1);
      } catch (err) {
        console.error("Initial candle fetch failed", err);
      }
    };
    load();
  }, [coinName, interval]);

  useEffect(() => {
    if (!liveCandle) return;

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
      seriesRef.current?.setData(updated.slice(-200));
    });

    return () => cancelAnimationFrame(frame);
  }, [candles, liveCandle, interval, renderKey]);

  useEffect(() => {
    const handlePrice = ({ price, trend, counter }) => {
      if (trend) trendRef.current = trend;
      if (counter != null) trendCounterRef.current = counter;
      setCurrentPrice(price);

      setLiveCandle((prev) => {
        if (!prev || !prev.time) return prev;

        const now = Math.floor(Date.now() / 1000);
        const bucket =
          Math.floor(now / intervalToSeconds[interval]) *
          intervalToSeconds[interval];
        if (bucket !== prev.time) return prev;

        const t = trendRef.current;
        const c = trendCounterRef.current ?? 0;

        let constrained = price;
        switch (t) {
          case "Up":
            constrained = Math.max(prev.open, price);
            break;
          case "Down":
            constrained = Math.min(prev.open, price);
            break;
          case "Random":
            constrained = price;
            break;
          case "Scenario1":
            constrained =
              c % 4 < 3
                ? Math.max(prev.open, price)
                : Math.min(prev.open, price);
            break;
          case "Scenario2":
            constrained =
              c % 10 < 5
                ? Math.min(prev.open, price)
                : Math.max(prev.open, price);
            break;
          case "Scenario3":
            constrained =
              c % 2 === 0
                ? Math.max(prev.open, price)
                : Math.min(prev.open, price);
            break;
          case "Scenario4":
            constrained = Math.max(prev.open, price);
            break;
          case "Scenario5":
            constrained = Math.min(prev.open, price);
            break;
          default:
            constrained = price;
        }
        console.log(c);

        const updated = {
          ...prev,
          high: Math.max(prev.high, constrained),
          low: Math.min(prev.low, constrained),
          close: constrained,
        };

        seriesRef.current?.update({ time: Number(updated.time), ...updated });
        setRenderKey((k) => k + 1);
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
      seriesRef.current?.setData(grouped.slice(-200));
      setLiveCandle(newCandle);
      setRenderKey((k) => k + 1);
    };

    socket.on(`price:${coinName}`, handlePrice);
    socket.on(`candle:${coinName}`, handleCandle);

    return () => {
      socket.off(`price:${coinName}`, handlePrice);
      socket.off(`candle:${coinName}`, handleCandle);
    };
  }, [coinName, interval]);

  return (
    <div
      style={{
        padding: 20,
        background: "#121212",
        color: "#fff",
        borderRadius: 10,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h2>
          {coinName} Chart - {interval}
        </h2>
        <div
          style={{
            fontSize: 18,
            fontWeight: "bold",
            color: currentPrice ? "#00e676" : "#aaa",
            background: "#222",
            padding: "6px 12px",
            borderRadius: 6,
          }}
        >
          {currentPrice ? `$${currentPrice.toFixed(4)}` : "Loading..."}
        </div>
      </div>

      <select
        value={interval}
        onChange={(e) => setInterval(e.target.value)}
        style={{ marginBottom: 10, padding: "6px 12px", borderRadius: 4 }}
      >
        {Object.keys(intervalToSeconds).map((i) => (
          <option key={i} value={i}>
            {i}
          </option>
        ))}
      </select>

      <div style={{ position: "relative" }}>
        <div ref={chartContainerRef} style={{ width: "100%", height: 400 }} />
        <div
          id="candle-countdown"
          style={{
            position: "absolute",
            transform: "translate(-50%, -50%)",
            color: "#fff",
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
