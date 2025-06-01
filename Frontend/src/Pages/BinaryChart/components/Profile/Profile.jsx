import React, { useRef, useState, useEffect } from "react";
import styles from "./Profile.module.css";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../../../Context/AuthContext";
import { useAffiliateAuth } from "../../../../Context/AffiliateAuthContext";
import axios from "axios";
import Modal from "react-modal";
import Tesseract from "tesseract.js";

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
  const [cnicBackPicture, setCnicBackPicture] = useState("");
  const [cnicBackPreview, setCnicBackPreview] = useState("");

  const [passportNumber, setPassportNumber] = useState("");
  const [passportImage, setPassportImage] = useState("");
  const [passportPreview, setPassportPreview] = useState("");
  const fileInputRef = useRef(null);

  // Delete account modal state
  const [deleteModalIsOpen, setDeleteModalIsOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState("");

  // Loading state for save operation
  const [isSaving, setIsSaving] = useState(false);

  // Add document type state
  const [documentType, setDocumentType] = useState("CNIC");

  // OCR loading state
  const [isOcrLoading, setIsOcrLoading] = useState(false);

  // CNIC back image required modal state
  const [showBackImageModal, setShowBackImageModal] = useState(false);

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
        setCnicBackPicture(res.data.cnicBackPicture || "");
        setPassportNumber(res.data.passportNumber || ""); // <-- add this
        setPassportImage(res.data.passportImage || ""); // <-- add this
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

  const handleCnicImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setCnicPreview(URL.createObjectURL(file));
      setCnicPicture(file);

      setIsOcrLoading(true); // Start OCR loader

      // OCR: Extract CNIC number from image
      Tesseract.recognize(file, "eng")
        .then(({ data: { text } }) => {
          // Find CNIC pattern in text
          const match = text.match(/\d{5}-\d{7}-\d{1}/);
          if (match) {
            setCnicNumber(match[0]);
          } else {
            // Try to find unformatted CNIC and format it
            const digits = text.replace(/\D/g, "");
            if (digits.length === 13) {
              setCnicNumber(
                `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(
                  12
                )}`
              );
            }
          }
          setIsOcrLoading(false); // Stop OCR loader
        })
        .catch(() => setIsOcrLoading(false));
    }
  };

  const handleCnicBackImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCnicBackPreview(URL.createObjectURL(file));
      setCnicBackPicture(file); // Only update back
    }
  };

  const handlePassportImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setPassportPreview(URL.createObjectURL(file));
      setPassportImage(file);

      setIsOcrLoading(true);
      Tesseract.recognize(file, "eng")
        .then(({ data: { text } }) => {
          const match = text.match(/[A-Z0-9]{9}/i);
          if (match) {
            setPassportNumber(match[0].toUpperCase());
          }
          setIsOcrLoading(false);
        })
        .catch(() => setIsOcrLoading(false));
    }
  };

  // Format CNIC input as 5 digits - 7 digits - 1 digit
  const formatCnic = (value) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, "");
    let formatted = digits;
    if (digits.length > 5 && digits.length <= 12) {
      formatted = `${digits.slice(0, 5)}-${digits.slice(5, 12)}`;
    }
    if (digits.length > 12) {
      formatted = `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(
        12,
        13
      )}`;
    }
    return formatted;
  };

  const handleCnicChange = (e) => {
    const formatted = formatCnic(e.target.value);
    setCnicNumber(formatted);
  };

  const handlePassportChange = (e) => {
    let value = e.target.value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    if (value.length > 9) value = value.slice(0, 9);
    setPassportNumber(value);
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

    // CNIC validation
    if (cnicNumber && !/^\d{5}-\d{7}-\d{1}$/.test(cnicNumber)) {
      alert("Please enter a valid CNIC in the format 81101-0747282-1");
      return;
    }

    // Require back image if front image is present but back is not
    if (
      (cnicPicture && !cnicBackPicture) ||
      (typeof cnicPicture === "object" &&
        cnicPicture instanceof File &&
        !cnicBackPicture)
    ) {
      setShowBackImageModal(true); // Show custom modal
      return;
    }

    try {
      setIsSaving(true); // Start loader
      const formData = new FormData();
      formData.append("email", email);
      formData.append("firstName", firstName);
      formData.append("lastName", lastName);
      formData.append("dateOfBirth", dateOfBirth);
      formData.append("cnicNumber", cnicNumber);
      formData.append("passportNumber", passportNumber);
      if (profilePicture && profilePicture instanceof File) {
        formData.append("profilePicture", profilePicture);
      }
      if (cnicPicture && cnicPicture instanceof File) {
        formData.append("cnicPicture", cnicPicture);
      }
      if (cnicBackPicture && cnicBackPicture instanceof File) {
        formData.append("cnicBackPicture", cnicBackPicture);
      }
      if (passportImage && passportImage instanceof File) {
        formData.append("passportImage", passportImage);
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
      setCnicBackPicture(res.data.cnicBackPicture || "");
      setCnicBackPreview("");
    } catch (err) {
      alert("Failed to update profile");
    } finally {
      setIsSaving(false); // Stop loader
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

  const handleDeleteProfileImage = async () => {
    if (!window.confirm("Delete your profile image?")) return;
    await axios.put("http://localhost:5000/api/users/update-profile", {
      email,
      profilePicture: "",
    });
    setProfilePicture("");
    setPreview("");
  };

  const handleDeleteCnicImage = async () => {
    if (!window.confirm("Delete your CNIC image and CNIC back image?")) return;
    await axios.put("http://localhost:5000/api/users/update-profile", {
      email,
      cnicPicture: "",
      cnicBackPicture: "", // <-- Also clear CNIC back image
    });
    setCnicPicture("");
    setCnicPreview("");
    setCnicBackPicture(""); // <-- Clear CNIC back image in state
    setCnicBackPreview(""); // <-- Clear CNIC back preview in state
  };

  return (
    <div className={s.container}>
      <div className={s.profileBox}>
        {/* Loader overlay */}
        {isSaving && (
          <div className={s.loaderOverlay}>
            <div className={s.loaderSpinner}></div>
            <div className={s.loaderText}>Saving...</div>
          </div>
        )}
        <h2 className={s.title}>Personal data:</h2>
        <div className={s.userInfo}>
          <div className={s.avatar}>
            <div className={s.avatarImgWrapper}>
              <label htmlFor="profilePicInput" style={{ cursor: "pointer" }}>
                {preview ? (
                  <img
                    src={preview}
                    alt="Profile Preview"
                    className={s.avatarImg}
                  />
                ) : profilePicture ? (
                  <img
                    src={
                      profilePicture.startsWith("http")
                        ? profilePicture
                        : `http://localhost:5000${profilePicture}`
                    }
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

          {/* Document type selection and CNIC number */}
          <div className={s.row}>
            <div className={s.inputBox}>
              <label>Document Type</label>
              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
              >
                <option value="CNIC">CNIC</option>
                <option value="Passport">Passport</option>
              </select>
            </div>
            {documentType === "CNIC" ? (
              <>
                <div className={s.inputBox}>
                  <label>CNIC Number</label>
                  <input
                    type="text"
                    value={cnicNumber}
                    onChange={handleCnicChange}
                    placeholder="xxxxx-xxxxxxx-x"
                    maxLength={15}
                  />
                </div>
              </>
            ) : (
              <>
                <div className={s.inputBox}>
                  <label>Passport Number</label>
                  <input
                    type="text"
                    value={passportNumber}
                    onChange={handlePassportChange}
                    placeholder="e.g. AA0000000"
                    maxLength={9}
                  />
                </div>
              </>
            )}
          </div>

          {/* Document Images */}
          {documentType === "CNIC" ? (
            <div className={s.row}>
              {/* FRONT IMAGE */}
              <div className={s.inputBox}>
                <label>{documentType} Front Image</label>
                {cnicPicture && typeof cnicPicture === "string" ? (
                  <div
                    className={s.cnicImageBox}
                    style={{ flexDirection: "column" }}
                  >
                    <img
                      src={
                        cnicPicture.startsWith("http")
                          ? cnicPicture
                          : `http://localhost:5000${
                              cnicPicture.startsWith("/") ? "" : "/"
                            }${cnicPicture}`
                      }
                      alt="Front"
                      className={s.cnicImgStyled}
                    />
                    <button
                      className={s.updateImgBtn}
                      onClick={() =>
                        document.getElementById("frontImageInput").click()
                      }
                    >
                      Update Front Image
                    </button>
                    <input
                      id="frontImageInput"
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={handleCnicImageChange}
                    />
                  </div>
                ) : (
                  <>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCnicImageChange}
                    />
                    {cnicPreview ? (
                      <img
                        src={cnicPreview}
                        alt="Front Preview"
                        className={s.cnicImgStyled}
                      />
                    ) : (
                      <span className={s.cameraIcon}>📷</span>
                    )}
                  </>
                )}
              </div>
              {/* BACK IMAGE */}
              <div className={s.inputBox}>
                <label>{documentType} Back Image</label>
                {cnicBackPicture && typeof cnicBackPicture === "string" ? (
                  <div
                    className={s.cnicImageBox}
                    style={{ flexDirection: "column" }}
                  >
                    <img
                      src={
                        cnicBackPicture.startsWith("http")
                          ? cnicBackPicture
                          : `http://localhost:5000${
                              cnicBackPicture.startsWith("/") ? "" : "/"
                            }${cnicBackPicture}`
                      }
                      alt="Back"
                      className={s.cnicImgStyled}
                    />
                    <button
                      className={s.updateImgBtn}
                      onClick={() =>
                        document.getElementById("backImageInput").click()
                      }
                    >
                      Update Back Image
                    </button>
                    <input
                      id="backImageInput"
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={handleCnicBackImageChange}
                    />
                  </div>
                ) : (
                  <>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCnicBackImageChange}
                    />
                    {cnicBackPreview ? (
                      <img
                        src={cnicBackPreview}
                        alt="Back Preview"
                        className={s.cnicImgStyled}
                      />
                    ) : (
                      <span className={s.cameraIcon}>📷</span>
                    )}
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className={s.row}>
              <div className={s.inputBox}>
                <label>Passport Number</label>
                {passportNumber &&
                passportImage &&
                typeof passportImage === "string" ? (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-start",
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 600,
                        fontSize: "1.1em",
                        marginBottom: 8,
                      }}
                    >
                      {passportNumber}
                    </span>
                    <img
                      src={
                        passportImage.startsWith("http")
                          ? passportImage
                          : `http://localhost:5000${
                              passportImage.startsWith("/") ? "" : "/"
                            }${passportImage}`
                      }
                      alt="Passport"
                      className={s.cnicImgStyled}
                      style={{ marginBottom: 8 }}
                    />
                    <button
                      className={s.popupBtn}
                      style={{ marginTop: 4 }}
                      onClick={() =>
                        document.getElementById("passportImageInput").click()
                      }
                    >
                      Update Passport Image
                    </button>
                    <input
                      id="passportImageInput"
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={handlePassportImageChange}
                    />
                  </div>
                ) : (
                  <>
                    <input
                      type="text"
                      value={passportNumber}
                      onChange={handlePassportChange}
                      placeholder="e.g. AA0000000"
                      maxLength={9}
                      style={{ marginBottom: 8 }}
                    />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePassportImageChange}
                    />
                    {passportPreview ? (
                      <img
                        src={passportPreview}
                        alt="Passport Preview"
                        className={s.cnicImgStyled}
                      />
                    ) : (
                      <span className={s.cameraIcon}>📷</span>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

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

      {/* CNIC Back Image Required Modal */}
      <Modal
        isOpen={showBackImageModal}
        onRequestClose={() => setShowBackImageModal(false)}
        style={customStyles}
        contentLabel="CNIC Back Image Required"
      >
        <div className={s.popupContainer}>
          <div className={s.popupIcon}>📄</div>
          <h2 className={s.popupTitle}>CNIC Back Image Required</h2>
          <p className={s.popupText}>
            Please provide your <b>CNIC back image</b> before saving your
            profile.
          </p>
          <button
            className={s.popupBtn}
            onClick={() => setShowBackImageModal(false)}
          >
            OK
          </button>
        </div>
      </Modal>

      {isOcrLoading && (
        <div className={s.ocrLoader}>
          <span className={s.ocrSpinner}></span>
          Extracting CNIC number from image...
        </div>
      )}
    </div>
  );
};

export default Profile;
