import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Withdraw.module.css";

const Withdraw = () => {
  const [withdrawRequests, setWithdrawRequests] = useState([]);
  const [filter, setFilter] = useState("all"); // "all", "pending", "approved", "rejected"
  const [error, setError] = useState("");
  const [autoLimit, setAutoLimit] = useState("");
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  // Fetch requests based on filter
  const fetchWithdrawRequests = async () => {
    try {
      const url =
        filter === "all"
          ? `${import.meta.env.VITE_BACKEND_URL}/api/admin/withdraw-requests`
          : `${import.meta.env.VITE_BACKEND_URL}/api/admin/withdraw-requests?status=${filter}`;

      const response = await fetch(url);
      const data = await response.json();

      // Sort by newest first
      const sortedRequests = data.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );

      setWithdrawRequests(sortedRequests);
    } catch (err) {
      setError("Failed to fetch requests");
    }
  };

  // Fetch auto-approve limit
  const fetchAutoLimit = async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/settings/withdraw-limit`
      );
      const data = await res.json();
      setAutoLimit(data.limit);
    } catch {
      setError("Failed to fetch auto-approve limit");
    }
  };

  // Save auto-approve limit
  const saveAutoLimit = async () => {
    setSaving(true);
    try {
      await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/settings/withdraw-limit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ limit: Number(autoLimit) }),
      });
      fetchAutoLimit();
    } catch {
      setError("Failed to save auto-approve limit");
    }
    setSaving(false);
  };

  useEffect(() => {
    fetchWithdrawRequests();
  }, [filter]); // ✅ Refetch when filter changes

  useEffect(() => {
    fetchAutoLimit();
  }, []);

  const handleAccept = async (withdrawalId) => {
    try {
      await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/admin/withdraw-accept/${withdrawalId}`,
        { method: "PUT" }
      );
      fetchWithdrawRequests(); // Refresh the list
    } catch (err) {
      setError("Failed to approve");
    }
  };

  const handleReject = async (withdrawalId) => {
    try {
      await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/admin/withdraw-decline/${withdrawalId}`,
        { method: "PUT" }
      );
      fetchWithdrawRequests(); // Refresh the list
    } catch (err) {
      setError("Failed to reject");
    }
  };

  return (
    <div className={styles.container}>
      <button onClick={() => navigate(-1)}>Back</button>
      <h2>Withdrawal Requests</h2>

      {/* Auto-approval limit controls */}
      <div className={styles.limitBox}>
        <span className={styles.limitLabel}>Auto-Approve Withdraw Limit:</span>
        <input
          type="number"
          value={autoLimit}
          onChange={(e) => setAutoLimit(e.target.value)}
          className={styles.limitInput}
          min={0}
          placeholder="Limit"
        />
        <button
          onClick={saveAutoLimit}
          disabled={saving}
          className={styles.limitButton}
        >
          {saving ? "Saving..." : "Save"}
        </button>
        <span className={styles.limitDesc}>
          All withdrawals <b>≤ ${autoLimit || 0}</b> will be auto-approved.
        </span>
      </div>

      <select
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className={styles.filterDropdown}
      >
        <option value="all">All Requests</option>
        <option value="pending">Pending</option>
        <option value="approved">Approved</option>
        <option value="rejected">Rejected</option>
      </select>

      {error && <p className={styles.error}>{error}</p>}

      <table className={styles.table}>
        <thead>
          <tr>
            <th>Email</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {withdrawRequests.map((request) => (
            <tr key={request.withdrawalId}>
              <td>{request.email}</td>
              <td>${request.amount}</td>
              <td>
                <span
                  style={{
                    color:
                      request.status === "approved" ||
                      request.status === "autoapproved"
                        ? "#388e3c"
                        : request.status === "rejected"
                        ? "#e53935"
                        : "#fbc02d",
                    fontWeight: "bold",
                    textTransform: "capitalize",
                  }}
                >
                  {request.status === "autoapproved"
                    ? "Auto Approved"
                    : request.status}
                </span>
              </td>
              <td>{new Date(request.createdAt).toLocaleString()}</td>
              <td>
                {/* Only show buttons for pending */}
                {request.status === "pending" && (
                  <>
                    <button
                      onClick={() => handleAccept(request.withdrawalId)}
                      className={styles.acceptButton}
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(request.withdrawalId)}
                      className={styles.rejectButton}
                    >
                      Reject
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Withdraw;
