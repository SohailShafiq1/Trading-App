import React, { useRef, useEffect, useState } from "react";
import { createChart, CandlestickSeries } from "lightweight-charts";

export default function LiveCandleChart() {
  const chartContainerRef = useRef();
  const chartRef = useRef(null);
  const candleSeriesRef = useRef(null);
  const [intervalSeconds, setIntervalSeconds] = useState(30);
  const [rawData, setRawData] = useState([]);

  // Generate raw 1-second data only once
  useEffect(() => {
    const data = [];
    let currentPrice = 100;
    let currentTime = Math.floor(Date.now() / 1000) - 3000;

    for (let i = 0; i < 3000; i++) {
      const changePercent = (Math.random() - 0.5) * 0.002;
      const newPrice = currentPrice * (1 + changePercent);
      const price = parseFloat(newPrice.toFixed(2));
      data.push({ time: currentTime, price });
      currentPrice = price;
      currentTime += 1;
    }

    setRawData(data);
  }, []);

  // Generate live candles
  useEffect(() => {
    const interval = setInterval(() => {
      setRawData((prevData) => {
        const lastDataPoint = prevData[prevData.length - 1];
        const changePercent = (Math.random() - 0.5) * 0.002;
        const newPrice = lastDataPoint.price * (1 + changePercent);
        const price = parseFloat(newPrice.toFixed(2));
        const newTime = lastDataPoint.time + 1;

        return [...prevData, { time: newTime, price }];
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Create chart once
  useEffect(() => {
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
    });
    chartRef.current = chart;

    const candleSeries = chart.addSeries(CandlestickSeries);
    candleSeriesRef.current = candleSeries;

    new ResizeObserver(() => {
      chart.applyOptions({
        width: chartContainerRef.current.clientWidth,
        height: chartContainerRef.current.clientHeight,
      });
    }).observe(chartContainerRef.current);

    return () => chart.remove();
  }, []);

  // Aggregate raw data into candles based on selected interval
  useEffect(() => {
    if (!rawData.length || !candleSeriesRef.current) return;

    const interval = intervalSeconds;
    const grouped = [];

    for (let i = 0; i < rawData.length; i += interval) {
      const chunk = rawData.slice(i, i + interval);
      if (chunk.length === 0) continue;

      const open = chunk[0].price;
      const close = chunk[chunk.length - 1].price;
      const high = Math.max(...chunk.map((p) => p.price));
      const low = Math.min(...chunk.map((p) => p.price));
      const time = chunk[0].time;

      grouped.push({ time, open, high, low, close });
    }

    candleSeriesRef.current.setData(grouped);
  }, [intervalSeconds, rawData]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {/* Interval selector UI */}
      <div
        style={{
          position: "absolute",
          top: "10px",
          left: "10px",
          zIndex: 1,
          background: "#fff",
          padding: "6px 10px",
          borderRadius: "6px",
          boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
        }}
      >
        <label>
          Interval:&nbsp;
          <select
            value={intervalSeconds}
            onChange={(e) => setIntervalSeconds(Number(e.target.value))}
          >
            <option value={30}>30s</option>
            <option value={60}>1m</option>
            <option value={120}>2m</option>
            <option value={180}>3m</option>
            <option value={300}>5m</option>
          </select>
        </label>
      </div>

      {/* Chart container */}
      <div
        ref={chartContainerRef}
        style={{
          width: "100%",
          height: "100%",
          position: "absolute",
          top: "50px",
        }}
      />
    </div>
  );
}
