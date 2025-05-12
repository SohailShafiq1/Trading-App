import React, { useRef, useEffect, useState, useCallback } from "react";
import { createChart } from "lightweight-charts";
import axios from "axios";
import { debounce } from "lodash";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const debouncedIntervalUpdate = debounce(
  async (coinName, newInterval, lastIntervalRef, setInterval) => {
    try {
      const response = await axios.put(
        `${BACKEND_URL}/api/coins/interval/${encodeURIComponent(coinName)}`,
        { interval: newInterval },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        lastIntervalRef.current = newInterval;
        setInterval(newInterval);
      }
    } catch (err) {
      console.error("Error updating interval:", err);
    }
  },
  500
); // 500ms debounce

export default function LiveCandleChart({ coinName }) {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const candleSeriesRef = useRef(null);
  const [interval, setInterval] = useState("30s");
  const lastIntervalRef = useRef(interval); // Track the last successful interval

  const [candleData, setCandleData] = useState([]);
  const [currentPrice, setCurrentPrice] = useState(null);
  const [currentTrend, setCurrentTrend] = useState("Normal");
  const [loading, setLoading] = useState(true);

  const lastPriceRef = useRef(null);
  const lastCandleDataRef = useRef([]);
  const lastTrendRef = useRef("Normal");
  const abortControllerRef = useRef(new AbortController());

  useEffect(() => {
    return () => {
      debouncedIntervalUpdate.cancel(); // Cleanup debounce on unmount
    };
  }, []);
  const fetchInitialData = useCallback(async () => {
    if (!coinName) return;

    try {
      setLoading(true);
      abortControllerRef.current.abort();
      abortControllerRef.current = new AbortController();

      const [priceRes, candleRes, trendRes, coinRes] = await Promise.all([
        axios.get(`${BACKEND_URL}/api/coins/price/${coinName}`, {
          signal: abortControllerRef.current.signal,
        }),
        axios.get(`${BACKEND_URL}/api/coins/candles/${coinName}`, {
          params: { interval },
          signal: abortControllerRef.current.signal,
        }),
        axios.get(`${BACKEND_URL}/api/admin/trend`, {
          signal: abortControllerRef.current.signal,
        }),
        axios.get(`${BACKEND_URL}/api/coins/type/${coinName}`, {
          signal: abortControllerRef.current.signal,
        }),
      ]);

      // Set the initial interval from the coin's selectedInterval
      if (coinRes.data) {
        const coin = await axios.get(
          `${BACKEND_URL}/api/coins/name/${coinName}`
        );
        const selectedInterval = coin.data?.selectedInterval || "30s";
        setInterval(selectedInterval);
      }

      setCurrentPrice(priceRes.data?.price || priceRes.data);
      setCandleData(candleRes.data || []);
      setCurrentTrend(trendRes.data?.mode || trendRes.data?.trend || "Normal");
      lastCandleDataRef.current = candleRes.data || [];
    } catch (err) {
      if (!axios.isCancel(err)) {
        console.error("Error fetching initial data:", err);
      }
    } finally {
      setLoading(false);
    }
  }, [coinName]);

  useEffect(() => {
    fetchInitialData();
    return () => {
      abortControllerRef.current.abort();
    };
  }, [fetchInitialData]);

  useEffect(() => {
    if (!coinName) return;

    const updateInterval = async () => {
      try {
        await axios.put(`${BACKEND_URL}/api/coins/interval/${coinName}`, {
          interval: interval, // Make sure we're sending the interval value properly
        });
      } catch (err) {
        console.error("Error updating interval:", err);
      }
    };

    updateInterval();
  }, [interval, coinName]);
  useEffect(() => {
    if (!coinName || loading) return;

    const priceInterval = setInterval(async () => {
      try {
        const res = await axios.get(
          `${BACKEND_URL}/api/coins/price/${coinName}`
        );
        const newPrice = res.data?.price || res.data;

        if (newPrice !== lastPriceRef.current) {
          setCurrentPrice(newPrice);
          lastPriceRef.current = newPrice;
        }
      } catch (err) {
        console.error("Price fetch error:", err);
      }
    }, 5000);

    return () => clearInterval(priceInterval);
  }, [coinName, loading]);

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
        const newCandleData = res.data || [];

        if (
          JSON.stringify(newCandleData) !==
          JSON.stringify(lastCandleDataRef.current)
        ) {
          setCandleData(newCandleData);
          lastCandleDataRef.current = newCandleData;
        }
      } catch (err) {
        console.error("Candle fetch error:", err);
      }
    }, 10000);

    return () => clearInterval(candleInterval);
  }, [coinName, interval, loading]);

  useEffect(() => {
    if (loading) return;

    const trendInterval = setInterval(async () => {
      try {
        const res = await axios.get(`${BACKEND_URL}/api/admin/trend`);
        const newTrend = res.data?.mode || res.data?.trend || "Normal";

        if (newTrend !== lastTrendRef.current) {
          setCurrentTrend(newTrend);
          lastTrendRef.current = newTrend;
        }
      } catch (err) {
        console.error("Trend fetch error:", err);
      }
    }, 10000);

    return () => clearInterval(trendInterval);
  }, [loading]);

  useEffect(() => {
    if (loading || !chartContainerRef.current) return;

    const container = chartContainerRef.current;
    const chart = createChart(container, {
      width: container.clientWidth,
      height: container.clientHeight,
      layout: {
        backgroundColor: "#ffffff",
        textColor: "#000",
      },
      grid: {
        vertLines: { color: "#eee" },
        horzLines: { color: "#eee" },
      },
      timeScale: {
        rightOffset: 12,
        barSpacing: 10,
        fixLeftEdge: true,
        timeVisible: true,
        secondsVisible: true,
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

    const resizeObserver = new ResizeObserver((entries) => {
      const [entry] = entries;
      if (entry.target === container && chartRef.current) {
        chartRef.current.applyOptions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
      candleSeriesRef.current = null;
    };
  }, [loading]);

  useEffect(() => {
    if (!candleSeriesRef.current || !candleData?.length) return;

    const seenTimes = new Set();
    const processedData = candleData
      .map((candle) => ({
        time: Math.floor(new Date(candle.time).getTime() / 1000),
        open: parseFloat(candle.open),
        high: parseFloat(candle.high),
        low: parseFloat(candle.low),
        close: parseFloat(candle.close),
      }))
      .sort((a, b) => a.time - b.time)
      .filter((candle) => {
        if (!seenTimes.has(candle.time)) {
          seenTimes.add(candle.time);
          return true;
        }
        return false;
      });

    candleSeriesRef.current.setData(processedData);
    if (chartRef.current) {
      chartRef.current.timeScale().fitContent();
    }
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
  const handleIntervalChange = async (e) => {
    const newInterval = e.target.value;

    if (newInterval !== lastIntervalRef.current) {
      debouncedIntervalUpdate(
        coinName,
        newInterval,
        lastIntervalRef,
        setInterval
      );
    } // Don't do anything if interval hasn't changed

    if (newInterval === lastIntervalRef.current) return;

    try {
      const response = await axios.put(
        `${BACKEND_URL}/api/coins/interval/${coinName}`,
        { interval: newInterval },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        lastIntervalRef.current = newInterval; // Update last successful interval
        setInterval(newInterval);
      } else {
        console.error(
          "Server rejected interval change:",
          response.data.message
        );
        // Revert the select value to last successful interval
        e.target.value = lastIntervalRef.current;
      }
    } catch (err) {
      console.error(
        "Error updating interval:",
        err.response?.data?.message || err.message
      );
      // Revert the select value
      e.target.value = lastIntervalRef.current;
    }
  };

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
            // onChange={handleIntervalChange}
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
