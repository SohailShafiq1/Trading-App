import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../Context/AuthContext";
import styles from "./LoginPage.module.css";
import { jwtDecode as jwt_decode } from "jwt-decode";

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

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
      await login({ email: form.email, password: form.password });
      navigate("/binarychart");
    } catch (err) {
      alert(err.message || "Login failed");
    }
  };

  const handleGoogleSignIn = () => {
    if (window.google) {
      window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: handleCredentialResponse,
      });

      window.google.accounts.id.prompt();
    } else {
      console.error("Google Identity Services script not loaded.");
    }
  };

  const handleCredentialResponse = (response) => {
    const token = response.credential;
    const decoded = jwt_decode(token);
    console.log("Google decoded user:", decoded);

    googleLogin(token);
  };

  useEffect(() => {
    window.google?.accounts.id.initialize({
      client_id: CLIENT_ID,
      callback: handleCredentialResponse,
    });

    window.google?.accounts.id.renderButton(
      document.getElementById("googleBtn"),
      {
        theme: "outline",
        width: 250,
      }
    );
  }, [handleCredentialResponse]);

  return (
    <div className={styles.container}>
      <div className={styles.Header}>Sign In to Your Account</div>
      <div className={styles.Form}>
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
          <button type="submit" className={styles.loginBtn}>
            Login
          </button>
          <div id="googleBtn"></div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
