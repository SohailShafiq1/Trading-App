import React, { useState } from "react";
import styles from "./RegisterPage.module.css";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../Context/AuthContext";

const s = styles;

const RegisterPage = () => {
  const { register, googleLogin } = useAuth();
  const navigate = useNavigate();

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.confirmAge || !form.confirmTax) {
      alert("Please confirm age and tax status.");
      return;
    }
    try {
      await register(form);
      navigate("/login");
    } catch (err) {
      alert(err.response?.data?.message || "Registration failed");
    }
  };

  return (
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
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                password: e.target.value.replace(/[^a-zA-Z0-9@]/g, ""),
              }))
            }
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
            I declare that I am not a citizen/resident of the US for tax
            purposes.
          </label>

          <button
            type="submit"
            onClick={handleSubmit}
            className={s.registerBtn}
          >
            Register
          </button>

          <button type="button" className={s.googleBtn} onClick={googleLogin}>
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

export default RegisterPage;
