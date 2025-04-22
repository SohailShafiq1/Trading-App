import React, { useState, useEffect } from "react";
import styles from "./BankingLayout.module.css";
import { Outlet } from "react-router-dom";
import { NavLink } from "react-router-dom";
const s = styles;

const BankingLayout = () => {
  return (
    <>
      <div className={s.container}>
        <nav className={s.navBar}>
          <ul className={s.navList}>
            <li className={s.navItem}>
              <NavLink
                to="/binarychart/bankinglayout/deposit"
                className={({ isActive }) =>
                  isActive ? `${s.navLink} ${s.active}` : s.navLink
                }
              >
                Deposit
              </NavLink>
            </li>
            <li className={s.navItem}>
              <NavLink
                to="/binarychart/bankinglayout/withdraw"
                className={({ isActive }) =>
                  isActive ? `${s.navLink} ${s.active}` : s.navLink
                }
              >
                Withdraw
              </NavLink>
            </li>
            <li className={s.navItem}>
              <NavLink
                to="/binarychart/bankinglayout/transactions"
                className={({ isActive }) =>
                  isActive ? `${s.navLink} ${s.active}` : s.navLink
                }
              >
                Transactions
              </NavLink>
            </li>
            <li className={s.navItem}>
              <NavLink
                to="/binarychart/profile"
                className={({ isActive }) =>
                  isActive ? `${s.navLink} ${s.active}` : s.navLink
                }
              >
                Account
              </NavLink>
            </li>
          </ul>
        </nav>
      </div>
      <div>
        <Outlet />
      </div>
    </>
  );
};

export default BankingLayout;
