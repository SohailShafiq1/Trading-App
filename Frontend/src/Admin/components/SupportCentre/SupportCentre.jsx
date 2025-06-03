import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./SupportCentre.module.css";
const s = styles;

const SupportCentre = () => {
  const [requests, setRequests] = useState([]);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(false); // <-- Add this
  const [completing, setCompleting] = useState(false);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRequests = async () => {
      setLoading(true); // Start loader
      try {
        const res = await fetch(
          "http://localhost:5000/api/admin/support-requests"
        );
        const data = await res.json();
        setRequests(data);
      } catch (err) {
        setRequests([]);
      } finally {
        setLoading(false); // Stop loader
      }
    };
    fetchRequests();
  }, []);

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
      setRequests((prev) =>
        prev.map((r) =>
          r._id === req._id ? { ...r, reviewed: true, status: "reviewed" } : r
        )
      );
    } catch (err) {}
  };

  const handleBack = () => setSelected(null);

  const handleMarkCompleted = async () => {
    setCompleting(true);
    try {
      await fetch(
        `http://localhost:5000/api/admin/support-completed/${selected._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
        }
      );
      setSelected((prev) => ({ ...prev, succeed: true, status: "succeed" }));
      setRequests((prev) =>
        prev.map((r) =>
          r._id === selected._id
            ? { ...r, succeed: true, status: "succeed" }
            : r
        )
      );
    } catch (err) {
      // Optionally handle error
    } finally {
      setCompleting(false);
    }
  };

  // Filtering logic
  const filteredRequests = requests.filter((req) => {
    const matchesFilter =
      filter === "pending"
        ? !req.succeed && !req.reviewed
        : filter === "completed"
        ? req.succeed
        : filter === "reviewed"
        ? req.reviewed && !req.succeed
        : true;
    const searchLower = search.toLowerCase();
    const matchesSearch = search
      ? (req.userId || "").toLowerCase().includes(searchLower) ||
        (req.userName || "").toLowerCase().includes(searchLower) ||
        (req.userEmail || "").toLowerCase().includes(searchLower)
      : true;
    return matchesFilter && matchesSearch;
  });

  if (selected) {
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
          <div
            style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}
          >
            {(selected.screenshots || []).length === 0 && (
              <span>No screenshots</span>
            )}
            {(selected.screenshots || []).map((imageUrl, i) => (
              <img
                key={i}
                src={imageUrl}
                alt={`Screenshot ${i + 1}`}
                style={{
                  width: 120,
                  borderRadius: 6,
                  border: "1px solid #eee",
                }}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "/placeholder-image.png";
                }}
              />
            ))}
          </div>
        </div>
        {/* Status Badge */}
        <div style={{ margin: "18px 0 10px 0" }}>
          {selected.succeed ? (
            <span className={s.statusSucceed}>Completed</span>
          ) : selected.reviewed ? (
            <span className={s.statusReviewed}>Reviewed</span>
          ) : (
            <span className={s.statusPending}>Pending</span>
          )}
        </div>
        {!selected.succeed && (
          <>
            <button
              className={s.completedButton}
              onClick={handleMarkCompleted}
              style={{ marginBottom: 16 }}
              disabled={completing}
            >
              {completing ? "Completing..." : "Mark as Completed"}
            </button>
            {completing && (
              <div className={s.loaderOverlay}>
                <div className={s.loader}></div>
                <div className={s.loaderText}>Marking as completed...</div>
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  return (
    <div className={s.container}>
      <button className={s.backButton} onClick={() => navigate(-1)}>
        Back
      </button>
      <h2>All Support Requests</h2>
      {/* Filter Buttons */}
      <div style={{ margin: "18px 0 20px 0", display: "flex", gap: 12 }}>
        <button
          className={filter === "all" ? s.activeFilterButton : s.filterButton}
          onClick={() => setFilter("all")}
        >
          All
        </button>
        <button
          className={
            filter === "pending" ? s.activeFilterButton : s.filterButton
          }
          onClick={() => setFilter("pending")}
        >
          Pending
        </button>
        <button
          className={
            filter === "reviewed" ? s.activeFilterButton : s.filterButton
          }
          onClick={() => setFilter("reviewed")}
        >
          Reviewed
        </button>
        <button
          className={
            filter === "completed" ? s.activeFilterButton : s.filterButton
          }
          onClick={() => setFilter("completed")}
        >
          Completed
        </button>
      </div>
      {/* Search Input */}
      <div
        style={{
          margin: "10px 0 18px 0",
          display: "flex",
          gap: 12,
          alignItems: "center",
        }}
      >
        <input
          type="text"
          className={s.input}
          placeholder="Search by User ID"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            minWidth: 220,
            padding: "8px 12px",
            borderRadius: 6,
            border: "1px solid #bbb",
          }}
        />
      </div>
      {loading ? ( // <-- Show loading indicator when loading
        <div className={s.loaderOverlay}>
          <div className={s.loader}></div>
          <div className={s.loaderText}>Loading support requests...</div>
        </div>
      ) : (
        <table className={s.table}>
          <thead>
            <tr>
              <th>User ID</th>
              <th>User Name</th>
              <th>Email</th>
              <th>Subject</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredRequests.map((req, idx) => (
              <tr
                key={req._id || idx}
                style={{
                  cursor: "pointer",
                  background: req.reviewed ? "#f5f5f5" : "",
                }}
                onClick={() => handleRowClick(req)}
              >
                <td>{req.userId || "-"}</td>
                <td>{req.userName || "-"}</td>
                <td>{req.userEmail || "-"}</td>
                <td>{req.subject}</td>
                <td>
                  {req.succeed ? (
                    <span className={s.statusSucceed}>Completed</span>
                  ) : req.reviewed ? (
                    <span className={s.statusReviewed}>Reviewed</span>
                  ) : (
                    <span className={s.statusPending}>Pending</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default SupportCentre;
