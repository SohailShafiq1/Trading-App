import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Withdraw.module.css";

const Withdraw = () => {
  const [withdrawRequests, setWithdrawRequests] = useState([]);
  const [filter, setFilter] = useState("all"); // "all", "pending", "approved", "rejected"
  const [error, setError] = useState("");
  const [autoLimit, setAutoLimit] = useState("");
  const [saving, setSaving] = useState(false);
  const [showAffiliateWithdrawals, setShowAffiliateWithdrawals] = useState(false);
  const [affiliateWithdrawRequests, setAffiliateWithdrawRequests] = useState([]);
  const [showUserWithdrawals, setShowUserWithdrawals] = useState(true);
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

  // Fetch affiliate withdrawal requests
  const fetchAffiliateWithdrawRequests = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/admin/affiliate-withdraw-requests`);
      const data = await res.json();
      // Sort by newest first
      const sorted = data.sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt));
      setAffiliateWithdrawRequests(sorted.reverse());
    } catch (err) {
      setError("Failed to fetch affiliate withdrawals");
    }
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

  // Add handlers for affiliate approve/reject
  const handleAffiliateApprove = async (withdrawalId) => {
    try {
      await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/admin/affiliate-withdraw-approve/${withdrawalId}`,
        { method: "PUT" }
      );
      fetchAffiliateWithdrawRequests(); // Refresh the list
    } catch (err) {
      setError("Failed to approve affiliate withdrawal");
    }
  };

  const handleAffiliateReject = async (withdrawalId) => {
    try {
      await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/admin/affiliate-withdraw-reject/${withdrawalId}`,
        { method: "PUT" }
      );
      fetchAffiliateWithdrawRequests(); // Refresh the list
    } catch (err) {
      setError("Failed to reject affiliate withdrawal");
    }
  };

  return (
    <div className={styles.container}>
      <button onClick={() => navigate(-1)}>Back</button>
      <h2>Withdrawal Requests</h2>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <button
          className={styles.limitButton}
          onClick={() => {
            setShowUserWithdrawals(true);
            setShowAffiliateWithdrawals(false);
          }}
          style={{ background: showUserWithdrawals ? '#1976d2' : undefined, color: showUserWithdrawals ? '#fff' : undefined }}
        >
          Users Withdraw
        </button>
        <button
          className={styles.limitButton}
          onClick={() => {
            setShowAffiliateWithdrawals(true);
            setShowUserWithdrawals(false);
            fetchAffiliateWithdrawRequests();
          }}
          style={{ background: showAffiliateWithdrawals ? '#1976d2' : undefined, color: showAffiliateWithdrawals ? '#fff' : undefined }}
        >
          Affiliate Withdrawals
        </button>
      </div>

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

      {error && <p className={styles.error}>{error}</p>}

      {/* Users Withdrawals Table */}
      {showUserWithdrawals && (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Email</th>
              <th>Amount</th>
              <th>Method</th>
              <th>Network</th>
              <th>Purse/Wallet</th>
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
                <td>{request.method || '-'}</td>
                <td>{request.network || '-'}</td>
                <td>{request.purse || request.wallet || '-'}</td>
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
      )}

      {/* Affiliate Withdrawals Table */}
      {showAffiliateWithdrawals && (
        <>
          <h3 style={{ marginTop: 24 }}>Affiliate Withdrawals</h3>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Email</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Network</th>
                <th>Purse/Wallet</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {affiliateWithdrawRequests.map((request, idx) => (
                <tr key={request._id || idx}>
                  <td>{request.email}</td>
                  <td>${request.amount}</td>
                  <td>{request.paymentMethod || '-'}</td>
                  <td>{request.network || '-'}</td>
                  <td>{request.purse || '-'}</td>
                  <td>
                    <span
                      style={{
                        color:
                          request.status === "approved" || request.status === "autoapproved"
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
                        : request.status || "pending"}
                    </span>
                  </td>
                  <td>{request.requestedAt ? new Date(request.requestedAt).toLocaleString() : '-'}</td>
                  <td>
                    {/* Only show buttons for pending */}
                    {(!request.status || request.status === "pending") && (
                      <>
                        <button
                          onClick={() => handleAffiliateApprove(request._id)}
                          className={styles.acceptButton}
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleAffiliateReject(request._id)}
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
        </>
      )}
    </div>
  );
};

export default Withdraw;
