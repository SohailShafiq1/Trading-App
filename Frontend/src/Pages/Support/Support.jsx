import React, { useState, useEffect } from "react";
import styles from "./Support.module.css";
import {useAuth} from "../../Context/AuthContext";
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
    setStatus("Pending");

    // Prepare form data for file upload
    const formData = new FormData();
    formData.append("email", user.email);
    formData.append("subject", subject);
    formData.append("issue", issue);
    for (let i = 0; i < screenshots.length; i++) {
      formData.append("screenshots", screenshots[i]);
    }

    try {
      await axios.post("http://localhost:5000/api/users/support", formData, {
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
      setPopup({
        show: true,
        message: "Failed to submit your request. Please try again.",
        success: false,
      });
    }
  };

  // Fetch all requests for the user
  useEffect(() => {
    const fetchRequests = async () => {
      if (!user?.email) return;
      try {
        const res = await axios.get(
          `http://localhost:5000/api/users/support?email=${user.email}`
        );
        setRequests(res.data || []);
      } catch (err) {
        // Optionally show error popup
      }
    };
    fetchRequests();
  }, [user?.email, confirmation]); // refetch after new submission

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
          <input
            type="file"
            className={s.input}
            accept="image/*"
            multiple
            onChange={handleScreenshotChange}
          />
        </label>
        <button className={s.submitBtn} type="submit">
          Submit
        </button>
      </form>
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
      {/* Popup Modal */}
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
              className={s.submitBtn}
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
