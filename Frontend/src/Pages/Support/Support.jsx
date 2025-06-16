import React, { useState, useEffect } from "react";
import styles from "./Support.module.css";
import { useAuth } from "../../Context/AuthContext";
import axios from "axios";

const s = styles;

const Support = () => {
  const { user } = useAuth();
  const [subject, setSubject] = useState("");
  const [issue, setIssue] = useState("");
  const [screenshots, setScreenshots] = useState([]);
  const [status, setStatus] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [popup, setPopup] = useState({
    show: false,
    message: "",
    success: false,
  });
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleScreenshotChange = (e) => {
    setScreenshots([...e.target.files]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user?.email) {
      setPopup({
        show: true,
        message: "You must be logged in to submit a complaint.",
        success: false,
      });
      return;
    }

    setLoading(true); // Start loader
    setStatus("Pending");
    const formData = new FormData();
    formData.append("email", user.email);
    formData.append("subject", subject);
    formData.append("issue", issue);
    screenshots.forEach((file) => {
      formData.append("screenshots", file);
    });

    try {
      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/users/support`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setConfirmation(
        "Your request has been received. Our team will contact you ASAP!"
      );
      setSubject("");
      setIssue("");
      setScreenshots([]);
      setPopup({
        show: true,
        message:
          "Your request has been received. Our team will contact you ASAP!",
        success: true,
      });
    } catch (err) {
      console.error("Error submitting support request:", err);
      setPopup({
        show: true,
        message: "Failed to submit your request. Please try again.",
        success: false,
      });
    } finally {
      setLoading(false); // Stop loader
    }
  };

  useEffect(() => {
    const fetchRequests = async () => {
      if (!user?.email) return;
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/users/support?email=${user.email}`
        );
        setRequests(res.data || []);
      } catch (err) {}
    };
    fetchRequests();
  }, [user?.email, confirmation]);

  return (
    <div className={s.container}>
      <h2>Support Center</h2>
      <form className={s.form} onSubmit={handleSubmit}>
        <label className={s.label}>
          Subject:
          <input
            type="text"
            className={s.input}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
          />
        </label>
        <label className={s.label}>
          Describe your issue:
          <textarea
            className={s.textarea}
            value={issue}
            onChange={(e) => setIssue(e.target.value)}
            required
          />
        </label>
        <label className={s.label}>
          Add Screenshots:
          {screenshots.length > 0 ? (
            <div style={{ display: "flex", gap: 12, margin: "10px 0" }}>
              {screenshots.map((file, idx) => (
                <div key={idx} style={{ position: "relative" }}>
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`Screenshot ${idx + 1}`}
                    style={{
                      width: 120,
                      borderRadius: 6,
                      border: "1px solid #eee",
                      objectFit: "cover",
                      boxShadow: "0 2px 8px rgba(44,62,80,0.08)",
                    }}
                  />
                  <button
                    type="button"
                    className={s.removeImgBtn}
                    onClick={() =>
                      setScreenshots(screenshots.filter((_, i) => i !== idx))
                    }
                    title="Remove"
                    style={{
                      position: "absolute",
                      top: 2,
                      right: 2,
                      background: "#fff",
                      border: "none",
                      borderRadius: "50%",
                      width: 24,
                      height: 24,
                      cursor: "pointer",
                      fontWeight: "bold",
                      color: "#d32f2f",
                      boxShadow: "0 1px 4px rgba(44,62,80,0.12)",
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <input
              type="file"
              name="screenshots"
              className={s.input}
              accept="image/*"
              multiple
              onChange={handleScreenshotChange}
            />
          )}
        </label>
        <button className={s.submitBtn} type="submit" disabled={loading}>
          {loading ? "Submitting..." : "Submit"}
        </button>
      </form>

      {loading && (
        <div className={s.loaderOverlay}>
          <div className={s.loader}></div>
          <div className={s.loaderText}>Submitting your request...</div>
        </div>
      )}

      {status && (
        <div className={s.statusMsg}>
          <strong>Status:</strong> {status}
        </div>
      )}
      {confirmation && <div className={s.confirmMsg}>{confirmation}</div>}

      <h3 style={{ marginTop: 32 }}>Your Support Requests</h3>
      <table className={s.table}>
        <thead>
          <tr>
            <th>Subject</th>
            <th>Status</th>
            <th>Date</th>
            <th>Issue</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((req, idx) => (
            <tr key={req._id || idx}>
              <td>{req.subject}</td>
              <td>
                <span
                  style={{
                    color:
                      req.status === "pending"
                        ? "#FFA500"
                        : req.status === "resolved"
                        ? "#10A055"
                        : "#FF1600",
                    fontWeight: 600,
                  }}
                >
                  {req.status}
                </span>
              </td>
              <td>
                {req.createdAt ? new Date(req.createdAt).toLocaleString() : "-"}
              </td>
              <td
                style={{
                  maxWidth: 200,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {req.issue}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {popup.show && (
        <div className={s.popupOverlay}>
          <div
            className={s.popupBox}
            style={{ borderColor: popup.success ? "#10A055" : "#FF1600" }}
          >
            <p
              style={{
                color: popup.success ? "#10A055" : "#FF1600",
                fontWeight: 600,
              }}
            >
              {popup.message}
            </p>
            <button
              className={s.okBtn}
              onClick={() => setPopup({ ...popup, show: false })}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Support;
