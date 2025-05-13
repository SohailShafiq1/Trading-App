import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Withdraw.module.css";

const Withdraw = () => {
  const [withdrawRequests, setWithdrawRequests] = useState([]);
  const [filter, setFilter] = useState("all"); // "all", "pending", "approved", "rejected"
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Fetch requests based on filter
  const fetchWithdrawRequests = async () => {
    try {
      const url = filter === "all" 
        ? "http://localhost:5000/api/admin/withdraw-requests"
        : `http://localhost:5000/api/admin/withdraw-requests?status=${filter}`;

      const response = await fetch(url);
      const data = await response.json();
      setWithdrawRequests(data);
    } catch (err) {
      setError("Failed to fetch requests");
    }
  };

  useEffect(() => {
    fetchWithdrawRequests();
  }, [filter]); // ✅ Refetch when filter changes

  const handleAccept = async (withdrawalId) => {
    try {
      await fetch(
        `http://localhost:5000/api/admin/withdraw-accept/${withdrawalId}`,
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
        `http://localhost:5000/api/admin/withdraw-decline/${withdrawalId}`,
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
                <span className={
                  request.status === "approved" ? styles.statusApproved :
                  request.status === "rejected" ? styles.statusRejected :
                  styles.statusPending
                }>
                  {request.status}
                </span>
              </td>
              <td>{new Date(request.createdAt).toLocaleString()}</td>
              <td>
                {/* Show buttons only for pending requests */}
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