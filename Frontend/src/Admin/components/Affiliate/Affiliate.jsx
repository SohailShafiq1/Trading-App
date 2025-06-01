import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import styles from "./Affiliate.module.css";
const s = styles;
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const Affiliate = () => {
  const [affiliates, setAffiliates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAffiliate, setSelectedAffiliate] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAffiliates = async () => {
      try {
        const response = await axios.get(
          `${BACKEND_URL}/api/affiliate/affiliates`
        );
        setAffiliates(response.data.affiliates || []);
      } catch (err) {
        console.error("Error fetching affiliates:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAffiliates();
  }, []);

  const handleView = (affiliate) => {
    setSelectedAffiliate(affiliate);
    setShowModal(true);
  };

  return (
    <>
      <div className={s.container}>
        <button onClick={() => navigate(-1)} className={s.backButton}>
          Back
        </button>
        <h2>Affiliate Users</h2>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Email</th>
                <th>Country</th>
                <th>Currency</th>
                <th>Level</th>
                <th>Total Earnings</th>
                <th>Total Deposit</th>
                <th>Total Profit</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {affiliates.map((a) => (
                <tr key={a._id}>
                  <td>{a.email}</td>
                  <td>{a.country}</td>
                  <td>{a.currency}</td>
                  <td>{a.level}</td>
                  <td>{a.totalEarnings}</td>
                  <td>{a.totalDeposit}</td>
                  <td>{a.totalProfit}</td>
                  <td>
                    <button onClick={() => handleView(a)}>View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {showModal && selectedAffiliate && (
          <div className={s.modalOverlay}>
            <div className={s.modal}>
              <h3>Traffic Question Answers</h3>
              {selectedAffiliate.trafficQuestions ? (
                <ul>
                  {Object.entries(selectedAffiliate.trafficQuestions).map(
                    ([key, value]) => (
                      <li key={key}>
                        <strong>{key}:</strong>{" "}
                        {value ? value.toString() : "N/A"}
                      </li>
                    )
                  )}
                </ul>
              ) : (
                <p>No answers available.</p>
              )}
              <button
                onClick={() => setShowModal(false)}
                className={s.closeButton}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Affiliate;
