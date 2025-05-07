import React, { useState } from "react";
import axios from "axios";
import styles from "./Trends.module.css";
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const s = styles;

const Trends = () => {
  const [trend, setTrend] = useState("Normal");
  const updateTrend = async (mode) => {
    setTrend(mode);
    try {
      await axios.post(`${BACKEND_URL}/api/admin/trend`, { mode });
      console.log(`Trend updated to: ${mode}`);
    } catch (err) {
      console.error("Error updating trend:", err);
    }
  };

  return (
    <div className={s.section}>
      <h2>Trend Management</h2>

      <h3>Basic Trends</h3>
      <div className={s.buttonGroup}>
        <button className={s.button} onClick={() => updateTrend("Up")}>
          Up
        </button>
        <button className={s.button} onClick={() => updateTrend("Down")}>
          Down
        </button>
        <button className={s.button} onClick={() => updateTrend("Normal")}>
          Normal
        </button>
      </div>

      <h3>Scenario Patterns</h3>
      <div className={s.buttonGroup}>
        <button className={s.button} onClick={() => updateTrend("Scenario1")}>
          Scenario 1
        </button>
        <button className={s.button} onClick={() => updateTrend("Scenario2")}>
          Scenario 2
        </button>
        <button className={s.button} onClick={() => updateTrend("Scenario3")}>
          Scenario 3
        </button>
        <button className={s.button} onClick={() => updateTrend("Scenario4")}>
          Scenario 4
        </button>
        <button className={s.button} onClick={() => updateTrend("Scenario5")}>
          Scenario 5
        </button>
      </div>
    </div>
  );
};

export default Trends;
