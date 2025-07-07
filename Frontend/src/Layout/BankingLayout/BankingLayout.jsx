import React, { useState, useEffect } from "react";
import styles from "./BankingLayout.module.css";
import { Outlet } from "react-router-dom";
import { NavLink } from "react-router-dom";
import { useTheme } from "../../Context/ThemeContext";
const s = styles;

const BankingLayout = () => {
  const { theme } = useTheme();
  return (
    <>
      <div
        className={s.container}
        style={{ background: theme.background, color: theme.textColor }}
      >
        <nav className={s.navBar} style={{ background: theme.box }}>
          <ul className={s.navList} style={{ background: theme.box }}>
            <li className={s.navItem}>
              <NavLink
                to="/binarychart/bankinglayout/deposit"
                className={({ isActive }) =>
                  isActive ? `${s.navLink} ${s.active}` : s.navLink
                }
                style={({ isActive }) => ({
                  color: isActive ? "#10a055" : theme.textColor,
                  borderRadius: 6,
                  transition: "background 0.2s, color 0.2s",
                })}
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
                style={({ isActive }) => ({
                  color: isActive ? "#10a055" : theme.textColor,
                  borderRadius: 6,
                  transition: "background 0.2s, color 0.2s",
                })}
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
                style={({ isActive }) => ({
                  color: isActive ? "#10a055" : theme.textColor,
                  borderRadius: 6,
                  transition: "background 0.2s, color 0.2s",
                })}
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
                style={({ isActive }) => ({
                  color: isActive ? "#10a055" : theme.textColor,
                  borderRadius: 6,
                  transition: "background 0.2s, color 0.2s",
                })}
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
