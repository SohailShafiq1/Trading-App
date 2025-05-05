import React from "react";
import styles from "./AdminLayout.module.css";
import User from "./components/User/User";
import Trends from "./components/Trends/Trends";
import Coins from "./components/Coins/Coins"; // Import the new Coins component

const s = styles;

const AdminLayout = () => {
  return (
    <div className={s.container}>
      <h1 className={s.title}>Admin Panel</h1>

      {/* Coin Management Section */}
      <Coins />

      {/* User Management Section */}
      <User />

      {/* Trend Management Section */}
      <Trends />
    </div>
  );
};

export default AdminLayout;
