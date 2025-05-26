import React, { useRef, useState, useEffect } from "react";
import styles from "./Profile.module.css";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../../../Context/AuthContext";
import { useAffiliateAuth } from "../../../../Context/AffiliateAuthContext";
import axios from "axios";
import Modal from "react-modal";

const s = styles;

// Modal styles
const customStyles = {
  content: {
    top: "50%",
    left: "50%",
    right: "auto",
    bottom: "auto",
    marginRight: "-50%",
    transform: "translate(-50%, -50%)",
    maxWidth: "400px",
    width: "90%",
    padding: "20px",
    borderRadius: "8px",
    boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
  },
  overlay: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    zIndex: 1000,
  },
};

const Profile = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { logoutAffiliate } = useAffiliateAuth();

  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [password, setPassword] = useState("*******");
  const [dateOfBirth, setDateOfBirth] = useState(user?.dateOfBirth || "");
  const [country, setCountry] = useState(user?.country || "");
  const [userId, setUserId] = useState("");
  const [verified, setVerified] = useState(false);
  const [profilePicture, setProfilePicture] = useState("");
  const [preview, setPreview] = useState("");
  const [cnicNumber, setCnicNumber] = useState(user?.cnicNumber || "");
  const [cnicPicture, setCnicPicture] = useState("");
  const [cnicPreview, setCnicPreview] = useState("");
  const fileInputRef = useRef(null);

  // Delete account modal state
  const [deleteModalIsOpen, setDeleteModalIsOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState("");

  // Set app element for react-modal (for accessibility)
  Modal.setAppElement("#root");

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
        setUserId(res.data.userId || "");
        setVerified(res.data.verified || false);
        setProfilePicture(res.data.profilePicture || "");
        setCnicNumber(res.data.cnicNumber || "");
        setCnicPicture(res.data.cnicPicture || "");
      } catch (err) {
        console.error("Error fetching profile:", err);
      }
    };
    if (user?.email) fetchProfile();
  }, [user?.email]);

  const handleLogout = () => {
    logout();
    logoutAffiliate();
    navigate("/login");
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPreview(URL.createObjectURL(file));
      setProfilePicture(file);
    }
  };

  const handleCnicImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCnicPreview(URL.createObjectURL(file));
      setCnicPicture(file);
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
      formData.append("cnicNumber", cnicNumber);
      if (profilePicture && profilePicture instanceof File) {
        formData.append("profilePicture", profilePicture);
      }
      if (cnicPicture && cnicPicture instanceof File) {
        formData.append("cnicPicture", cnicPicture);
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
      setUserId(res.data.userId || "");
      setVerified(res.data.verified || false);
    } catch (err) {
      alert("Failed to update profile");
    }
  };

  const openDeleteModal = () => {
    setDeleteModalIsOpen(true);
    setDeletePassword("");
    setDeleteError("");
  };

  const closeDeleteModal = () => {
    setDeleteModalIsOpen(false);
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      setDeleteError("Please enter your password");
      return;
    }

    try {
      await axios.delete("http://localhost:5000/api/auth/delete-account", {
        data: {
          email: user.email, // Pass current user's email
          password: deletePassword,
        },
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      alert("Your account has been deleted successfully");
      logout();
      navigate("/register");
    } catch (err) {
      setDeleteError(
        err.response?.data?.message ||
          "Failed to delete account. Please try again."
      );
    }
  };
  return (
    <div className={s.container}>
      <div className={s.profileBox}>
        <h2 className={s.title}>Personal data:</h2>
        <div className={s.userInfo}>
          <div className={s.avatar}>
            <div className={s.avatarImgWrapper}>
              {verified ? (
                profilePicture ? (
                  <img
                    src={`http://localhost:5000${profilePicture}`}
                    alt="Profile"
                    className={s.avatarImg}
                  />
                ) : (
                  <span className={s.cameraIcon}>📷</span>
                )
              ) : (
                <label htmlFor="profilePicInput" style={{ cursor: "pointer" }}>
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
                  <input
                    id="profilePicInput"
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    ref={fileInputRef}
                    onChange={handleImageChange}
                  />
                </label>
              )}
            </div>
          </div>
          <div>
            <p className={s.userId}>ID: {userId || "N/A"}</p>
            <p className={verified ? s.verified : s.unverified}>
              {verified ? "Verified" : "Unverified"}
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
                disabled
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

          <div className={s.row}>
            <div className={s.inputBox}>
              <label>CNIC Number</label>
              <input
                type="text"
                value={cnicNumber}
                onChange={(e) => setCnicNumber(e.target.value)}
                placeholder="Enter your CNIC number"
              />
            </div>
            <div className={s.inputBox}>
              <label>CNIC Picture</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleCnicImageChange}
              />
              {cnicPreview ? (
                <img
                  src={cnicPreview}
                  alt="CNIC Preview"
                  className={s.cnicImg}
                />
              ) : cnicPicture && typeof cnicPicture === "string" ? (
                <img
                  src={
                    cnicPicture.startsWith("http")
                      ? cnicPicture
                      : `http://localhost:5000${
                          cnicPicture.startsWith("/") ? "" : "/"
                        }${cnicPicture}`
                  }
                  alt="CNIC"
                  className={s.cnicImg}
                />
              ) : (
                <span className={s.cameraIcon}>📷</span>
              )}
            </div>
          </div>

          <div className={s.actions}>
            <button className={s.saveBtn} onClick={handleSave}>
              Save
            </button>
            <button className={s.delete} onClick={openDeleteModal}>
              X Delete Account
            </button>
          </div>
          <button className={s.logout} onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      {/* Delete Account Modal */}
      <Modal
        isOpen={deleteModalIsOpen}
        onRequestClose={closeDeleteModal}
        style={customStyles}
        contentLabel="Delete Account Confirmation"
      >
        <h2>Delete Account</h2>
        <p>
          Are you sure you want to delete your account? This action cannot be
          undone.
        </p>

        <div className={s.inputBox}>
          <label>Enter your password to confirm:</label>
          <input
            type="password"
            value={deletePassword}
            onChange={(e) => setDeletePassword(e.target.value)}
            placeholder="Your password"
          />
          {deleteError && <p className={s.errorText}>{deleteError}</p>}
        </div>

        <div className={s.modalActions}>
          <button className={s.cancelBtn} onClick={closeDeleteModal}>
            Cancel
          </button>
          <button className={s.deleteBtn} onClick={handleDeleteAccount}>
            Delete Account
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default Profile;
