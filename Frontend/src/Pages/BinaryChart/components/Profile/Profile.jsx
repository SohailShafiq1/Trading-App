import React, { useState } from "react";
import styles from "./Profile.module.css";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../../../Context/AuthContext";

const s = styles;

const Profile = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [firstName, setFirstName] = useState(user?.firstName || "James");
  const [lastName, setLastName] = useState(user?.lastName || "Charles");
  const [email, setEmail] = useState(user?.email || "example@gmail.com");
  const [password, setPassword] = useState("*******");
  const [dateOfBirth, setDateOfBirth] = useState(user?.dateOfBirth || "");
  const [country, setCountry] = useState(user?.country || "");

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className={s.container}>
      <div className={s.profileBox}>
        <h2 className={s.title}>Personal data:</h2>

        <div className={s.userInfo}>
          <div className={s.avatar}>
            <span className={s.cameraIcon}>📷</span>
          </div>
          <div>
            <p className={s.userId}>ID: {user?.id || "55468924"}</p>
          </div>
        </div>

        <div className={s.form}>
          <div className={s.row}>
            <div className={s.inputBox}>
              <label>First Name</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div className={s.inputBox}>
              <label>Last Name</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </div>

          <div className={s.row}>
            <div className={s.inputBox}>
              <label>Email</label>
              <input
                type="email"
                placeholder="example@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className={s.inputBox}>
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <div className={s.forgotBox}>
                <NavLink to="/forgot-password" className={s.forgot}>
                  Forget Your Password?
                </NavLink>
              </div>
            </div>
          </div>

          <div className={s.row}>
            <div className={s.inputBox}>
              <label>Date Of Birth</label>
              <input
                type="text"
                placeholder="DD/MM/YEAR"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
              />
            </div>
            <div className={s.inputBox}>
              <label>Country</label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
              >
                <option value="">Select Country</option>
                <option value="USA">USA</option>
                <option value="Canada">Canada</option>
                <option value="UK">UK</option>
                <option value="India">India</option>
                <option value="Australia">Australia</option>
              </select>
            </div>
          </div>

          <div className={s.actions}>
            <button className={s.saveBtn}>Save</button>
            <NavLink className={s.delete}>X Delete Account</NavLink>
          </div>
          <button className={s.logout} onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
