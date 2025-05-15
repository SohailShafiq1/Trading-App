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
    .sort((a, b) => new Date(a.time) - new Date(b.time));

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

  const [interval, setInterval] = useState("30s");
  const [candles, setCandles] = useState([]);
  const [currentPrice, setCurrentPrice] = useState(null);
  const [liveCandle, setLiveCandle] = useState(null);
  const [renderKey, setRenderKey] = useState(0); // forces redraw

  const trendRef = useRef("Random");

  useEffect(() => {
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: "#121212" },
        textColor: "#d1d4dc",
      },
      grid: {
        vertLines: { color: "#444" },
        horzLines: { color: "#444" },
      },
      timeScale: {
        borderColor: "#888",
        timeVisible: true,
        secondsVisible: true,
      },
      priceScale: {
        borderColor: "#888",
      },
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

        if (historical.length) {
          const last = historical[historical.length - 1];
          trendRef.current =
            last.close > last.open
              ? "Up"
              : last.close < last.open
              ? "Down"
              : "Random";

          const ts = Math.floor(Date.now() / 1000);
          const bucket =
            Math.floor(ts / intervalToSeconds[interval]) *
            intervalToSeconds[interval];

          setLiveCandle({
            time: Number(bucket),
            open: last.close,
            high: last.close,
            low: last.close,
            close: last.close,
          });
        }
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

      const last = updated[updated.length - 1];
      const liveTime = Number(liveCandle.time);

      if (last && Number(last.time) === liveTime) {
        last.high = Math.max(last.high, liveCandle.high);
        last.low = Math.min(last.low, liveCandle.low);
        last.close = liveCandle.close;
      } else if (!last || liveTime > Number(last.time)) {
        updated.push({ ...liveCandle, time: liveTime });
      }

      seriesRef.current?.setData(updated.slice(-200));
    });

    return () => cancelAnimationFrame(frame);
  }, [candles, liveCandle, interval, renderKey]); // <-- trigger redraw on key change

  useEffect(() => {
    const handlePrice = ({ price }) => {
      setCurrentPrice(price);

      setLiveCandle((prev) => {
        if (!prev) return null;

        let constrained = price;
        if (trendRef.current === "Up") constrained = Math.max(prev.open, price);
        else if (trendRef.current === "Down")
          constrained = Math.min(prev.open, price);

        const updated = {
          ...prev,
          high: Math.max(prev.high, constrained),
          low: Math.min(prev.low, constrained),
          close: constrained,
        };

        // force rerender even if values are close
        setRenderKey((k) => k + 1);
        return updated;
      });
    };

    const handleCandle = (candle) => {
      trendRef.current =
        candle.close > candle.open
          ? "Up"
          : candle.close < candle.open
          ? "Down"
          : "Random";

      setCandles((prev) => [...prev.slice(-999), candle]);

      const ts = Math.floor(Date.now() / 1000);
      const bucket =
        Math.floor(ts / intervalToSeconds[interval]) *
        intervalToSeconds[interval];

      setLiveCandle({
        time: Number(bucket),
        open: candle.close,
        high: candle.close,
        low: candle.close,
        close: candle.close,
      });

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
        {["30s", "1m", "2m", "3m", "5m"].map((i) => (
          <option key={i} value={i}>
            {i}
          </option>
        ))}
      </select>

      <div ref={chartContainerRef} style={{ width: "100%", height: 400 }} />
    </div>
  );
};

export default LiveCandleChart;
