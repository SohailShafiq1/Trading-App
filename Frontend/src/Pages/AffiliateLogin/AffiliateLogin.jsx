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
      alert("Affiliate login successful!");
      navigate("/affiliate"); 
    } catch (err) {
      alert(err?.response?.data?.msg || "Login failed.");
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
      </div>
    </div>
  );
};

export default AffiliateLogin;
