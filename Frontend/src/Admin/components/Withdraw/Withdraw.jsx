import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import styles from "./Withdraw.module.css";
const s = styles;

const Withdraw = () => {
  const [withdrawRequests, setWithdrawRequests] = useState([]);
  const [error, setError] = useState(""); // To handle errors
  const navigate = useNavigate();

  useEffect(() => {
    const fetchWithdrawRequests = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/admin/withdraw-requests", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) {
          const errorData = await response.json();
          setError(errorData.message || "Failed to fetch withdrawal requests.");
          return;
        }

        const data = await response.json();
        setWithdrawRequests(data); // Set the fetched withdrawal requests
      } catch (err) {
        console.error("Error fetching withdrawal requests:", err);
        setError("An error occurred while fetching withdrawal requests.");
      }
    };

    fetchWithdrawRequests();
  }, []);

  const handleAccept = async (email) => {
    try {
      const response = await fetch(`http://localhost:5000/api/admin/withdraw-accept/${email}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.message || "Failed to accept withdrawal request.");
        return;
      }

      setWithdrawRequests((prev) =>
        prev.map((req) =>
          req.email === email ? { ...req, withdraw: { ...req.withdraw, request: false, approved: true } } : req
        )
      );
    } catch (err) {
      console.error("Error accepting withdrawal request:", err);
      setError("An error occurred while accepting the withdrawal request.");
    }
  };

  const handleReject = async (email) => {
    try {
      const response = await fetch(`http://localhost:5000/api/admin/withdraw-decline/${email}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.message || "Failed to decline withdrawal request.");
        return;
      }

      const updatedUser = await response.json();

      setWithdrawRequests((prev) =>
        prev.map((req) =>
          req.email === email ? { ...req, withdraw: { ...req.withdraw, request: false, approved: false } } : req
        )
      );
    } catch (err) {
      console.error("Error declining withdrawal request:", err);
      setError("An error occurred while declining the withdrawal request.");
    }
  };

  return (
    <div className={s.container}>
      <button className={s.backButton} onClick={() => navigate(-1)}>
        Back
      </button>
      <h2>Withdrawal Requests</h2>
      {error && <p className={s.error}>{error}</p>}
      <table className={s.table}>
        <thead>
          <tr>
            <th>Email</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {withdrawRequests.map((request) => (
            <tr key={request.email}>
              <td>{request.email}</td>
              <td>${request.withdraw.amount}</td>
              <td>{request.withdraw.request ? "Pending" : request.withdraw.approved ? "Accepted" : "Rejected"}</td>
              <td>
                {request.withdraw.request && (
                  <>
                    <button
                      className={s.acceptButton}
                      onClick={() => handleAccept(request.email)}
                    >
                      Accept
                    </button>
                    <button
                      className={s.rejectButton}
                      onClick={() => handleReject(request.email)}
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
