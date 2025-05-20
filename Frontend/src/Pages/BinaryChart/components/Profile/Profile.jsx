import React, { useRef, useState, useEffect } from "react";
import styles from "./Profile.module.css";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../../../Context/AuthContext";
import axios from "axios";

const s = styles;

const Profile = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [password, setPassword] = useState("*******");
  const [dateOfBirth, setDateOfBirth] = useState(user?.dateOfBirth || "");
  const [country, setCountry] = useState(user?.country || "");
  const [userId, setUserId] = useState(""); // <-- Add userId state
  const [verified, setVerified] = useState(false); // <-- Add verified state
  const [profilePicture, setProfilePicture] = useState("");
  const [preview, setPreview] = useState("");
  const fileInputRef = useRef(null);

  // Fetch user profile from backend on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get(
          `http://localhost:5000/api/users/email/${user.email}`
        );
        setFirstName(res.data.firstName || "");
        setLastName(res.data.lastName || "");
        setEmail(res.data.email || "");
        setDateOfBirth(
          res.data.dateOfBirth ? res.data.dateOfBirth.slice(0, 10) : ""
        );
        setCountry(res.data.country || "");
        setUserId(res.data.userId || ""); // <-- Set userId from backend
        setVerified(res.data.verified || false); // <-- Set verified status
        setProfilePicture(res.data.profilePicture || "");
      } catch (err) {
        // handle error if needed
      }
    };
    if (user?.email) fetchProfile();
  }, [user?.email]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPreview(URL.createObjectURL(file));
      setProfilePicture(file);
    }
  };

  const handleSave = async () => {
    // Age validation
    if (dateOfBirth) {
      const dob = new Date(dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - dob.getFullYear();
      const m = today.getMonth() - dob.getMonth();
      const isBirthdayPassed =
        m > 0 || (m === 0 && today.getDate() >= dob.getDate());
      const realAge = isBirthdayPassed ? age : age - 1;
      if (realAge < 18) {
        alert("You must be at least 18 years old.");
        return;
      }
    }

    try {
      const formData = new FormData();
      formData.append("email", email);
      formData.append("firstName", firstName);
      formData.append("lastName", lastName);
      formData.append("dateOfBirth", dateOfBirth);
      if (profilePicture && profilePicture instanceof File) {
        formData.append("profilePicture", profilePicture);
      }

      await axios.put(
        "http://localhost:5000/api/users/update-profile",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      alert("Profile updated!");
      // Fetch updated profile
      const res = await axios.get(
        `http://localhost:5000/api/users/email/${email}`
      );
      setFirstName(res.data.firstName || "");
      setLastName(res.data.lastName || "");
      setEmail(res.data.email || "");
      setDateOfBirth(
        res.data.dateOfBirth ? res.data.dateOfBirth.slice(0, 10) : ""
      );
      setCountry(res.data.country || "");
      setUserId(res.data.userId || ""); // <-- Update userId after save
      setVerified(res.data.verified || false); // <-- Update verified status
    } catch (err) {
      alert("Failed to update profile");
    }
  };

  return (
    <div className={s.container}>
      <div className={s.profileBox}>
        <h2 className={s.title}>Personal data:</h2>
        <div className={s.userInfo}>
          <div className={s.avatar}>
            <label htmlFor="profilePicInput" style={{ cursor: "pointer" }}>
              <div className={s.avatarImgWrapper}>
                {preview ? (
                  <img
                    src={preview}
                    alt="Profile Preview"
                    className={s.avatarImg}
                  />
                ) : profilePicture ? (
                  <img
                    src={`http://localhost:5000${profilePicture}`}
                    alt="Profile"
                    className={s.avatarImg}
                  />
                ) : (
                  <span className={s.cameraIcon}>📷</span>
                )}
              </div>
              <input
                id="profilePicInput"
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                ref={fileInputRef}
                onChange={handleImageChange}
              />
            </label>
          </div>
          <div>
            <p className={s.userId}>ID: {userId || "55468924"}</p>
            <p className={verified ? s.verified : s.unverified}>
              {verified ? " Verified" : " Unverified"}
            </p>
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
                type="date"
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
            <button className={s.saveBtn} onClick={handleSave}>
              Save
            </button>
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
