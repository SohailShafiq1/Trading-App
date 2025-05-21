import React from "react";
import styles from "./AdminLayout.module.css";
import { Navigate, NavLink } from "react-router-dom";
import { useAuth } from "../Context/AuthContext";
const s = styles;

const AdminLayout = () => {
  const { user } = useAuth();
  if (!user.isAdmin === false) {
    Navigate("/login");
  }
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
        <NavLink to="/deposits" className={s.link}>
          Deposits
        </NavLink>
      </div>
    </div>
  );
};

export default AdminLayout;
