import React, { useEffect, useState, useRef } from "react";
import ReactApexChart from "react-apexcharts";

const CANDLE_DURATIONS = [
  { label: "30 seconds", value: 30000 },
  { label: "1 minute", value: 60000 },
  { label: "2 minutes", value: 120000 },
  { label: "3 minutes", value: 180000 },
  { label: "5 minutes", value: 300000 },
];

const generateInitialData = (count = 30, base = 100, duration = 30000) => {
  const data = [];
  let lastClose = base;
  const now = Date.now();
  for (let i = 0; i < count; i++) {
    const time = new Date(now - (count - i) * duration).getTime();
    const [open, high, low, close] = generateCandle(lastClose);
    data.push({ x: time, y: [open, high, low, close] });
    lastClose = close;
  }
  return data;
};

const generateCandle = (lastClose) => {
  const open = lastClose;
  const high = open + Math.random() * 3;
  const low = open - Math.random() * 3;
  const close = low + Math.random() * (high - low);
  return [open, high, low, close];
};

const LiveCandleChart = ({ coinName }) => {
  const [series, setSeries] = useState([{ data: generateInitialData() }]);
  const [candleDuration, setCandleDuration] = useState(CANDLE_DURATIONS[0].value); // Default to 30 seconds
  const intervalRef = useRef(null);

  const handleCandleDurationChange = (duration) => {
    setCandleDuration(duration);
    setSeries([{ data: generateInitialData(30, 100, duration) }]); // Regenerate data with new duration
  };

  useEffect(() => {
    const updateCandles = () => {
      setSeries((prevSeries) => {
        const oldData = [...prevSeries[0].data];
        const lastCandle = oldData[oldData.length - 1];
        const now = new Date().getTime();

        if (now - lastCandle.x >= candleDuration) {
          // Add a new candle
          const [open, high, low, close] = generateCandle(lastCandle.y[3]);
          oldData.push({ x: now, y: [open, high, low, close] });

          // Limit the number of candles to 50 for scrolling effect
          if (oldData.length > 50) oldData.shift();
        } else {
          // Update the current candle
          const updatedCandle = { ...lastCandle };
          const newClose = lastCandle.y[3] + (Math.random() - 0.5) * 1.5;
          updatedCandle.y[1] = Math.max(updatedCandle.y[1], newClose); // Update high
          updatedCandle.y[2] = Math.min(updatedCandle.y[2], newClose); // Update low
          updatedCandle.y[3] = newClose; // Update close
          oldData[oldData.length - 1] = updatedCandle;
        }

        return [{ data: oldData }];
      });
    };

    intervalRef.current = setInterval(updateCandles, 1000); // Update every second

    return () => clearInterval(intervalRef.current); // Cleanup on unmount
  }, [candleDuration]);

  const options = {
    chart: {
      type: "candlestick",
      height: 350,
      animations: {
        enabled: true,
        easing: "linear",
        dynamicAnimation: {
          speed: 300,
        },
      },
      toolbar: {
        show: true,
        tools: {
          zoom: true,
          zoomin: true,
          zoomout: true,
          pan: true,
          reset: true,
        },
      },
      zoom: {
        enabled: true,
        type: "x",
        autoScaleYaxis: true,
      },
    },
    title: {
      text: `${coinName} Chart`,
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
    tooltip: { enabled: true },
  };

  return (
    <div id="chart">
      {/* Candle Duration Selection */}
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
        height={350}
      />
    </div>
  );
};

export default LiveCandleChart;
