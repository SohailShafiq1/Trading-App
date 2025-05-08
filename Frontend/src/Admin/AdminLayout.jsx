import React from "react";
import styles from "./AdminLayout.module.css";
import { NavLink } from "react-router-dom";

const s = styles;

const AdminLayout = () => {
  return (
    <div className={s.container}>
      <h1 className={s.title}>Admin Panel</h1>
      <div className={s.linkContainer}>
        <NavLink to="/user" className={s.link}>
          User
        </NavLink>
        <NavLink to="/withdraw" className={s.link}>
          Withdraw
        </NavLink>
        <NavLink to="/coins" className={s.link}>
          Coins
        </NavLink>
      </div>
    </div>
  );
};

export default AdminLayout;
