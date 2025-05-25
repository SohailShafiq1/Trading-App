import React, { useEffect, useState } from "react";
import styles from "./Deposit.module.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const s = styles;

const statusOptions = [
  { label: "All", value: "all" },
  { label: "Approved", value: "verified" },
  { label: "Pending", value: "pending" },
  { label: "Canceled", value: "failed" },
];

const Deposit = () => {
  const [deposits, setDeposits] = useState([]);
  const [filter, setFilter] = useState("all");
  const navigate = useNavigate();

  const fetchDeposits = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/admin/deposits");
      setDeposits(res.data);
    } catch (err) {
      console.error("Error fetching deposits:", err);
    }
  };

  const handleAction = async (id, action) => {
    try {
      await axios.put(`http://localhost:5000/api/admin/deposit-status/${id}`, {
        status: action,
      });
      fetchDeposits();
    } catch (err) {
      console.error("Error updating deposit status:", err);
    }
  };

  useEffect(() => {
    fetchDeposits();
  }, []);

  const filteredDeposits =
    filter === "all"
      ? deposits
      : deposits.filter((dep) => dep.status === filter);

  return (
    <div className={s.container}>
      <div className={s.headerRow}>
        <button
          className={s.backButton}
          onClick={() => navigate(-1)}
        >
          ← Back
        </button>
        <h2 className={s.title}>User Deposits</h2>
        <select
          className={s.statusSelect}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          {statusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      <table className={s.table}>
        <thead>
          <tr>
            <th>Email</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Date</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {filteredDeposits.length === 0 ? (
            <tr>
              <td colSpan={5} style={{ textAlign: "center", color: "#888" }}>
                No deposits found.
              </td>
            </tr>
          ) : (
            filteredDeposits.map((dep) => (
              <tr key={dep._id}>
                <td>{dep.userEmail}</td>
                <td>${dep.amount}</td>
                <td>
                  <span
                    className={
                      dep.status === "verified"
                        ? s.statusApproved
                        : dep.status === "pending"
                        ? s.statusPending
                        : s.statusCanceled
                    }
                  >
                    {dep.status === "verified"
                      ? "Approved"
                      : dep.status === "pending"
                      ? "Pending"
                      : "Canceled"}
                  </span>
                </td>
                <td>{new Date(dep.createdAt).toLocaleString()}</td>
                <td>
                  {dep.status === "pending" && (
                    <>
                      <button
                        className={s.acceptBtn}
                        onClick={() => handleAction(dep._id, "verified")}
                      >
                        ✅ Accept
                      </button>
                      <button
                        className={s.rejectBtn}
                        onClick={() => handleAction(dep._id, "failed")}
                      >
                        ❌ Reject
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Deposit;
