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
        time: bucket,
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
    const loadInitial = async () => {
      try {
        const res = await axios.get(
          `${BACKEND_URL}/api/coins/candles/${coinName}/${interval}`
        );
        setCandles(res.data);
      } catch (err) {
        console.error("Failed to fetch candles:", err);
      }
    };
    loadInitial();
  }, [coinName, interval]);

  useEffect(() => {
    if (!seriesRef.current || !candles.length) return;
    const data = groupCandles(candles, interval);
    seriesRef.current.setData(data);
  }, [candles, interval]);

  useEffect(() => {
    socket.on(`price:${coinName}`, ({ price }) => {
      setCurrentPrice(price);
      setCandles((prev) => {
        if (!prev.length) return prev;
        const updated = [...prev];
        const last = { ...updated.at(-1) };

        // Only update high/low for realism
        last.high = Math.max(last.high, price);
        last.low = Math.min(last.low, price);

        // 👇 Just for visual oscillation (not saved in state)
        if (seriesRef.current) {
          const ts = Math.floor(new Date(last.time).getTime() / 1000);
          seriesRef.current.update({
            time: ts,
            open: last.open,
            high: last.high,
            low: last.low,
            close: price, // 👈 Show visual tick as close temporarily
          });
        }

        updated[updated.length - 1] = last;
        return updated;
      });
    });

    socket.on(`price:${coinName}`, ({ price }) => {
      setCurrentPrice(price);
      setCandles((prev) => {
        if (!prev.length) return prev;
        const updated = [...prev];
        const last = { ...updated.at(-1) };

        // Only update wick, NOT close
        last.high = Math.max(last.high, price);
        last.low = Math.min(last.low, price);

        updated[updated.length - 1] = last;

        if (seriesRef.current) {
          const ts = Math.floor(new Date(last.time).getTime() / 1000);
          seriesRef.current.update({
            time: ts,
            open: last.open,
            high: last.high,
            low: last.low,
            close: last.close, // preserve close from trend-based generation
          });
        }

        return updated;
      });
    });

    return () => {
      socket.off(`candle:${coinName}`);
      socket.off(`price:${coinName}`);
    };
  }, [coinName]);

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
