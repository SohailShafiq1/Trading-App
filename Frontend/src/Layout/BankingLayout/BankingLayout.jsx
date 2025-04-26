import React, { useState, useEffect } from "react";
import styles from "./BankingLayout.module.css";
import { Outlet } from "react-router-dom";
import { NavLink } from "react-router-dom";
const s = styles;

const BankingLayout = () => {
  return (
    <>
      <div className={s.container}>
       
        <Outlet />
      </div>
    </>
  );
};

export default BankingLayout;
