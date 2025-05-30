import React from "react";
import styles from "./AdminLayout.module.css";
import { Navigate, NavLink } from "react-router-dom";
import { useAuth } from "../Context/AuthContext";
import { Outlet } from "react-router-dom";
const s = styles;

const AdminLayout = () => {
  const { user } = useAuth();
  if (!user.isAdmin === false) {
    Navigate("/login");
  }
  return (
    <div className={s.container}>
      <h1 className={s.title}>Admin Panel</h1>
      <div className={s.content}>
        <Outlet />
      </div>
    </div>
  );
};

export default AdminLayout;
