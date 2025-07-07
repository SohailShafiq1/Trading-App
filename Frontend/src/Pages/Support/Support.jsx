import React, { useState, useEffect } from "react";
import styles from "./Support.module.css";
import { useAuth } from "../../Context/AuthContext";
import axios from "axios";
import { useTheme } from "../../Context/ThemeContext";

const s = styles;

const Support = () => {
  const { theme } = useTheme();
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
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/users/support`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

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
          `${import.meta.env.VITE_BACKEND_URL}/api/users/support?email=${
            user.email
          }`
        );
        setRequests(res.data || []);
      } catch (err) {}
    };
    fetchRequests();
  }, [user?.email, confirmation]);

  return (
    <div
      className={s.container}
      style={{ color: theme.textColor, background: theme.box }}
    >
      <h2 style={{ color: theme.textColor }}>Support Center</h2>
      <form
        className={s.form}
        onSubmit={handleSubmit}
        style={{ background: theme.box, color: theme.textColor }}
      >
        <label className={s.label} style={{ color: theme.textColor }}>
          Subject:
          <input
            type="text"
            className={s.input}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
            style={{
              background: theme.inputBackground,
              color: theme.textColor,
              border: `1px solid ${theme.border}`,
            }}
          />
        </label>
        <label className={s.label} style={{ color: theme.textColor }}>
          Describe your issue:
          <textarea
            className={s.textarea}
            value={issue}
            onChange={(e) => setIssue(e.target.value)}
            required
            style={{
              background: theme.inputBackground,
              color: theme.textColor,
              border: `1px solid ${theme.border}`,
            }}
          />
        </label>
        <label className={s.label} style={{ color: theme.textColor }}>
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
                      border: `1px solid ${theme.border}`,
                      objectFit: "cover",
                      boxShadow: theme.boxShadow,
                      background: theme.box,
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
                      background: theme.box,
                      border: `1px solid ${theme.border}`,
                      borderRadius: "50%",
                      width: 24,
                      height: 24,
                      cursor: "pointer",
                      fontWeight: "bold",
                      color: theme.warning,
                      boxShadow: theme.boxShadow,
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
              style={{ color: theme.textColor }}
            />
          )}
        </label>
        <button
          className={s.submitBtn}
          type="submit"
          disabled={loading}
          style={{ background: theme.button, color: theme.buttonText }}
        >
          {loading ? "Submitting..." : "Submit"}
        </button>
      </form>

      {loading && (
        <div className={s.loaderOverlay}>
          <div className={s.loader}></div>
          <div className={s.loaderText} style={{ color: theme.textColor }}>
            Submitting your request...
          </div>
        </div>
      )}

      {status && (
        <div className={s.statusMsg} style={{ color: theme.textColor }}>
          <strong>Status:</strong> {status}
        </div>
      )}
      {confirmation && (
        <div className={s.confirmMsg} style={{ color: theme.textColor }}>
          {confirmation}
        </div>
      )}

      <h3 style={{ marginTop: 32, color: theme.textColor }}>
        Your Support Requests
      </h3>
      <table
        className={s.table}
        style={{ background: theme.box, color: theme.textColor }}
      >
        <thead>
          <tr>
            <th style={{ color: theme.textColor, background: theme.box }}>
              Subject
            </th>
            <th style={{ color: theme.textColor, background: theme.box }}>
              Status
            </th>
            <th style={{ color: theme.textColor, background: theme.box }}>
              Date
            </th>
            <th style={{ color: theme.textColor, background: theme.box }}>
              Issue
            </th>
          </tr>
        </thead>
        <tbody>
          {requests.map((req, idx) => (
            <tr key={req._id || idx}>
              <td style={{ color: theme.textColor }}>{req.subject}</td>
              <td>
                <span
                  style={{
                    color:
                      req.status === "pending"
                        ? theme.warning
                        : req.status === "resolved"
                        ? theme.accent
                        : theme.error || "#FF1600",
                    fontWeight: 600,
                  }}
                >
                  {req.status}
                </span>
              </td>
              <td style={{ color: theme.textColor }}>
                {req.createdAt ? new Date(req.createdAt).toLocaleString() : "-"}
              </td>
              <td
                style={{
                  maxWidth: 200,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  color: theme.textColor,
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
            style={{
              borderColor: popup.success ? theme.accent : theme.warning,
              background: theme.box,
            }}
          >
            <p
              style={{
                color: popup.success ? theme.accent : theme.warning,
                fontWeight: 600,
              }}
            >
              {popup.message}
            </p>
            <button
              className={s.okBtn}
              onClick={() => setPopup({ ...popup, show: false })}
              style={{ background: theme.button, color: theme.buttonText }}
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
