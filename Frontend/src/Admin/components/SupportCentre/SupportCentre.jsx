import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./SupportCentre.module.css";
const s = styles;

const SupportCentre = () => {
  const [requests, setRequests] = useState([]);
  const [selected, setSelected] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const res = await fetch(
          "http://localhost:5000/api/admin/support-requests"
        );
        const data = await res.json();
        setRequests(data);
      } catch (err) {
        setRequests([]);
      }
    };
    fetchRequests();
  }, []);

  // Mark as reviewed and show detail page
  const handleRowClick = async (req) => {
    setSelected(req);
    try {
      await fetch(
        `http://localhost:5000/api/admin/support-reviewed/${req._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
        }
      );
      // Optionally update local state for reviewed
      setRequests((prev) =>
        prev.map((r) =>
          r._id === req._id ? { ...r, reviewed: true, status: "reviewed" } : r
        )
      );
    } catch (err) {}
  };

  // Back to list
  const handleBack = () => setSelected(null);

  // Detail view
  if (selected) {
    console.log('Screenshots:', selected.screenshots);
    console.log('Image URLs:', (selected.screenshots || []).map(url => `/uploads/support/${url.split(/[\\/]/).pop()}`));
    
    return (
      <div className={s.container}>
        <button className={s.backButton} onClick={handleBack}>
          Back
        </button>
        <h2>Complaint Details</h2>
        <p>
          <strong>User:</strong> {selected.userName}
        </p>
        <p>
          <strong>Email:</strong> {selected.userEmail}
        </p>
        <p>
          <strong>Subject:</strong> {selected.subject}
        </p>
        <p>
          <strong>Issue:</strong> {selected.issue}
        </p>
        <p>
          <strong>Status:</strong> {selected.status}
        </p>
        <p>
          <strong>Reviewed:</strong> {selected.reviewed ? "Yes" : "No"}
        </p>
        <p>
          <strong>Succeed:</strong> {selected.succeed ? "Yes" : "No"}
        </p>
        <div>
          <strong>Screenshots:</strong>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
            {(selected.screenshots || []).length === 0 && <span>No screenshots</span>}
            {(selected.screenshots || []).map((url, i) => {
              // Always extract just the filename
              const filename = url.split(/[\\/]/).pop();
              const imageUrl = `/uploads/support/${filename}`;
              return (
                <img
                  key={i}
                  src={imageUrl}
                  alt={`Screenshot ${i + 1}`}
                  style={{
                    width: 120,
                    borderRadius: 6,
                    border: "1px solid #eee",
                  }}
                  onError={e => {
                    e.target.onerror = null;
                    e.target.src = '/placeholder-image.png'; // fallback
                  }}
                />
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className={s.container}>
      <button className={s.backButton} onClick={() => navigate(-1)}>
        Back
      </button>
      <h2>All Support Requests</h2>
      <table className={s.table}>
        <thead>
          <tr>
            <th>User Name</th>
            <th>Subject</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((req, idx) => (
            <tr
              key={req._id || idx}
              style={{
                cursor: "pointer",
                background: req.reviewed ? "#f5f5f5" : "",
              }}
              onClick={() => handleRowClick(req)}
            >
              <td>{req.userName || "-"}</td>
              <td>{req.subject}</td>
              <td>
                {req.reviewed ? (
                  <span style={{ color: "#10A055" }}>Reviewed</span>
                ) : (
                  <span style={{ color: "#FFA500" }}>Pending</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SupportCentre;
