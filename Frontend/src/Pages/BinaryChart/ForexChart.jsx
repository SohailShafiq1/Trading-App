import React, { useEffect, useRef, useState } from "react";
import { createChart } from "lightweight-charts";

const API_KEY = "947e8dde5aad425da8950b509decf8ca";

const ForexChart = ({ symbol = "USD/CAD" }) => {
  const chartContainerRef = useRef();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!symbol || typeof symbol !== "string" || symbol.length < 6) {
      setError("Invalid or missing symbol.");
      setLoading(false);
      return;
    }
    let chart;
    const API_URL = `https://api.twelvedata.com/time_series?symbol=${symbol}&interval=15min&apikey=${API_KEY}`;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(API_URL);
        const data = await response.json();
        if (!data.values) throw new Error(data.message || "No data found");
        const candles = data.values
          .map((item) => ({
            time: Math.floor(new Date(item.datetime).getTime() / 1000),
            open: parseFloat(item.open),
            high: parseFloat(item.high),
            low: parseFloat(item.low),
            close: parseFloat(item.close),
          }))
          .reverse();
        if (chartContainerRef.current) {
          chart = createChart(chartContainerRef.current, {
            width: chartContainerRef.current.clientWidth,
            height: 400,
            layout: { background: { color: "#fff" }, textColor: "#222" },
            grid: {
              vertLines: { color: "#eee" },
              horzLines: { color: "#eee" },
            },
            timeScale: { timeVisible: true, secondsVisible: false },
          });
          const candleSeries = chart.addCandlestickSeries({
            upColor: '#4bc0c0',
            downColor: '#ef5350',
            borderUpColor: '#4bc0c0',
            borderDownColor: '#ef5350',
            wickUpColor: '#4bc0c0',
            wickDownColor: '#ef5350',
          });
          candleSeries.setData(candles);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    return () => {
      if (chart) chart.remove();
    };
  }, [symbol]);

  if (loading) return <div>Loading chart...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div style={{ width: "100%", maxWidth: 800, margin: "0 auto" }}>
      <h2>{symbol} Forex Chart</h2>
      <div ref={chartContainerRef} style={{ width: "100%", height: 400 }} />
    </div>
  );
};

export default ForexChart;
