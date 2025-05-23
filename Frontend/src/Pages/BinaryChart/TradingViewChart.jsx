import React, { useEffect, useRef, useState } from "react";
import { AiOutlinePlus, AiOutlineBgColors } from "react-icons/ai";
import { BsBarChartFill } from "react-icons/bs";
import { BiPencil } from "react-icons/bi";

const TradingViewChart = ({ coinName }) => {
  const containerRef = useRef();
  const [interval, setInterval] = useState("30");

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/tv.js";
    script.async = true;

    script.onload = () => {
      if (window.TradingView) {
        new window.TradingView.widget({
          container_id: containerRef.current.id,
          autosize: true,
          symbol: `BINANCE:${coinName}USDT`,
          interval: interval,
          timezone: "Etc/UTC",
          theme: "light",
          style: "1",
          locale: "en",
          toolbar_bg: "#f1f3f6",
          enable_publishing: false,
          allow_symbol_change: false,
          hide_top_toolbar: true,
          overrides: {
            "paneProperties.background": "#ffffff",
            "paneProperties.vertGridProperties.color": "#e0e0e0",
            "paneProperties.horzGridProperties.color": "#e0e0e0",
            "scalesProperties.textColor": "#333",
          },
        });
      }
    };

    document.body.appendChild(script);

    return () => {
      script.remove();
    };
  }, [coinName, interval]);

  return (
    <div
      style={{
        position: "relative",
        height: "600px",
        width: "100%",
        borderRadius: 10,
        overflow: "hidden",
        background: "#ffffff",
      }}
    >
      {/* Toolbar */}
      <div
        style={{
          position: "absolute",
          top: 10,
          left: 10,
          zIndex: 10,
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
        }}
      >
        {/* + Button */}
        <button
          style={{
            width: 40,
            height: 40,
            borderRadius: 4,
            border: "1px solid #cccccc",
            background: "linear-gradient(90deg, #66b544, #1a391d)",
            boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <AiOutlinePlus style={{ fontSize: "1.5rem", color: "white" }} />
        </button>

        {/* Drawing Tool */}
        <button
          style={{
            width: 40,
            height: 40,
            borderRadius: 4,
            border: "1px solid #cccccc",
            background: "#ffffff",
            boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <BiPencil style={{ fontSize: "1.5rem", color: "#333" }} />
        </button>

        {/* Interval Selector */}
        <select
          value={interval}
          onChange={(e) => setInterval(e.target.value)}
          style={{
            height: 40,
            borderRadius: 4,
            border: "1px solid #ccc",
            background: "#ffffff",
            boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
            padding: "0 10px",
            fontSize: "1rem",
            cursor: "pointer",
            color: "#333",
          }}
        >
          {["1", "3", "5", "15", "30", "60", "120", "240", "D"].map((val) => (
            <option key={val} value={val}>
              {val === "60" ? "1h" : val === "D" ? "1d" : `${val}m`}
            </option>
          ))}
        </select>

        {/* Theme Button */}
        <button
          style={{
            width: 40,
            height: 40,
            borderRadius: 4,
            border: "1px solid #cccccc",
            background: "#ffffff",
            boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <AiOutlineBgColors style={{ fontSize: "1.5rem", color: "#333" }} />
        </button>

        {/* Chart Style */}
        <button
          style={{
            width: 40,
            height: 40,
            borderRadius: 4,
            border: "1px solid #cccccc",
            background: "#ffffff",
            boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <BsBarChartFill style={{ fontSize: "1.5rem", color: "#333" }} />
        </button>
      </div>

      {/* Chart Container */}
      <div
        id={`tv-chart-${coinName}`}
        ref={containerRef}
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
};

export default TradingViewChart;
