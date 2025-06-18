import React, { useState } from "react";
import styles from "./AffiliateRegister.module.css";
import { NavLink, useNavigate } from "react-router-dom";
import axios from "axios";
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL; // Adjust this if needed

const AffiliateRegister = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: "",
    password: "",
    country: "",
    currency: "USD",
  });
  const [error, setError] = useState("");

  const currencyOptions = ["USD", "EUR", "GBP", "JPY"];

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Client-side validation
    if (!form.email || !form.password || !form.country) {
      setError("Please fill in all required fields");
      return;
    }

    try {
      const response = await axios.post(
        `${BACKEND_URL}/api/affiliate/register`,
        {
          ...form,
          currency: form.currency.toUpperCase(),
        }
      );

      if (response.data.success) {
        alert(
          `Registration successful! Your referral code: ${response.data.data.referralCode}`
        );
        navigate("/affiliate/login");
      }
    } catch (err) {
      console.error("Registration error:", err);
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("Registration failed. Please try again.");
      }
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.Header}>Register for the Affiliate Program</div>
      <div className={styles.Form}>
        <div className={styles.tabs}>
          <NavLink to="/affiliate/login">Login</NavLink>
          <div className={`${styles.registerTab} ${styles.activeTab}`}>
            Register
          </div>
        </div>

        {error && <div className={styles.errorMessage}>{error}</div>}

        <form className={styles.form} onSubmit={handleSubmit}>
          <select
            name="country"
            className={styles.input}
            value={form.country}
            onChange={handleChange}
            required
          >
            <option value="">Select Country</option>
            <option value="USA">USA</option>
            <option value="UK">UK</option>
          </select>

          <select
            name="currency"
            className={styles.input}
            value={form.currency}
            onChange={handleChange}
            required
          >
            {currencyOptions.map((currency) => (
              <option key={currency} value={currency}>
                {currency}
              </option>
            ))}
          </select>

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
            placeholder="Your Password (min 6 characters)"
            className={styles.input}
            value={form.password}
            onChange={handleChange}
            minLength={6}
            required
          />

          {/* First Checkbox */}
          <label className={styles.checkboxGroup}>
            <input type="checkbox" required className={styles.checkBox} />I
            confirm that I am 18 years old or older and accept Service
            Agreement.
          </label>

          {/* Second Checkbox (US Tax Residency) */}
          <label className={styles.checkboxGroup}>
            <input type="checkbox" required className={styles.checkBox} />I
            declare that I am not a citizen/resident of the US for tax purposes
          </label>

          <button type="submit" className={styles.registerBtn}>
            Register
          </button>

          <button type="button" className={styles.googleBtn}>
            <img
              src="https://www.svgrepo.com/show/475656/google-color.svg"
              alt="Google"
            />
            Sign up with Google
          </button>
        </form>
      </div>
    </div>
  );
};

export default AffiliateRegister;
