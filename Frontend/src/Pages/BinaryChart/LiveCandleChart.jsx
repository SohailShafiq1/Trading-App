import React, { useEffect, useState, useRef } from "react";
import ReactApexChart from "react-apexcharts";
import axios from "axios";
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const CANDLE_DURATIONS = [
  { label: "30s", value: 30000 },
  { label: "1m", value: 60000 },
  { label: "2m", value: 120000 },
  { label: "5m", value: 300000 },
];

const LiveCandleChart = ({ coinName }) => {
  const [series, setSeries] = useState([{ data: [] }]);
  const [duration, setDuration] = useState(30000);
  const [trend, setTrend] = useState("Normal");
  const wsRef = useRef(null);

  // Initialize WebSocket and fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const response = await axios.get(
          `${BACKEND_URL}/api/chart/${coinName}`
        );
        const { candles, currentTrend, currentDuration } = response.data;

        setSeries([{ data: candles }]);
        setDuration(currentDuration);
        setTrend(currentTrend);
      } catch (err) {
        console.error("Failed to load chart:", err);
      }
    };

    const setupWebSocket = () => {
      wsRef.current = new WebSocket(`wss://yourbackend.com/ws`);

      wsRef.current.onmessage = (e) => {
        const data = JSON.parse(e.data);
        if (data.coinName === coinName) {
          setSeries((prev) => {
            const newData = [...prev[0].data, data.candle];
            return [{ data: newData.slice(-100) }]; // Keep last 100 candles
          });
        }
      };
    };

    fetchInitialData();
    setupWebSocket();

    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, [coinName]);

  const handleDurationChange = async (newDuration) => {
    try {
      await axios.post("/api/chart/duration", {
        coinName,
        duration: newDuration,
      });
      setDuration(newDuration);
    } catch (err) {
      console.error("Failed to update duration:", err);
    }
  };

  const chartOptions = {
    chart: { type: "candlestick", height: 500 },
    title: { text: `${coinName} - ${trend} Trend` },
    xaxis: { type: "datetime" },
  };

  return (
    <div className="candle-chart">
      <div className="controls">
        <select
          value={duration}
          onChange={(e) => handleDurationChange(Number(e.target.value))}
        >
          {CANDLE_DURATIONS.map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))}
        </select>
      </div>

      <ReactApexChart
        options={chartOptions}
        series={series}
        type="candlestick"
        height={500}
      />
    </div>
  );
};

export default LiveCandleChart;
