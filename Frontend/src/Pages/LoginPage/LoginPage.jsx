import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../Context/AuthContext";
import styles from "./LoginPage.module.css";
import { jwtDecode as jwt_decode } from "jwt-decode";
import { NavLink } from "react-router-dom";
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const LoginPage = () => {
  const { login, googleLogin, resetPassword, user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [blockMsg, setBlockMsg] = useState("");

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
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/auth/check-admin`, {
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
      // Check for block reason in error message
      if (err.message && err.message.toLowerCase().includes("blocked")) {
        setBlockMsg(err.message); // Show custom popup
      } else {
        alert(err.message || "Login failed");
      }
    }
  };

  const handleForgotPassword = async () => {
    if (!form.email) {
      alert("Please enter your email to reset your password.");
      return;
    }
    try {
      await resetPassword(form.email);
      alert("Password reset email sent. Please check your inbox.");
    } catch (err) {
      alert(err.message || "Failed to send password reset email.");
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
        width: "100%",
      }
    );
  }, [handleCredentialResponse]);

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
    </div>
  );
};

export default LoginPage;
