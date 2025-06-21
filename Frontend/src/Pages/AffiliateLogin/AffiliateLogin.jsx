import React, { useState } from "react";
import styles from "./AffiliateLogin.module.css";
import { NavLink, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAffiliateAuth } from "../../Context/AffiliateAuthContext";

const AffiliateLogin = () => {
  const navigate = useNavigate();

  const { login } = useAffiliateAuth();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [popup, setPopup] = useState({ show: false, message: "" });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login({
        email: form.email,
        password: form.password,
      });
      navigate("/affiliate");
    } catch (err) {
      let msg = err?.response?.data?.message || err?.response?.data?.msg || "Login failed.";
      if (msg.toLowerCase().includes("not found")) {
        msg = "Email not found. Please check your email or register.";
      } else if (msg.toLowerCase().includes("invalid credentials") || msg.toLowerCase().includes("password")) {
        msg = "Incorrect password. Please try again.";
      }
      setPopup({ show: true, message: msg });
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.Header}>Sign In to Affiliate Portal</div>
      <div className={styles.Form}>
        <div className={styles.tabs}>
          <div className={`${styles.loginTab} ${styles.activeTab}`}>Login</div>
          <NavLink to="/affiliate/register">Register</NavLink>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <input
            type="email"
            name="email"
            placeholder="Your Email"
            className={styles.input}
            value={form.email}
            onChange={handleChange}
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Your Password"
            className={styles.input}
            value={form.password}
            onChange={handleChange}
            required
          />

          <div className={styles.rememberForgot}>
            <label className={styles.rememberMe}>
              <input type="checkbox" name="rememberMe" />
              Remember Me
            </label>
            <div className={styles.forgotLink}>Forgot Password?</div>
          </div>

          <button type="submit" className={styles.loginBtn}>
            Login
          </button>

          <div id="googleBtn" className={styles.googleSignin}></div>
        </form>
        {popup.show && (
          <div className={styles.popupOverlay}>
            <div className={styles.popupBox}>
              <div className={styles.popupIcon}>
                {popup.message.includes("Email") ? (
                  <span role="img" aria-label="email" style={{fontSize: '2.5rem', color: '#e74c3c'}}>📧</span>
                ) : (
                  <span role="img" aria-label="lock" style={{fontSize: '2.5rem', color: '#e67e22'}}>🔒</span>
                )}
              </div>
              <div className={styles.popupTitle}>
                {popup.message.includes("Email") ? "Email Error" : "Password Error"}
              </div>
              <div className={styles.popupMsg}>{popup.message}</div>
              <button onClick={() => setPopup({ show: false, message: "" })} className={styles.closePopupBtn}>
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AffiliateLogin;
