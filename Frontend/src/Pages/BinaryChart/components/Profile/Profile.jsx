import React, { useRef, useState, useEffect } from "react";
import styles from "./Profile.module.css";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../../../Context/AuthContext";
import { useAffiliateAuth } from "../../../../Context/AffiliateAuthContext";
import axios from "axios";
import Modal from "react-modal";
import Tesseract from "tesseract.js";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useTheme } from "../../../../Context/ThemeContext";

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
  const { theme } = useTheme();

  // Ensure all state variables have default values to avoid uncontrolled inputs
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
  const [authType, setAuthType] = useState("email");
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
          `${import.meta.env.VITE_BACKEND_URL}/api/users/email/${user.email}`
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
        setPassportNumber(res.data.passportNumber || "");
        setPassportImage(res.data.passportImage || "");
        setAuthType(res.data.authType || "email");

        // --- Add this block ---
        if (res.data.passportImage) {
          setPassportPreview(
            res.data.passportImage.startsWith("http")
              ? res.data.passportImage
              : `${import.meta.env.VITE_BACKEND_URL}/${
                  res.data.passportImage.startsWith("/") ? "" : "/"
                }${res.data.passportImage}`
          );
        } else {
          setPassportPreview("");
        }
        // --- End block ---
      } catch (err) {
        console.error("Error fetching profile:", err);
      }
    };
    if (user?.email) fetchProfile();
  }, [user?.email]);

  const logoutNotification = () => {
    axios
      .post(
        `${import.meta.env.VITE_BACKEND_URL}/api/users/notifications/create`,
        {
          email: user.email,
          notification: {
            type: "Logout",
            message: "You have successfully logged out.",
          },
        }
      )
      .catch((err) => {
        console.error("Error creating logout notification:", err);
      });
  };

  const handleLogout = () => {
    logoutNotification();
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

      setIsOcrLoading(true);

      Tesseract.recognize(file, "eng")
        .then(({ data: { text } }) => {
          const match = text.match(/\d{5}-\d{7}-\d{1}/);
          if (match) {
            setCnicNumber(match[0]);
          } else {
            const digits = text.replace(/\D/g, "");
            if (digits.length === 13) {
              setCnicNumber(
                `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(
                  12
                )}`
              );
            }
          }
          setIsOcrLoading(false);
        })
        .catch((err) => {
          setIsOcrLoading(false);
          setCnicPicture("");
          console.error("OCR error:", err);
        });
    }
  };

  const handleCnicBackImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCnicBackPreview(URL.createObjectURL(file));
      setCnicBackPicture(file);
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
    // Ensure all required fields are validated before sending the request
    if (!firstName || !lastName || !email) {
      toast.error("First Name, Last Name, and Email are required.");
      return;
    }

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
        toast.error("You must be at least 18 years old.");
        return;
      }
    }

    // CNIC validation
    if (cnicNumber && !/^[\d]{5}-[\d]{7}-[\d]{1}$/.test(cnicNumber)) {
      toast.error("Please enter a valid CNIC in the format 81101-0747282-1");
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
      // Ensure country is always a string and log it for debugging
      const countryToSend = typeof country === "string" ? country : "";
      console.log("Country being sent to backend:", countryToSend);
      formData.append("country", countryToSend);
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

      // Debugging: Log FormData keys and values
      for (let [key, value] of formData.entries()) {
        console.log(`${key}:`, value);
      }

      await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/api/users/update-profile`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      toast.success("Profile updated!");
      // Fetch updated profile
      const res = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/users/email/${email}`
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
      setPassportNumber(res.data.passportNumber || ""); // <-- ADD THIS

      // --- Call auto-verify endpoint ---
      try {
        const autoVerifyRes = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/users/auto-verify/${
            res.data._id
          }`
        );
        if (autoVerifyRes.data.verified) {
          setVerified(true);
          toast.success("Your profile is now verified!");
        } else if (autoVerifyRes.data.autoVerifyAt) {
          toast.info(
            "Profile complete. You will be verified automatically in 5 minutes if your profile remains complete."
          );
        }
      } catch (autoVerifyErr) {
        console.error("Auto-verify error:", autoVerifyErr);
      }
      // --- End auto-verify ---
    } catch (err) {
      console.error("Error updating profile:", err);
      toast.error("Failed to update profile");
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
    // For Google users, skip password validation
    if (authType === "google") {
      if (
        !window.confirm(
          "Are you sure you want to delete your account? This action cannot be undone."
        )
      ) {
        return;
      }
    } else {
      if (!deletePassword) {
        setDeleteError("Please enter your password");
        return;
      }
    }

    try {
      const deleteData = {
        email: user.email,
      };

      // Only include password for email-authenticated users
      if (authType !== "google") {
        deleteData.password = deletePassword;
      }

      await axios.delete(
        `${import.meta.env.VITE_BACKEND_URL}/api/auth/delete-account`,
        {
          data: deleteData,
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      toast.success("Your account has been deleted successfully");
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
    await axios.put(
      `${import.meta.env.VITE_BACKEND_URL}/api/users/update-profile`,
      {
        email,
        profilePicture: "",
      }
    );
    setProfilePicture("");
    setPreview("");
  };

  const handleDeleteCnicImage = async () => {
    if (!window.confirm("Delete your CNIC image and CNIC back image?")) return;
    await axios.put(
      `${import.meta.env.VITE_BACKEND_URL}/api/users/update-profile`,
      {
        email,
        cnicPicture: "",
        cnicBackPicture: "", // <-- Also clear CNIC back image
      }
    );
    setCnicPicture("");
    setCnicPreview("");
    setCnicBackPicture(""); // <-- Clear CNIC back image in state
    setCnicBackPreview(""); // <-- Clear CNIC back preview in state
  };

  // Helper: fallback to theme.background if theme.inputBackground is undefined
  const inputBg = theme.box || theme.background;

  return (
    <div
      className={s.container}
      style={{
        background: theme.background,
        color: theme.textColorColor,
        minHeight: "100vh",
        transition: "background 0.3s, color 0.3s",
      }}
    >
      <div
        className={s.profileBox}
        style={{
          background: theme.background,
          color: theme.textColorColor,
          borderRadius: 12,
          boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
        }}
      >
        {/* Loader overlay */}
        {isSaving && (
          <div
            className={s.loaderOverlay}
            style={{ background: theme.background + "cc" }}
          >
            <div className={s.loaderSpinner}></div>
            <div className={s.loaderText}>Saving...</div>
          </div>
        )}
        <h2 className={s.title} style={{ color: theme.textColor }}>
          Personal data:
        </h2>
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
                        : `${import.meta.env.VITE_BACKEND_URL}${profilePicture}`
                    }
                    alt="Profile"
                    className={s.avatarImg}
                  />
                ) : (
                  <span
                    className={s.cameraIcon}
                    style={{ color: theme.textColor }}
                  >
                    📷
                  </span>
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
            <p className={s.userId} style={{ color: theme.textColor }}>
              ID: {userId || "N/A"}
            </p>
            <p className={verified ? s.verified : s.unverified}>
              {verified ? "Verified" : "Unverified"}
            </p>
          </div>
        </div>

        <div className={s.form}>
          <div className={s.row}>
            <div className={s.inputBox}>
              <label style={{ color: theme.textColor }}>First Name</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                style={{ color: theme.textColor, background: inputBg }}
              />
            </div>
            <div className={s.inputBox}>
              <label style={{ color: theme.textColor }}>Last Name</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                style={{ color: theme.textColor, background: inputBg }}
              />
            </div>
          </div>

          <div className={s.row}>
            <div className={s.inputBox}>
              <label style={{ color: theme.textColor }}>Email</label>
              <input
                type="email"
                placeholder="example@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ color: theme.textColor, background: inputBg }}
              />
            </div>
            {authType !== "google" && (
              <div className={s.inputBox}>
                <label style={{ color: theme.textColor }}>Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled
                  style={{ color: theme.textColor, background: inputBg }}
                />
                <div className={s.forgotBox}>
                  <NavLink
                    to={`/forgot-password?email=${email}`}
                    className={s.forgot}
                    style={{ color: theme.textColor }}
                  >
                    Forget Your Password?
                  </NavLink>
                </div>
              </div>
            )}
            {authType === "google" && (
              <div className={s.inputBox}>
                <label style={{ color: theme.textColor }}>Authentication</label>
                <input
                  type="text"
                  value="Google Account"
                  disabled
                  style={{
                    color: "#4285f4",
                    fontWeight: "500",
                    background: inputBg,
                  }}
                />
                <div className={s.forgotBox}>
                  <span style={{ color: "#666", fontSize: "0.9em" }}>
                    Authenticated via Google
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className={s.row}>
            <div className={s.inputBox}>
              <label style={{ color: theme.textColor }}>Date Of Birth</label>
              <input
                type="date"
                placeholder="DD/MM/YEAR"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                style={{ color: theme.textColor, background: inputBg }}
              />
            </div>
            <div className={s.inputBox}>
              <label style={{ color: theme.textColor }}>Country</label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                style={{ color: theme.textColor, background: inputBg }}
              >
                <option value="">Select Country</option>
                <option value="Afghanistan">Afghanistan</option>
                <option value="Albania">Albania</option>
                <option value="Algeria">Algeria</option>
                <option value="Andorra">Andorra</option>
                <option value="Angola">Angola</option>
                <option value="Antigua and Barbuda">Antigua and Barbuda</option>
                <option value="Argentina">Argentina</option>
                <option value="Armenia">Armenia</option>
                <option value="Australia">Australia</option>
                <option value="Austria">Austria</option>
                <option value="Azerbaijan">Azerbaijan</option>
                <option value="Bahamas">Bahamas</option>
                <option value="Bahrain">Bahrain</option>
                <option value="Bangladesh">Bangladesh</option>
                <option value="Barbados">Barbados</option>
                <option value="Belarus">Belarus</option>
                <option value="Belgium">Belgium</option>
                <option value="Belize">Belize</option>
                <option value="Benin">Benin</option>
                <option value="Bhutan">Bhutan</option>
                <option value="Bolivia">Bolivia</option>
                <option value="Bosnia and Herzegovina">
                  Bosnia and Herzegovina
                </option>
                <option value="Botswana">Botswana</option>
                <option value="Brazil">Brazil</option>
                <option value="Brunei">Brunei</option>
                <option value="Bulgaria">Bulgaria</option>
                <option value="Burkina Faso">Burkina Faso</option>
                <option value="Burundi">Burundi</option>
                <option value="Cabo Verde">Cabo Verde</option>
                <option value="Cambodia">Cambodia</option>
                <option value="Cameroon">Cameroon</option>
                <option value="Canada">Canada</option>
                <option value="Central African Republic">
                  Central African Republic
                </option>
                <option value="Chad">Chad</option>
                <option value="Chile">Chile</option>
                <option value="China">China</option>
                <option value="Colombia">Colombia</option>
                <option value="Comoros">Comoros</option>
                <option value="Congo, Democratic Republic of the">
                  Congo, Democratic Republic of the
                </option>
                <option value="Congo, Republic of the">
                  Congo, Republic of the
                </option>
                <option value="Costa Rica">Costa Rica</option>
                <option value="Cote d'Ivoire">Cote d'Ivoire</option>
                <option value="Croatia">Croatia</option>
                <option value="Cuba">Cuba</option>
                <option value="Cyprus">Cyprus</option>
                <option value="Czech Republic">Czech Republic</option>
                <option value="Denmark">Denmark</option>
                <option value="Djibouti">Djibouti</option>
                <option value="Dominica">Dominica</option>
                <option value="Dominican Republic">Dominican Republic</option>
                <option value="Ecuador">Ecuador</option>
                <option value="Egypt">Egypt</option>
                <option value="El Salvador">El Salvador</option>
                <option value="Equatorial Guinea">Equatorial Guinea</option>
                <option value="Eritrea">Eritrea</option>
                <option value="Estonia">Estonia</option>
                <option value="Eswatini">Eswatini</option>
                <option value="Ethiopia">Ethiopia</option>
                <option value="Fiji">Fiji</option>
                <option value="Finland">Finland</option>
                <option value="France">France</option>
                <option value="Gabon">Gabon</option>
                <option value="Gambia">Gambia</option>
                <option value="Georgia">Georgia</option>
                <option value="Germany">Germany</option>
                <option value="Ghana">Ghana</option>
                <option value="Greece">Greece</option>
                <option value="Grenada">Grenada</option>
                <option value="Guatemala">Guatemala</option>
                <option value="Guinea">Guinea</option>
                <option value="Guinea-Bissau">Guinea-Bissau</option>
                <option value="Guyana">Guyana</option>
                <option value="Haiti">Haiti</option>
                <option value="Honduras">Honduras</option>
                <option value="Hungary">Hungary</option>
                <option value="Iceland">Iceland</option>
                <option value="India">India</option>
                <option value="Indonesia">Indonesia</option>
                <option value="Iran">Iran</option>
                <option value="Iraq">Iraq</option>
                <option value="Ireland">Ireland</option>
                <option value="Israel">Israel</option>
                <option value="Italy">Italy</option>
                <option value="Jamaica">Jamaica</option>
                <option value="Japan">Japan</option>
                <option value="Jordan">Jordan</option>
                <option value="Kazakhstan">Kazakhstan</option>
                <option value="Kenya">Kenya</option>
                <option value="Kiribati">Kiribati</option>
                <option value="Korea, North">Korea, North</option>
                <option value="Korea, South">Korea, South</option>
                <option value="Kosovo">Kosovo</option>
                <option value="Kuwait">Kuwait</option>
                <option value="Kyrgyzstan">Kyrgyzstan</option>
                <option value="Laos">Laos</option>
                <option value="Latvia">Latvia</option>
                <option value="Lebanon">Lebanon</option>
                <option value="Lesotho">Lesotho</option>
                <option value="Liberia">Liberia</option>
                <option value="Libya">Libya</option>
                <option value="Liechtenstein">Liechtenstein</option>
                <option value="Lithuania">Lithuania</option>
                <option value="Luxembourg">Luxembourg</option>
                <option value="Madagascar">Madagascar</option>
                <option value="Malawi">Malawi</option>
                <option value="Malaysia">Malaysia</option>
                <option value="Maldives">Maldives</option>
                <option value="Mali">Mali</option>
                <option value="Malta">Malta</option>
                <option value="Marshall Islands">Marshall Islands</option>
                <option value="Mauritania">Mauritania</option>
                <option value="Mauritius">Mauritius</option>
                <option value="Mexico">Mexico</option>
                <option value="Micronesia">Micronesia</option>
                <option value="Moldova">Moldova</option>
                <option value="Monaco">Monaco</option>
                <option value="Mongolia">Mongolia</option>
                <option value="Montenegro">Montenegro</option>
                <option value="Morocco">Morocco</option>
                <option value="Mozambique">Mozambique</option>
                <option value="Myanmar">Myanmar</option>
                <option value="Namibia">Namibia</option>
                <option value="Nauru">Nauru</option>
                <option value="Nepal">Nepal</option>
                <option value="Netherlands">Netherlands</option>
                <option value="New Zealand">New Zealand</option>
                <option value="Nicaragua">Nicaragua</option>
                <option value="Niger">Niger</option>
                <option value="Nigeria">Nigeria</option>
                <option value="North Macedonia">North Macedonia</option>
                <option value="Norway">Norway</option>
                <option value="Oman">Oman</option>
                <option value="Pakistan">Pakistan</option>
                <option value="Palau">Palau</option>
                <option value="Palestine">Palestine</option>
                <option value="Panama">Panama</option>
                <option value="Papua New Guinea">Papua New Guinea</option>
                <option value="Paraguay">Paraguay</option>
                <option value="Peru">Peru</option>
                <option value="Philippines">Philippines</option>
                <option value="Poland">Poland</option>
                <option value="Portugal">Portugal</option>
                <option value="Qatar">Qatar</option>
                <option value="Romania">Romania</option>
                <option value="Russia">Russia</option>
                <option value="Rwanda">Rwanda</option>
                <option value="Saint Kitts and Nevis">
                  Saint Kitts and Nevis
                </option>
                <option value="Saint Lucia">Saint Lucia</option>
                <option value="Saint Vincent and the Grenadines">
                  Saint Vincent and the Grenadines
                </option>
                <option value="Samoa">Samoa</option>
                <option value="San Marino">San Marino</option>
                <option value="Sao Tome and Principe">
                  Sao Tome and Principe
                </option>
                <option value="Saudi Arabia">Saudi Arabia</option>
                <option value="Senegal">Senegal</option>
                <option value="Serbia">Serbia</option>
                <option value="Seychelles">Seychelles</option>
                <option value="Sierra Leone">Sierra Leone</option>
                <option value="Singapore">Singapore</option>
                <option value="Slovakia">Slovakia</option>
                <option value="Slovenia">Slovenia</option>
                <option value="Solomon Islands">Solomon Islands</option>
                <option value="Somalia">Somalia</option>
                <option value="South Africa">South Africa</option>
                <option value="South Sudan">South Sudan</option>
                <option value="Spain">Spain</option>
                <option value="Sri Lanka">Sri Lanka</option>
                <option value="Sudan">Sudan</option>
                <option value="Suriname">Suriname</option>
                <option value="Sweden">Sweden</option>
                <option value="Switzerland">Switzerland</option>
                <option value="Syria">Syria</option>
                <option value="Taiwan">Taiwan</option>
                <option value="Tajikistan">Tajikistan</option>
                <option value="Tanzania">Tanzania</option>
                <option value="Thailand">Thailand</option>
                <option value="Timor-Leste">Timor-Leste</option>
                <option value="Togo">Togo</option>
                <option value="Tonga">Tonga</option>
                <option value="Trinidad and Tobago">Trinidad and Tobago</option>
                <option value="Tunisia">Tunisia</option>
                <option value="Turkey">Turkey</option>
                <option value="Turkmenistan">Turkmenistan</option>
                <option value="Tuvalu">Tuvalu</option>
                <option value="Uganda">Uganda</option>
                <option value="Ukraine">Ukraine</option>
                <option value="United Arab Emirates">
                  United Arab Emirates
                </option>
                <option value="United Kingdom">United Kingdom</option>
                <option value="United States">United States</option>
                <option value="Uruguay">Uruguay</option>
                <option value="Uzbekistan">Uzbekistan</option>
                <option value="Vanuatu">Vanuatu</option>
                <option value="Vatican City">Vatican City</option>
                <option value="Venezuela">Venezuela</option>
                <option value="Vietnam">Vietnam</option>
                <option value="Yemen">Yemen</option>
                <option value="Zambia">Zambia</option>
                <option value="Zimbabwe">Zimbabwe</option>
              </select>
            </div>
          </div>

          {/* Document type selection and CNIC number */}
          <div className={s.row}>
            <div className={s.inputBox}>
              <label style={{ color: theme.textColor }}>Document Type</label>
              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                style={{ color: theme.textColor, background: inputBg }}
              >
                <option value="CNIC">CNIC</option>
                <option value="Passport">Passport</option>
              </select>
            </div>
            {documentType === "CNIC" ? (
              <>
                <div className={s.inputBox}>
                  <label style={{ color: theme.textColor }}>CNIC Number</label>
                  <input
                    type="text"
                    value={cnicNumber}
                    onChange={handleCnicChange}
                    placeholder="xxxxx-xxxxxxx-x"
                    maxLength={15}
                    style={{ color: theme.textColor, background: inputBg }}
                  />
                </div>
              </>
            ) : (
              <>
                <div className={s.inputBox}>
                  <label style={{ color: theme.textColor }}>
                    Passport Number
                  </label>
                  <input
                    type="text"
                    value={passportNumber}
                    onChange={handlePassportChange}
                    placeholder="e.g. AA0000000"
                    maxLength={9}
                    style={{ color: theme.textColor, background: inputBg }}
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
                <label style={{ color: theme.textColor }}>
                  {documentType} Front Image
                </label>
                {cnicPicture && typeof cnicPicture === "string" ? (
                  <div
                    className={s.cnicImageBox}
                    style={{ flexDirection: "column", background: inputBg }}
                  >
                    <img
                      src={
                        cnicPicture.startsWith("http")
                          ? cnicPicture
                          : `${import.meta.env.VITE_BACKEND_URL}${
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
                      <span
                        className={s.cameraIcon}
                        style={{ color: theme.textColor }}
                      >
                        📷
                      </span>
                    )}
                  </>
                )}
              </div>
              {/* BACK IMAGE */}
              <div className={s.inputBox}>
                <label style={{ color: theme.textColor }}>
                  {documentType} Back Image
                </label>
                {cnicBackPicture && typeof cnicBackPicture === "string" ? (
                  <div
                    className={s.cnicImageBox}
                    style={{ flexDirection: "column", background: inputBg }}
                  >
                    <img
                      src={`${
                        import.meta.env.VITE_BACKEND_URL
                      }/${cnicBackPicture}`}
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
                      <span
                        className={s.cameraIcon}
                        style={{ color: theme.textColor }}
                      >
                        📷
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className={s.row}>
              <div className={s.inputBox}>
                <label style={{ color: theme.textColor }}>
                  Passport Number
                </label>
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
                        color: theme.textColor,
                      }}
                    >
                      {passportNumber}
                    </span>
                    <img
                      src={
                        passportImage.startsWith("http")
                          ? passportImage
                          : `${import.meta.env.VITE_BACKEND_URL}${
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
                      style={{
                        marginBottom: 8,
                        color: theme.textColor,
                        background: inputBg,
                      }}
                    />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePassportImageChange}
                    />
                    {passportPreview ? (
                      <img
                        src={passportPreview}
                        alt="Passport"
                        className={s.cnicImgStyled}
                        style={{ marginBottom: 8 }}
                      />
                    ) : (
                      <span
                        className={s.cameraIcon}
                        style={{ color: theme.textColor }}
                      >
                        📷
                      </span>
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
        <h2 style={{ color: theme.textColor }}>Delete Account</h2>
        <p style={{ color: theme.textColor }}>
          Are you sure you want to delete your account? This action cannot be
          undone.
        </p>

        {authType !== "google" && (
          <div className={s.inputBox}>
            <label style={{ color: theme.textColor }}>
              Enter your password to confirm:
            </label>
            <input
              type="password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              placeholder="Your password"
              style={{ color: theme.textColor, background: inputBg }}
            />
            {deleteError && <p className={s.errorText}>{deleteError}</p>}
          </div>
        )}

        {authType === "google" && deleteError && (
          <p className={s.errorText}>{deleteError}</p>
        )}

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
          <h2 className={s.popupTitle} style={{ color: theme.textColor }}>
            CNIC Back Image Required
          </h2>
          <p className={s.popupText} style={{ color: theme.textColor }}>
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

      <ToastContainer
        position="top-center"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
    </div>
  );
};

export default Profile;
