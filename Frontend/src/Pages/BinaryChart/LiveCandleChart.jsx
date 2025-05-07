import React, { useEffect, useState, useRef } from "react";
import ReactApexChart from "react-apexcharts";
import axios from "axios";
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const CANDLE_DURATIONS = [
  { label: "30 seconds", value: 30000 },
  { label: "1 minute", value: 60000 },
  { label: "2 minutes", value: 120000 },
  { label: "3 minutes", value: 180000 },
  { label: "5 minutes", value: 300000 },
];

const generateCandle = (
  lastClose,
  trend = "Normal",
  scenarioCounterRef = { current: 0 }
) => {
  const open = lastClose;
  let close = open;
  let high = open;
  let low = open;

  switch (trend) {
    case "Scenario1":
      scenarioCounterRef.current = (scenarioCounterRef.current + 1) % 4;
      close = open + (scenarioCounterRef.current === 3 ? -5 : 5);
      break;

    case "Scenario2":
      scenarioCounterRef.current = (scenarioCounterRef.current + 1) % 10;
      close = open + (scenarioCounterRef.current < 5 ? -5 : 5);
      break;

    case "Scenario3":
      scenarioCounterRef.current++;
      close = open + (scenarioCounterRef.current % 2 === 0 ? 5 : -5);
      break;

    case "Scenario4":
      close = open + 6;
      break;

    case "Scenario5":
      close = open - 6;
      break;

    case "Up":
      close = open + Math.random() * 2 + 1;
      break;

    case "Down":
      close = open - Math.random() * 2 - 1;
      break;

    default:
      close = open + (Math.random() - 0.5) * 4;
      break;
  }

  high = Math.max(open, close) + Math.random();
  low = Math.min(open, close) - Math.random();

  return [open, high, low, close];
};

const LiveCandleChart = ({ coinName }) => {
  const [series, setSeries] = useState([]);
  const [candleDuration, setCandleDuration] = useState(
    CANDLE_DURATIONS[0].value
  );
  const [trend, setTrend] = useState("Normal");
  const [popupMessage, setPopupMessage] = useState("");
  const [showPopup, setShowPopup] = useState(false);

  const scenarioCounterRef = useRef(0);
  const updateIntervalRef = useRef(null);
  const trendFetchIntervalRef = useRef(null);

  const handleCandleDurationChange = (duration) => {
    setCandleDuration(duration);
  };

  useEffect(() => {
    const loadChartFromDB = async () => {
      try {
        const response = await axios.get(
          `${BACKEND_URL}/api/chart/${coinName}`
        );
        const data = response.data;

        const { candles, duration, trend: savedTrend } = data;

        if (Array.isArray(candles) && candles.length > 0) {
          setSeries([{ data: candles }]);
          setCandleDuration(duration || CANDLE_DURATIONS[0].value); // ⏱ restore duration
          setTrend(savedTrend || "Normal"); // 📈 restore trend
          return;
        }

        throw new Error("No candle data, fallback to first candle");
      } catch (err) {
        console.warn("Chart not found or empty, generating first candle...");

        const now = Date.now();
        const [open, high, low, close] = generateCandle(
          100,
          trend,
          scenarioCounterRef
        );
        const firstCandle = [{ x: now, y: [open, high, low, close] }];
        setSeries([{ data: firstCandle }]);

        try {
          await axios.post(`${BACKEND_URL}/api/chart/save`, {
            coinName,
            chartData: firstCandle,
            trend,
            duration: candleDuration,
          });
        } catch (saveErr) {
          console.error("Failed to save chart data:", saveErr);
        }
      }
    };

    loadChartFromDB();
  }, [coinName]);

  useEffect(() => {
    scenarioCounterRef.current = 0;
  }, [trend]);

  useEffect(() => {
    const fetchTrend = async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/admin/trend`);
        const newTrend = response.data.trend;

        if (newTrend !== trend) {
          scenarioCounterRef.current = 0;
          setTrend(newTrend);
          setPopupMessage(`Trend changed to: ${newTrend}`);
          setShowPopup(true);
          setTimeout(() => setShowPopup(false), 3000);
        }
      } catch (err) {
        console.error("Error fetching trend:", err);
      }
    };

    fetchTrend();
    trendFetchIntervalRef.current = setInterval(fetchTrend, 3000);

    return () => clearInterval(trendFetchIntervalRef.current);
  }, [trend]);
  const saveChartDataToBackend = async (chartData) => {
    try {
      await axios.post(`${BACKEND_URL}/api/chart/save`, {
        coinName,
        chartData,
        trend,
        duration: candleDuration,
      });
    } catch (error) {
      console.error("Failed to save chart data:", error);
    }
  };

  useEffect(() => {
    const updateCandles = () => {
      setSeries((prevSeries) => {
        const oldData = [...prevSeries[0].data];
        const lastCandle = oldData[oldData.length - 1];
        const now = new Date().getTime();

        if (now - lastCandle.x >= candleDuration) {
          const newTimestamp = lastCandle.x + candleDuration;
          const [open, high, low, close] = generateCandle(
            lastCandle.y[3],
            trend,
            scenarioCounterRef
          );
          const newCandle = { x: newTimestamp, y: [open, high, low, close] };
          oldData.push(newCandle);
          if (oldData.length > 50) oldData.shift();
          saveChartDataToBackend(oldData);
        } else {
          const updatedCandle = { ...lastCandle };
          const newClose = updatedCandle.y[3] + (Math.random() - 0.5) * 1.5;
          updatedCandle.y[1] = Math.max(updatedCandle.y[1], newClose);
          updatedCandle.y[2] = Math.min(updatedCandle.y[2], newClose);
          updatedCandle.y[3] = newClose;
          oldData[oldData.length - 1] = updatedCandle;
        }

        return [{ data: oldData }];
      });
    };

    updateIntervalRef.current = setInterval(updateCandles, 1000);

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