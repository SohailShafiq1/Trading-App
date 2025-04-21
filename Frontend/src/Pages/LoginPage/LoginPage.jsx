import React, { useState } from "react";
import styles from "./LoginPage.module.css";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../Context/AuthContext";

const s = styles;

const LoginPage = () => {
  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
    rememberMe: false,
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
    try {
      await login(form);
      navigate("/binarychart");
    } catch (err) {
      alert(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className={s.container}>
      <div className={s.Header}>Sign In to Your Account</div>
      <div className={s.Form}>
        <div className={s.tabs}>
          <div className={`${s.loginTab} ${s.activeTab}`}>Login</div>
          <NavLink to={"/register"}>Register</NavLink>
        </div>

        <form className={s.form} onSubmit={handleSubmit}>
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

          <div className={s.optionsRow}>
            <label className={s.checkboxGroup}>
              <input
                type="checkbox"
                name="rememberMe"
                checked={form.rememberMe}
                onChange={handleChange}
              />
              Remember Me
            </label>
            <NavLink to="/forgot" className={s.forgotLink}>
              Forget Your Password?
            </NavLink>
          </div>

          <button type="submit" onClick={handleSubmit} className={s.loginBtn}>
            Login
          </button>

          <button type="button" className={s.googleBtn} onClick={googleLogin}>
            <img
              src="https://www.svgrepo.com/show/475656/google-color.svg"
              alt="Google"
            />
            Sign in with Google
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
