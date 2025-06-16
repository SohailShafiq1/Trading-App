import React, { useEffect, useState } from "react";
import styles from "./Deposit.module.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const statusOptions = [
  { label: "All", value: "all" },
  { label: "Approved", value: "verified" },
  { label: "Pending", value: "pending" },
  { label: "Canceled", value: "failed" },
];

const Deposit = () => {
  const [deposits, setDeposits] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null); // Tracks which deposit is being processed
  const navigate = useNavigate();

  const fetchDeposits = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/admin/deposits`
      );
      setDeposits(res.data);
    } catch (err) {
      console.error("Error fetching deposits:", err);
      setError("Failed to load deposits");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, action) => {
    setActionLoading(id);
    try {
      const response = await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/api/admin/deposit-status/${id}`,
        { status: action }
      );

      setDeposits((prevDeposits) =>
        prevDeposits.map((dep) => (dep._id === id ? response.data.deposit : dep))
      );
    } catch (err) {
      console.error("Error updating deposit status:", err);
      setError(
        `Failed to ${action === "verified" ? "approve" : "reject"} deposit`
      );
    } finally {
      setActionLoading(null);
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
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <button className={styles.backButton} onClick={() => navigate(-1)}>
          ← Back
        </button>
        <h2 className={styles.title}>User Deposits</h2>
        <select
          className={styles.statusSelect}
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

      {error && <div className={styles.errorMessage}>{error}</div>}
      {loading && <div className={styles.loadingMessage}>Loading deposits...</div>}

      <table className={styles.table}>
        <thead>
          <tr>
            <th>Email</th>
            <th>Amount</th>
            <th>Bonus</th>
            <th>Total (With Bonus)</th>
            <th>Status</th>
            <th>Date</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {filteredDeposits.length === 0 ? (
            <tr>
              <td colSpan={7} className={styles.noDeposits}>
                {loading ? "Loading..." : "No deposits found"}
              </td>
            </tr>
          ) : (
            filteredDeposits.map((dep) => (
              <tr key={dep._id}>
                <td>{dep.userEmail}</td>
                <td>${dep.amount}</td>
                <td>
                  {typeof dep.bonusAmount === "number" && dep.bonusPercent
                    ? `$${dep.bonusAmount} (${dep.bonusPercent}%)`
                    : "-"}
                </td>
                <td>${dep.amount + (dep.bonusAmount || 0)}</td>
                <td>
                  <span
                    className={
                      dep.status === "verified"
                        ? styles.statusApproved
                        : dep.status === "pending"
                        ? styles.statusPending
                        : styles.statusCanceled
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
                    <div className={styles.actionButtons}>
                      <button
                        className={styles.acceptBtn}
                        onClick={() => handleAction(dep._id, "verified")}
                        disabled={actionLoading === dep._id}
                      >
                        {actionLoading === dep._id ? "Processing..." : "✅ Accept"}
                      </button>
                      <button
                        className={styles.rejectBtn}
                        onClick={() => handleAction(dep._id, "failed")}
                        disabled={actionLoading === dep._id}
                      >
                        {actionLoading === dep._id ? "Processing..." : "❌ Reject"}
                      </button>
                    </div>
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