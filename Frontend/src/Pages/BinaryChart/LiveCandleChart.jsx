import React, { useRef, useEffect, useState } from "react";
import { createChart, CandlestickSeries } from "lightweight-charts";
import axios from "axios";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export default function LiveCandleChart({ coinName, price }) {
  const chartContainerRef = useRef();
  const chartRef = useRef(null);
  const candleSeriesRef = useRef(null);
  const [intervalSeconds, setIntervalSeconds] = useState(30);
  const [rawData, setRawData] = useState([]);
  const [trend, setTrend] = useState("Random");
  const scenarioCounterRef = useRef(0);
  const fluctuationCounterRef = useRef(0);
  const oscillationPhaseRef = useRef(0);

  useEffect(() => {
    if (isNaN(parseFloat(price))) {
      console.error("Invalid price prop:", price);
    }
  }, [price]);
  const fetchTrend = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/admin/trend`);
      const newTrend = response.data.trend;
      if (newTrend !== trend) {
        scenarioCounterRef.current = 0;
        fluctuationCounterRef.current = 0; // Reset fluctuation counter
        oscillationPhaseRef.current = 0; // Reset oscillation phase
        setTrend(newTrend);
        console.log("Trend changed:", newTrend);
      }
    } catch (err) {
      console.error("Error fetching trend:", err);
    }
  };

  useEffect(() => {
    const trendInterval = setInterval(fetchTrend, 5000); // Check every 5s
    return () => clearInterval(trendInterval);
  }, [trend]);

  // Start with 0 data on coin change
  useEffect(() => {
    if (!price) return;
    const startTime = Math.floor(Date.now() / 1000);
    setRawData([{ time: startTime, price: parseFloat(price) }]);
  }, [coinName]);

  // Simulate live 1s feed with trend logic
  useEffect(() => {
    if (!rawData.length) return;

    const interval = setInterval(() => {
      setRawData((prevData) => {
        const last = prevData[prevData.length - 1];
        const open = last.price;
        let close;

        // Apply trend logic
        switch (trend) {
          case "Scenario1":
            scenarioCounterRef.current = (scenarioCounterRef.current + 1) % 4;
            close = open + (scenarioCounterRef.current === 3 ? -3 : 3); // Reduced fluctuation
            fluctuationCounterRef.current++; // Track fluctuations
            // Small oscillations (up and down)
            if (fluctuationCounterRef.current < 5) {
              close = open + (Math.random() - 0.5) * 2; // Reduced oscillation range
            } else {
              close = open + (Math.random() * 0.5 + 0.5); // Smaller final movement
            }
            break;
          case "Scenario2":
            scenarioCounterRef.current = (scenarioCounterRef.current + 1) % 10;
            close = open + (scenarioCounterRef.current < 5 ? -3 : 3); // Reduced fluctuation
            fluctuationCounterRef.current++; // Track fluctuations
            // Small oscillations (up and down)
            if (fluctuationCounterRef.current < 5) {
              close = open + (Math.random() - 0.5) * 2; // Reduced oscillation range
            } else {
              close = open + (Math.random() * 0.5 + 0.5); // Smaller final movement
            }
            break;
          case "Scenario3":
            scenarioCounterRef.current++;
            close = open + (scenarioCounterRef.current % 2 === 0 ? 3 : -3); // Oscillations
            fluctuationCounterRef.current++; // Track fluctuations
            // Small oscillations (up and down)
            if (fluctuationCounterRef.current < 5) {
              close = open + (Math.random() - 0.5) * 2; // Reduced oscillation range
            } else {
              close = open + (Math.random() * 0.5 + 0.5); // Smaller final movement
            }
            break;
          case "Scenario4":
            close = open + 4;
            fluctuationCounterRef.current++; // Track fluctuations
            // Small oscillations (up and down)
            if (fluctuationCounterRef.current < 5) {
              close = open + (Math.random() - 0.5) * 2; // Reduced oscillation range
            } else {
              close = open + (Math.random() * 0.5 + 0.5); // Smaller final movement
            }
            break;
          case "Scenario5":
            close = open - 4;
            fluctuationCounterRef.current++; // Track fluctuations
            // Small oscillations (up and down)
            if (fluctuationCounterRef.current < 5) {
              close = open - (Math.random() - 0.5) * 2; // Reduced oscillation range
            } else {
              close = open - (Math.random() * 0.5 + 0.5); // Smaller final movement
            }
            break;
          case "Up":
            close = open + Math.random() * 1 + 0.5; // Smaller price change range
            fluctuationCounterRef.current++; // Track fluctuations
            // Oscillation logic before finalizing the trend
            if (fluctuationCounterRef.current < 5) {
              // Small oscillations (up and down)
              close = open + (Math.random() - 0.5) * 2; // Reduced oscillation range
            } else {
              // Final upward movement after oscillations
              close = open + Math.random() * 0.5 + 0.5; // Smaller final movement
            }
            break;
          case "Down":
            close = open - Math.random() * 1 - 0.5; // Smaller price change range
            fluctuationCounterRef.current++; // Track fluctuations
            // Oscillation logic before finalizing the trend
            if (fluctuationCounterRef.current < 5) {
              // Small oscillations (up and down)
              close = open - (Math.random() - 0.5) * 2; // Reduced oscillation range
            } else {
              // Final downward movement after oscillations
              close = open - Math.random() * 0.5 - 0.5; // Smaller final movement
            }
            break;
          default:
            close = open + (Math.random() - 0.5) * 4;
            break;
        }

        // After a series of fluctuations (up/down), finalize with trend
        if (fluctuationCounterRef.current >= 5) {
          if (trend === "Up") {
            close = open + 0.5; // Smaller final upward movement
          } else if (trend === "Down") {
            close = open - 0.5; // Smaller final downward movement
          }
          fluctuationCounterRef.current = 0; // Reset after finalizing
        }

        const newTime = last.time + 1;
        return [
          ...prevData,
          { time: newTime, price: parseFloat(close.toFixed(4)) },
        ];
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [trend, rawData]);

  // Create chart
  useEffect(() => {
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
    });
    chartRef.current = chart;

    const candleSeries = chart.addSeries(CandlestickSeries);
    candleSeriesRef.current = candleSeries;

    chart.timeScale().applyOptions({ rightOffset: 0, barSpacing: 10 });
    chart.timeScale().scrollToRealTime();

    new ResizeObserver(() => {
      chart.applyOptions({
        width: chartContainerRef.current.clientWidth,
        height: chartContainerRef.current.clientHeight,
      });
    }).observe(chartContainerRef.current);

    return () => chart.remove();
  }, []);

  // Aggregate raw data
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
    chartRef.current.timeScale().scrollToRealTime();
  }, [intervalSeconds, rawData]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
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
          {coinName} Interval:&nbsp;
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
