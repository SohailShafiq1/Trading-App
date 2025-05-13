import React, { useRef, useEffect, useState, useCallback } from "react";
import { createChart } from "lightweight-charts";
import axios from "axios";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export default function LiveCandleChart({ coinName }) {
  // Refs
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const candleSeriesRef = useRef(null);

  // State
  const [interval, setInterval] = useState("30s");
  const [candleData, setCandleData] = useState([]);
  const [currentPrice, setCurrentPrice] = useState(null);
  const [currentTrend, setCurrentTrend] = useState("Normal");
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState("disconnected");

  // Previous values refs
  const lastPriceRef = useRef(null);
  const lastCandleDataRef = useRef([]);
  const lastTrendRef = useRef("Normal");
  const abortControllerRef = useRef(new AbortController());

  // WebSocket refs
  const priceWsRef = useRef(null);
  const candleWsRef = useRef(null);
  const trendWsRef = useRef(null);

  // Initialize chart
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
        vertLines: { visible: false },
        horzLines: { color: "#f0f3fa" },
      },
      timeScale: {
        rightOffset: 12,
        barSpacing: 8,
        minBarSpacing: 4,
        fixLeftEdge: true,
        timeVisible: true,
        secondsVisible: true,
        borderVisible: false,
      },
      rightPriceScale: {
        borderVisible: false,
      },
    });

    chartRef.current = chart;

    const candleSeries = chart.addCandlestickSeries({
      upColor: "#26a69a",
      downColor: "#ef5350",
      borderUpColor: "#26a69a",
      borderDownColor: "#ef5350",
      wickUpColor: "#26a69a",
      wickDownColor: "#ef5350",
      priceScaleId: "right",
      priceLineVisible: false,
    });
    candleSeriesRef.current = candleSeries;

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

  // Process candle data to ensure no duplicate timestamps
  const processCandleData = (data) => {
    return data
      .map((candle) => ({
        time: Math.floor(new Date(candle.time).getTime() / 1000),
        open: parseFloat(candle.open),
        high: parseFloat(candle.high),
        low: parseFloat(candle.low),
        close: parseFloat(candle.close),
      }))
      .filter(
        (candle, index, self) =>
          index === self.findIndex((c) => c.time === candle.time)
      )
      .sort((a, b) => a.time - b.time);
  };

  // Update chart data
  useEffect(() => {
    if (!candleSeriesRef.current || !candleData?.length) return;

    const processedData = processCandleData(candleData);

    if (
      lastCandleDataRef.current.length === 0 ||
      JSON.stringify(candleData) !== JSON.stringify(lastCandleDataRef.current)
    ) {
      candleSeriesRef.current.setData(processedData);
      lastCandleDataRef.current = candleData;
      chartRef.current.timeScale().fitContent();
    } else if (processedData.length > 0) {
      const lastCandle = processedData[processedData.length - 1];
      candleSeriesRef.current.update(lastCandle);
    }
  }, [candleData]);

  // WebSocket connection helper
  const connectWebSocket = (type, onMessage, params = {}) => {
    const wsUrl = `ws://${window.location.hostname}:5000`;
    let url = `${wsUrl}/${type}/${coinName}`;
    if (params.interval) url += `/${params.interval}`;

    const ws = new WebSocket(url);

    ws.onopen = () => {
      console.log(`${type} WebSocket connected`);
      setConnectionStatus("connected");
    };

    ws.onmessage = onMessage;

    ws.onerror = (error) => {
      console.error(`${type} WebSocket error:`, error);
      setConnectionStatus("error");
    };

    ws.onclose = () => {
      console.log(`${type} WebSocket disconnected`);
      setConnectionStatus("disconnected");
      if (!params.noRetry) {
        setTimeout(() => connectWebSocket(type, onMessage, params), 3000);
      }
    };

    return ws;
  };

  // Fetch initial data
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
        axios.get(`${BACKEND_URL}/api/coins/name/${coinName}`, {
          signal: abortControllerRef.current.signal,
        }),
      ]);

      setCurrentPrice(priceRes.data?.price || priceRes.data);
      setCandleData(candleRes.data || []);
      setCurrentTrend(trendRes.data?.mode || trendRes.data?.trend || "Normal");
      lastCandleDataRef.current = candleRes.data || [];

      if (coinRes.data?.selectedInterval) {
        setInterval(coinRes.data.selectedInterval);
      }
    } catch (err) {
      if (!axios.isCancel(err)) {
        console.error("Error fetching initial data:", err);
      }
    } finally {
      setLoading(false);
    }
  }, [coinName, interval]);

  useEffect(() => {
    fetchInitialData();
    return () => {
      abortControllerRef.current.abort();
    };
  }, [fetchInitialData]);

  // Price WebSocket
  useEffect(() => {
    if (!coinName || loading) return;

    priceWsRef.current = connectWebSocket(
      "price",
      (event) => {
        const newPrice = parseFloat(event.data);
        if (newPrice !== lastPriceRef.current) {
          setCurrentPrice(newPrice);
          lastPriceRef.current = newPrice;
        }
      },
      { noRetry: false }
    );

    return () => {
      if (priceWsRef.current) {
        priceWsRef.current.close();
      }
    };
  }, [coinName, loading]);

  // Candles WebSocket - Fixed version with duplicate prevention
  useEffect(() => {
    if (!coinName || loading) return;

    candleWsRef.current = connectWebSocket(
      "candles",
      (event) => {
        const newCandles = JSON.parse(event.data);

        setCandleData((prevData) => {
          if (newCandles.length > 0) {
            const newCandle = newCandles[0];
            const newTime = Math.floor(
              new Date(newCandle.time).getTime() / 1000
            );

            // First filter out any existing candle with the same time
            const filteredData = prevData.filter(
              (c) => Math.floor(new Date(c.time).getTime() / 1000) !== newTime
            );

            // Ensure continuity with previous candle
            if (filteredData.length > 0) {
              const lastCandle = filteredData[filteredData.length - 1];
              newCandle.open = lastCandle.close;
            }

            return [...filteredData, newCandle].sort(
              (a, b) => new Date(a.time) - new Date(b.time)
            );
          }
          return prevData;
        });
      },
      { interval, noRetry: false }
    );

    return () => {
      if (candleWsRef.current) {
        candleWsRef.current.close();
      }
    };
  }, [coinName, interval, loading]);

  // Trend WebSocket
  useEffect(() => {
    if (loading) return;

    trendWsRef.current = connectWebSocket(
      "trend",
      (event) => {
        const newTrend = event.data;
        if (newTrend !== lastTrendRef.current) {
          setCurrentTrend(newTrend);
          lastTrendRef.current = newTrend;
        }
      },
      { noRetry: false }
    );

    return () => {
      if (trendWsRef.current) {
        trendWsRef.current.close();
      }
    };
  }, [loading]);

  const handleIntervalChange = async (e) => {
    const newInterval = e.target.value;
    if (newInterval === interval) return;

    try {
      const response = await axios.put(
        `${BACKEND_URL}/api/coins/interval/${coinName}`,
        { interval: newInterval }
      );

      if (response.data.success) {
        setInterval(newInterval);
      }
    } catch (err) {
      console.error("Error updating interval:", err);
    }
  };

  if (loading) {
    return <div className="loading-container">Loading chart data...</div>;
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
        <div className="connection-status">Status: {connectionStatus}</div>
        <label>
          Interval:&nbsp;
          <select
            value={interval}
            onChange={handleIntervalChange}
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
