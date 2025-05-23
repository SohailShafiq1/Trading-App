import React from "react";
import styles from "./Trends.module.css";

const s = styles;

const Trends = ({ coinName, currentTrend, onTrendUpdate }) => {
  return (
    <div className={s.section}>
      <h2>Set Trend for {coinName}</h2>
      <p>Current Trend: {currentTrend}</p>

      <h3>Basic Trends</h3>
      <div className={s.buttonGroup}>
        <button
          className={`${s.button} ${currentTrend === "Up" ? s.selected : ""}`}
          onClick={() => onTrendUpdate("Up")}
        >
          Up
        </button>
        <button
          className={`${s.button} ${currentTrend === "Down" ? s.selected : ""}`}
          onClick={() => onTrendUpdate("Down")}
        >
          Down
        </button>
        <button
          className={`${s.button} ${
            currentTrend === "Random" ? s.selected : ""
          }`}
          onClick={() => onTrendUpdate("Random")}
        >
          Random
        </button>
      </div>

      <h3>Scenario Patterns</h3>
      <div className={s.buttonGroup}>
        <button
          className={`${s.button} ${
            currentTrend === "Scenario1" ? s.selected : ""
          }`}
          onClick={() => onTrendUpdate("Scenario1")}
        >
          Scenario 1
        </button>
        <button
          className={`${s.button} ${
            currentTrend === "Scenario2" ? s.selected : ""
          }`}
          onClick={() => onTrendUpdate("Scenario2")}
        >
          Scenario 2
        </button>
        <button
          className={`${s.button} ${
            currentTrend === "Scenario3" ? s.selected : ""
          }`}
          onClick={() => onTrendUpdate("Scenario3")}
        >
          Scenario 3
        </button>
        <button
          className={`${s.button} ${
            currentTrend === "Scenario4" ? s.selected : ""
          }`}
          onClick={() => onTrendUpdate("Scenario4")}
        >
          Scenario 4
        </button>
        <button
          className={`${s.button} ${
            currentTrend === "Scenario5" ? s.selected : ""
          }`}
          onClick={() => onTrendUpdate("Scenario5")}
        >
          Scenario 5
        </button>
      </div>
    </div>
  );
};

export default Trends;
