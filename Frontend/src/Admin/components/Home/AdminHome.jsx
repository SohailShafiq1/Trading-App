import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import styles from "../../AdminLayout.module.css";
const s = styles;

const SECTION_OPTIONS = [
  { key: "user", label: "User", path: "/admin/user" },
  { key: "withdraw", label: "Withdraw", path: "/admin/withdraw" },
  { key: "coins", label: "Coins", path: "/admin/coins" },
  { key: "deposits", label: "Deposits", path: "/admin/deposits" },
  { key: "bonuses", label: "Bonuses", path: "/admin/bonuses" },
  { key: "affiliate", label: "Affiliate", path: "/admin/affiliate" },
  { key: "trades", label: "Stats", path: "/admin/trades" },
  { key: "news", label: "News", path: "/admin/news" },
  { key: "support", label: "Support", path: "/admin/support" },
  {
    key: "usertrade",
    label: "Trade of User account",
    path: "/admin/usertrade",
  },
  { key: "leaderboard", label: "Leader board", path: "/admin/leaderboard" },
  { key: "content", label: "Content Management", path: "/admin/content" },
  { key: "amount", label: "Amount", path: "/admin/amount" },
  { key: "admins", label: "Admins", path: "/admin/admins" },
];

const AdminHome = () => {
  const [access, setAccess] = useState(null);
  useEffect(() => {
    // Assume token in localStorage, and backend returns user info with access array
    const fetchMe = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const res = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/auth/me`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const data = await res.json();
        setAccess(data.user?.access || []);
      } catch {
        setAccess([]);
      }
    };
    fetchMe();
  }, []);
  return (
    <div>
      <div className={s.linkContainer}>
        {SECTION_OPTIONS.filter(
          (opt) => !access || access.includes(opt.key) || access.length === 0 // show all if no access set (e.g. super admin)
        ).map((opt) => (
          <NavLink key={opt.key} to={opt.path} className={s.link}>
            {opt.label}
          </NavLink>
        ))}
      </div>
    </div>
  );
};

export default AdminHome;
