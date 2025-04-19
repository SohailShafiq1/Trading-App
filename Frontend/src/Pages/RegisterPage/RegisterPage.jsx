import React, { useState, useEffect } from "react";
import styles from "./RegisterPage.module.css";
import { NavLink } from "react-router-dom";
const s = styles;

const RegisterPage = () => {
  const [form, setForm] = useState({
    country: "",
    currency: "USD",
    email: "",
    password: "",
    confirmAge: false,
    confirmTax: false,
  });

  const handleChange = (e) => {
    const { name, type, value, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(form);
  };

  return (
    <>
      <div className={s.container}>
        <div className={s.Header}>Register Now for Smart Investing!</div>
        <div className={s.Form}>
          <div className={s.tabs}>
            <NavLink to={"/login"}>Login</NavLink>
            <div className={`${s.registerTab} ${s.activeTab}`}>Register</div>
          </div>

          <form className={s.form} onSubmit={handleSubmit}>
            <select
              name="country"
              value={form.country}
              onChange={handleChange}
              className={s.input}
            >
              <option value="">Select Country</option>
              <option value="USA">USA</option>
              <option value="Pakistan">Pakistan</option>
              <option value="UK">UK</option>
            </select>

            <select
              name="currency"
              value={form.currency}
              onChange={handleChange}
              className={s.input}
            >
              <option value="USD">USD</option>
              <option value="PKR">PKR</option>
              <option value="EUR">EUR</option>
            </select>

            <input
              type="email"
              name="email"
              placeholder="Your Email"
              value={form.email}
              onChange={handleChange}
              className={s.input}
            />

            <input
              type="password"
              name="password"
              placeholder="Your Password"
              value={form.password}
              onChange={handleChange}
              className={s.input}
            />

            <label className={s.checkboxGroup}>
              <input
                type="checkbox"
                name="confirmAge"
                checked={form.confirmAge}
                onChange={handleChange}
                className={s.checkBox}
              />
              I confirm that I am 18 years old or older and accept Service
              Agreement.
            </label>

            <label className={s.checkboxGroup}>
              <input
                type="checkbox"
                name="confirmTax"
                checked={form.confirmTax}
                onChange={handleChange}
                className={s.checkBox}
              />
              I declare and confirm that I am not a citizen or resident of the
              US for tax purposes.
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
    </>
  );
};

export default RegisterPage;
