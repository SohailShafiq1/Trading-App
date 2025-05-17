import React, { useState } from "react";
import styles from "./AffiliateRegister.module.css";
import { NavLink, useNavigate } from "react-router-dom";
import axios from "axios";

const s = styles;

const AffiliateRegister = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: "",
    password: "",
    country: "",
    currency: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await axios.post("http://localhost:5000/api/affiliate/register", form);
      alert("Affiliate registration successful!");
      navigate("/affiliate/login");
    } catch (err) {
      if (!err.response) {
        alert("Network error: Please check your internet connection.");
      } else {
        console.log(err.response.data.message);
      }
    }
  };

  return (
    <div className={s.container}>
      <div className={s.Header}>Register for the Affiliate Program</div>
      <div className={s.Form}>
        <div className={s.tabs}>
          <NavLink to="/affiliate/login">Login</NavLink>
          <div className={`${s.registerTab} ${s.activeTab}`}>Register</div>
        </div>

        <form className={s.form} onSubmit={handleSubmit}>
          <select
            name="country"
            className={s.input}
            value={form.country}
            onChange={handleChange}
            required
          >
            <option value="">Select Country</option>
            <option value="USA">USA</option>
            <option value="Pakistan">Pakistan</option>
            <option value="UK">UK</option>
          </select>

          <select
            name="currency"
            className={s.input}
            value={form.currency}
            onChange={handleChange}
          >
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
          </select>

          <input
            type="email"
            name="email"
            placeholder="Your Email"
            className={s.input}
            value={form.email}
            onChange={handleChange}
            required
          />

          <input
            type="password"
            name="password"
            placeholder="Your Password"
            className={s.input}
            value={form.password}
            onChange={handleChange}
            required
          />

          <label className={s.checkboxGroup}>
            <input type="checkbox" required className={s.checkBox} />I confirm
            that I am 18+ and accept the terms.
          </label>

          <label className={s.checkboxGroup}>
            <input type="checkbox" required className={s.checkBox} />I declare
            I'm not a US tax resident.
          </label>

          <button type="submit" className={s.registerBtn}>
            Register
          </button>

          <button type="button" className={s.googleBtn}>
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
