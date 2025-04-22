import { FiArrowDownRight } from "react-icons/fi";
import React, { useState, useEffect } from "react";
import styles from "./BinaryChart.module.css";
import BinaryLayout from "../../Layout/BinaryLayout/BinaryLayout";
import { Outlet } from "react-router-dom";
const s = styles;
import img from "./HomeContect.png";
const BinaryChart = () => {
  return (
    <>
      <div className={s.container}>
        <div className={s.chart}>
          <img src={img} alt="" />
        </div>
        <div className={s.control}>
          <h1>Coin Name</h1>
          <div className={s.controlBox}>
            <button className={s.iconBtn}>−</button>
            <div className={s.value}>00:01:00</div>{" "}
            <button className={s.iconBtn}>+</button>
          </div>
          <div className={s.controlBox}>
            <button className={s.iconBtn}>−</button>
            <div className={s.value}>10$</div> {/* or 10$ for Investment */}
            <button className={s.iconBtn}>+</button>
          </div>
          <div className={s.buySelling}>
            <div className={s.buyBox}>
              <FiArrowDownRight className={s.icons} />
              <p>Buy</p>
            </div>{" "}
            <div className={s.SellBox}>
              <FiArrowDownRight className={s.icons} />
              <p>Sell</p>
            </div>
          </div>
          <div className={s.tradeHistory}>
            <p>Trades</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default BinaryChart;
