import React, { useRef, useEffect, useState } from "react";
import { createChart } from "lightweight-charts";
import axios from "axios";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export default function LiveCandleChart({ coinName }) {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const candleSeriesRef = useRef(null);
  const [interval, setInterval] = useState("30s");
  const [candleData, setCandleData] = useState([]);
  const [currentPrice, setCurrentPrice] = useState(null);
  const [currentTrend, setCurrentTrend] = useState("Normal");
  const [loading, setLoading] = useState(true);

  const lastPriceRef = useRef(null);
  const lastCandleDataRef = useRef([]);
  const lastTrendRef = useRef("Normal");

  // Fetch initial data only once when chart is ready
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const [priceRes, candleRes, trendRes] = await Promise.all([
          axios.get(`${BACKEND_URL}/api/coins/price/${coinName}`),
          axios.get(`${BACKEND_URL}/api/coins/candles/${coinName}`, {
            params: { interval },
          }),
          axios.get(`${BACKEND_URL}/api/admin/trend`),
        ]);

        setCurrentPrice(priceRes.data);
        setCandleData(candleRes.data);
        setCurrentTrend(trendRes.data.mode || trendRes.data.trend || "Normal");
      } catch (err) {
        console.error("Error fetching initial data:", err);
      } finally {
        setLoading(false);
      }
    };

    if (coinName) fetchInitialData();
  }, [coinName, interval]);

  // Poll for price updates with a controlled interval (every 5 seconds)
  useEffect(() => {
    if (!coinName || loading) return;

    const priceInterval = setInterval(async () => {
      try {
        const res = await axios.get(
          `${BACKEND_URL}/api/coins/price/${coinName}`
        );
        const newPrice = res.data;

        // Check if price has changed
        if (newPrice !== lastPriceRef.current) {
          setCurrentPrice(newPrice);
          lastPriceRef.current = newPrice;
        }
      } catch (err) {
        console.error("Price fetch error:", err);
      }
    }, 5000); // Update price every 5 seconds

    return () => {
      clearInterval(priceInterval);
    };
  }, [coinName]);

  // Poll for candle data updates (every 10 seconds)
  useEffect(() => {
    if (!coinName || loading) return;

    const candleInterval = setInterval(async () => {
      try {
        const res = await axios.get(
          `${BACKEND_URL}/api/coins/candles/${coinName}`,
          {
            params: { interval },
          }
        );
        const newCandleData = res.data;

        // Only update if the candle data has changed
        if (
          JSON.stringify(newCandleData) !==
          JSON.stringify(lastCandleDataRef.current)
        ) {
          setCandleData(newCandleData);
          lastCandleDataRef.current = newCandleData; // Store the last fetched candle data
        }
      } catch (err) {
        console.error("Candle fetch error:", err);
      }
    }, 10000); // Update candles every 10 seconds

    return () => {
      clearInterval(candleInterval);
    };
  }, [coinName, interval]);

  // Poll for trend updates (every 10 seconds)
  useEffect(() => {
    if (loading) return;

    const trendInterval = setInterval(async () => {
      try {
        const res = await axios.get(`${BACKEND_URL}/api/admin/trend`);
        const newTrend = res.data.mode || res.data.trend || "Normal";
        // Check if trend has changed
        if (newTrend !== lastTrendRef.current) {
          setCurrentTrend(newTrend);
          lastTrendRef.current = newTrend;
        }
      } catch (err) {
        console.error("Trend fetch error:", err);
      }
    }, 10000); // Update trend every 10 seconds

    return () => {
      clearInterval(trendInterval);
    };
  }, []);

  // Create the chart and add series (only once)
  useEffect(() => {
    if (loading || !chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
      layout: {
        backgroundColor: "#ffffff",
        textColor: "#000",
      },
      grid: {
        vertLines: { color: "#eee" },
        horzLines: { color: "#eee" },
      },
    });
    chartRef.current = chart;

    const series = chart.addCandlestickSeries({
      upColor: "#26a69a",
      downColor: "#ef5350",
      borderVisible: false,
      wickUpColor: "#26a69a",
      wickDownColor: "#ef5350",
    });
    candleSeriesRef.current = series;

    chart.timeScale().applyOptions({ rightOffset: 0, barSpacing: 10 });
    chart.timeScale().scrollToRealTime();

    const resizeObserver = new ResizeObserver(() => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
    });
    resizeObserver.observe(chartContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
    };
  }, [loading]);

  // Update chart data when candleData changes
  useEffect(() => {
    if (!candleSeriesRef.current || candleData.length === 0) return;

    // Sort the data by time in ascending order
    const sortedData = [];
    const seenTimes = new Set();

    candleData
      .map((candle) => ({
        time: Math.floor(new Date(candle.time).getTime() / 1000),
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
      }))
      .sort((a, b) => a.time - b.time)
      .forEach((candle) => {
        if (!seenTimes.has(candle.time)) {
          sortedData.push(candle);
          seenTimes.add(candle.time);
        }
      });
    candleSeriesRef.current.setData(sortedData);
    chartRef.current.timeScale().scrollToRealTime();
  }, [candleData]);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
        }}
      >
        Loading chart data...
      </div>
    );
  }

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <div
        style={{
          position: "absolute",
          top: "10px",
          left: "10px",
          zIndex: 1,
          background: "rgba(255, 255, 255, 0.9)",
          padding: "8px 12px",
          borderRadius: "6px",
          boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
          display: "flex",
          gap: "20px",
          alignItems: "center",
        }}
      >
        <label>
          Interval:&nbsp;
          <select
            value={interval}
            onChange={(e) => setInterval(e.target.value)}
            style={{ padding: "4px 8px" }}
          >
            <option value="30s">30s</option>
            <option value="1m">1m</option>
            <option value="2m">2m</option>
            <option value="3m">3m</option>
            <option value="5m">5m</option>
          </select>
        </label>
        <div>
          <strong>{coinName}:</strong> ${currentPrice?.toFixed(4) || "N/A"}
        </div>
        <div>
          <strong>Trend:</strong> {currentTrend}
        </div>
      </div>

      <div
        ref={chartContainerRef}
        style={{
          position: "absolute",
          top: "50px",
          width: "100%",
          height: "calc(100% - 50px)",
        }}
      />
    </div>
  );
}
