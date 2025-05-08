import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import styles from "./Withdraw.module.css";
const s = styles;

const Withdraw = () => {
  const [withdrawRequests, setWithdrawRequests] = useState([]);
  const navigate = useNavigate(); 

  useEffect(() => {
    const mockRequests = [
      { id: 1, user: "User1", amount: 100, status: "Pending" },
      { id: 2, user: "User2", amount: 200, status: "Pending" },
      { id: 3, user: "User3", amount: 150, status: "Pending" },
      { id: 4, user: "User4", amount: 300, status: "Pending" },
      { id: 5, user: "User5", amount: 250, status: "Pending" },
      { id: 6, user: "User6", amount: 400, status: "Pending" },
      { id: 7, user: "User7", amount: 350, status: "Pending" },
      { id: 8, user: "User8", amount: 500, status: "Pending" },
      { id: 9, user: "User9", amount: 450, status: "Pending" },
      { id: 10, user: "User10", amount: 600, status: "Pending" },
      { id: 11, user: "User11", amount: 700, status: "Pending" },
      { id: 12, user: "User12", amount: 800, status: "Pending" },
      { id: 13, user: "User13", amount: 900, status: "Pending" },
      { id: 14, user: "User14", amount: 1000, status: "Pending" },
      { id: 15, user: "User15", amount: 1100, status: "Pending" },
    ];
    setWithdrawRequests(mockRequests);
  }, []);

  const handleAccept = (id) => {
    setWithdrawRequests((prev) =>
      prev.map((req) => (req.id === id ? { ...req, status: "Accepted" } : req))
    );
  };

  const handleReject = (id) => {
    setWithdrawRequests((prev) =>
      prev.map((req) => (req.id === id ? { ...req, status: "Rejected" } : req))
    );
  };

  return (
    <div className={s.container}>
      <button className={s.backButton} onClick={() => navigate(-1)}>
        Back
      </button>
      <h2>Withdrawal Requests</h2>
      <table className={s.table}>
        <thead>
          <tr>
            <th>User</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {withdrawRequests.map((request) => (
            <tr key={request.id}>
              <td>{request.user}</td>
              <td>${request.amount}</td>
              <td>{request.status}</td>
              <td>
                {request.status === "Pending" && (
                  <>
                    <button
                      className={s.acceptButton}
                      onClick={() => handleAccept(request.id)}
                    >
                      Accept
                    </button>
                    <button
                      className={s.rejectButton}
                      onClick={() => handleReject(request.id)}
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
