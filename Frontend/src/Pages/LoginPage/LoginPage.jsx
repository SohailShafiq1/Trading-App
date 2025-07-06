import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../Context/AuthContext";
import styles from "./LoginPage.module.css";
import { jwtDecode as jwt_decode } from "jwt-decode";
import { NavLink } from "react-router-dom";
const CLIENT_ID = import.meta.env.VITE_OAUTH_CLIENT_ID;
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL; // Adjust this if needed

const LoginPage = () => {
  const { login, googleLogin, resetPassword, user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [blockMsg, setBlockMsg] = useState("");
  const [popup, setPopup] = useState({ show: false, message: "", type: "" });

  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberedEmail");
    if (savedEmail) {
      setForm((prev) => ({ ...prev, email: savedEmail, rememberMe: true }));
    }
  }, []);

  const handleChange = (e) => {
    const { name, type, value, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/check-admin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: form.email }),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to check admin status");
      }
      // Successful login
      await login({ email: form.email, password: form.password });

      if (form.rememberMe) {
        localStorage.setItem("rememberedEmail", form.email);
      } else {
        localStorage.removeItem("rememberedEmail");
      }

      if (data.isAdmin === true) {
        navigate("/admin");
      } else {
        navigate("/binarychart");
      }
    } catch (err) {
      const errMsg = err?.response?.data?.message || err?.message || "Login failed";
      if (errMsg && errMsg.toLowerCase().includes("blocked")) {
        setBlockMsg(errMsg); // Show custom popup
      } else if (errMsg && (errMsg.toLowerCase().includes("not found") || errMsg.toLowerCase().includes("no user"))) {
        setPopup({ show: true, message: "Email not found. Please check your email or register.", type: "email" });
      } else if (errMsg && (errMsg.toLowerCase().includes("invalid credentials") || errMsg.toLowerCase().includes("password") || errMsg.toLowerCase().includes("401"))) {
        setPopup({ show: true, message: "Incorrect password. Please try again.", type: "password" });
      } else {
        setPopup({ show: true, message: errMsg, type: "other" });
      }
    }
  };

  const handleForgotPassword = async () => {
    if (!form.email) {
      setPopup({ show: true, message: "Please enter your email to reset your password.", type: "email" });
      return;
    }
    // Navigate to forgot password page with email pre-filled
    navigate(`/forgot-password?email=${encodeURIComponent(form.email)}`);
  };

  const handleGoogleSignIn = () => {
    if (window.google) {
      try {
        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: handleCredentialResponse,
        });

        window.google.accounts.id.prompt();
      } catch (error) {
        console.error("Google Sign-In initialization error:", error);
        setPopup({ show: true, message: "Google Sign-In is not properly configured. Please contact support.", type: "other" });
      }
    } else {
      console.error("Google Identity Services script not loaded.");
      setPopup({ show: true, message: "Google Sign-In is not available. Please try again later.", type: "other" });
    }
  };

  const handleCredentialResponse = async (response) => {
    try {
      const token = response.credential;
      await googleLogin(token, false); // false = this is login, not registration

      // Check if user is admin
      const decoded = jwt_decode(token);
      const res = await fetch(`${BACKEND_URL}/api/auth/check-admin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: decoded.email }),
      });

      const data = await res.json();

      if (data.isAdmin === true) {
        navigate("/admin");
      } else {
        navigate("/binarychart");
      }
    } catch (err) {
      if (err.response?.data?.needsRegistration) {
        setPopup({ show: true, message: "Account not found. Please register first.", type: "email" });
        navigate("/register");
      } else {
        setPopup({ show: true, message: err.response?.data?.message || "Google login failed", type: "other" });
      }
    }
  };

  useEffect(() => {
    if (window.google) {
      try {
        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: handleCredentialResponse,
        });

        window.google.accounts.id.renderButton(
          document.getElementById("googleBtn"),
          {
            theme: "outline",
            width: "100%",
          }
        );
        console.log("Google button rendered successfully");
      } catch (error) {
        console.error("Google initialization error:", error);
      }
    } else {
      console.error("Google Identity Services not loaded");
    }
  }, []); // Remove handleCredentialResponse from dependencies since it's now async

  return (
    <div className={styles.container}>
      <div className={styles.Header}>Sign In to Your Account</div>
      <div className={styles.Form}>
        <div className={styles.tabs}>
          <div className={`${styles.loginTab} ${styles.activeTab}`}>Login</div>
          <NavLink to={"/register"}>Register</NavLink>
        </div>
        <form className={styles.form} onSubmit={handleSubmit}>
          <input
            type="email"
            name="email"
            placeholder="Your Email"
            value={form.email}
            onChange={handleChange}
            className={styles.input}
          />
          <input
            type="password"
            name="password"
            placeholder="Your Password"
            value={form.password}
            onChange={handleChange}
            className={styles.input}
          />
          <div className={styles.rememberForgot}>
            <div className={styles.rememberMe}>
              <label>
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={form.rememberMe}
                  onChange={handleChange}
                />
                Remember Me
              </label>
            </div>
            <div className={styles.forgotLink} onClick={handleForgotPassword}>
              Forgot Password?
            </div>
          </div>
          <button className={styles.loginBtn}>Login</button>
          <div id="googleBtn" className={styles.googleSignin}></div>
        </form>
      </div>
      {blockMsg && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3>Account Blocked</h3>
            <p>{blockMsg}</p>
            <button
              className={styles.closeButton}
              onClick={() => setBlockMsg("")}
            >
              OK
            </button>
          </div>
        </div>
      )}
      {popup.show && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.popupIcon}>
              {popup.type === "email" ? (
                <span role="img" aria-label="email" style={{fontSize: '2.5rem', color: '#e74c3c'}}>📧</span>
              ) : popup.type === "password" ? (
                <span role="img" aria-label="lock" style={{fontSize: '2.5rem', color: '#e67e22'}}>🔒</span>
              ) : (
                <span role="img" aria-label="error" style={{fontSize: '2.5rem', color: '#e67e22'}}>⚠️</span>
              )}
            </div>
            <div className={styles.popupTitle}>
              {popup.type === "email"
                ? "Email Error"
                : popup.type === "password"
                ? "Password Error"
                : "Login Error"}
            </div>
            <div className={styles.popupMsg}>{popup.message}</div>
            <button
              className={styles.closeButton}
              onClick={() => setPopup({ show: false, message: "", type: "" })}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;
