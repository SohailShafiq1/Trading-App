import React from "react";
import { NavLink } from "react-router-dom";
import styles from "../../AdminLayout.module.css";
const s = styles;
const AdminHome = () => {
  return (
    <div>
      <div className={s.linkContainer}>
        <NavLink to="/admin/user" className={s.link}>
          User
        </NavLink>
        <NavLink to="/admin/withdraw" className={s.link}>
          Withdraw
        </NavLink>
        <NavLink to="/admin/coins" className={s.link}>
          Coins
        </NavLink>
        <NavLink to="/admin/deposits" className={s.link}>
          Deposits
        </NavLink>
        <NavLink to="/admin/bonuses" className={s.link}>
          Bonuses
        </NavLink>
        <NavLink to="/admin/affiliate" className={s.link}>
          Affiliate
        </NavLink>
      </div>
    </div>
  );
};

export default AdminHome;
