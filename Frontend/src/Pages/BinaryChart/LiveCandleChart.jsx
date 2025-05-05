import React, { useEffect, useState, useRef } from "react";
import ReactApexChart from "react-apexcharts";
import axios from "axios";

const CANDLE_DURATIONS = [
  { label: "30 seconds", value: 30000 },
  { label: "1 minute", value: 60000 },
  { label: "2 minutes", value: 120000 },
  { label: "3 minutes", value: 180000 },
  { label: "5 minutes", value: 300000 },
];

const generateInitialData = (
  count = 30,
  base = 100,
  duration = 30000,
  trend = "Normal",
  scenarioCounterRef = { current: 0 }
) => {
  const data = [];
  let lastClose = base;
  const now = Date.now();

  for (let i = 0; i < count; i++) {
    const time = new Date(now - (count - i) * duration).getTime();
    const [open, high, low, close] = generateCandle(
      lastClose,
      trend,
      scenarioCounterRef
    );
    data.push({ x: time, y: [open, high, low, close] });
    lastClose = close;
  }

  return data;
};

const generateCandle = (
  lastClose,
  trend = "Normal",
  scenarioCounterRef = { current: 0 }
) => {
  console.log("Generating candle for trend:", trend); // Debugging log
  const open = lastClose;
  let close = open;
  let high = open;
  let low = open;

  switch (trend) {
    case "Scenario1":
      scenarioCounterRef.current = (scenarioCounterRef.current + 1) % 4;
      close = open + (scenarioCounterRef.current === 3 ? -5 : 5); // Strong movement
      break;

    case "Scenario2":
      scenarioCounterRef.current = (scenarioCounterRef.current + 1) % 10;
      close = open + (scenarioCounterRef.current < 5 ? -5 : 5); // Alternating blocks
      break;

    case "Scenario3":
      scenarioCounterRef.current++;
      close = open + (scenarioCounterRef.current % 2 === 0 ? 5 : -5); // Alternating bars
      break;

    case "Scenario4":
      close = open + 6; // Consistently strong uptrend
      break;

    case "Scenario5":
      close = open - 6; // Consistently strong downtrend
      break;

    case "Up":
      close = open + Math.random() * 2 + 1; // Slightly biased upward
      break;

    case "Down":
      close = open - Math.random() * 2 - 1; // Slightly biased downward
      break;

    default:
      close = open + (Math.random() - 0.5) * 4; // Random
      break;
  }

  high = Math.max(open, close) + Math.random();
  low = Math.min(open, close) - Math.random();

  return [open, high, low, close];
};

const LiveCandleChart = ({ coinName }) => {
  const [series, setSeries] = useState([{ data: generateInitialData() }]);
  const [candleDuration, setCandleDuration] = useState(
    CANDLE_DURATIONS[0].value
  );
  const [trend, setTrend] = useState("Normal");
  const [popupMessage, setPopupMessage] = useState(""); // State for popup message
  const [showPopup, setShowPopup] = useState(false); // State to control popup visibility

  const scenarioCounterRef = useRef(0);
  const updateIntervalRef = useRef(null);
  const trendFetchIntervalRef = useRef(null);

  const handleCandleDurationChange = (duration) => {
    setCandleDuration(duration);
    setSeries([
      {
        data: generateInitialData(30, 100, duration, trend, scenarioCounterRef),
      },
    ]);
  };

  // Reset scenario counter on trend change
  useEffect(() => {
    scenarioCounterRef.current = 0;
  }, [trend]);

  // Fetch trend from backend
  useEffect(() => {
    const fetchTrend = async () => {
      try {
        const response = await axios.get(
          "http://localhost:5000/api/admin/trend"
        );
        console.log("Fetched trend:", response.data); // Debugging log
        const newTrend = response.data.trend;

        if (newTrend !== trend) {
          setTrend(newTrend); // Update the trend state
          setPopupMessage(`Trend changed to: ${newTrend}`); // Set popup message
          setShowPopup(true); // Show the popup
          setTimeout(() => setShowPopup(false), 3000); // Hide popup after 3 seconds
        }
      } catch (err) {
        console.error("Error fetching trend:", err);
      }
    };

    fetchTrend(); // Initial fetch
    trendFetchIntervalRef.current = setInterval(fetchTrend, 3000); // Fetch trend every 3 seconds

    return () => clearInterval(trendFetchIntervalRef.current);
  }, [trend]);

  // Update candles based on current trend and duration
  useEffect(() => {
    const updateCandles = () => {
      setSeries((prevSeries) => {
        const oldData = [...prevSeries[0].data];
        const lastCandle = oldData[oldData.length - 1];
        const now = new Date().getTime();

        if (now - lastCandle.x >= candleDuration) {
          // Create new candle
          const [open, high, low, close] = generateCandle(
            lastCandle.y[3],
            trend,
            scenarioCounterRef
          );
          oldData.push({ x: now, y: [open, high, low, close] });

          // Keep last 50 candles
          if (oldData.length > 50) oldData.shift();
        } else {
          // Update current active candle (price fluctuations)
          const updatedCandle = { ...lastCandle };
          const newClose = updatedCandle.y[3] + (Math.random() - 0.5) * 1.5;
          updatedCandle.y[1] = Math.max(updatedCandle.y[1], newClose); // High
          updatedCandle.y[2] = Math.min(updatedCandle.y[2], newClose); // Low
          updatedCandle.y[3] = newClose; // Close
          oldData[oldData.length - 1] = updatedCandle;
        }

        return [{ data: oldData }];
      });
    };

    updateIntervalRef.current = setInterval(updateCandles, 1000); // Update every second

    return () => clearInterval(updateIntervalRef.current);
  }, [candleDuration, trend]);

  const options = {
    chart: {
      type: "candlestick",
      height: 600,
      animations: {
        enabled: true,
        easing: "linear",
        dynamicAnimation: { speed: 300 },
      },
      toolbar: {
        show: true,
      },
      zoom: {
        enabled: true,
        type: "x",
        autoScaleYaxis: true,
      },
    },
    title: {
      text: `${coinName} Chart - Mode: ${trend}`,
      align: "left",
    },
    xaxis: {
      type: "datetime",
    },
    yaxis: {
      tooltip: {
        enabled: true,
      },
    },
    tooltip: {
      enabled: true,
    },
  };

  return (
    <div id="chart">
      {/* Popup for trend change */}
      {showPopup && (
        <div
          style={{
            position: "fixed",
            top: "20px",
            right: "20px",
            backgroundColor: "#007BFF",
            color: "#fff",
            padding: "10px 20px",
            borderRadius: "5px",
            boxShadow: "0 2px 5px rgba(0, 0, 0, 0.2)",
            zIndex: 1000,
          }}
        >
          {popupMessage}
        </div>
      )}

      <div style={{ marginBottom: "20px" }}>
        <label>
          Select Candle Duration:{" "}
          <select
            value={candleDuration}
            onChange={(e) => handleCandleDurationChange(Number(e.target.value))}
            style={{
              padding: "5px 10px",
              border: "1px solid #ccc",
              borderRadius: "5px",
              backgroundColor: "#f9f9f9",
              cursor: "pointer",
            }}
          >
            {CANDLE_DURATIONS.map((duration) => (
              <option key={duration.value} value={duration.value}>
                {duration.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <ReactApexChart
        options={options}
        series={series}
        type="candlestick"
        height={600}
      />
    </div>
  );
};

export default LiveCandleChart;
