import React, { useState, useEffect, useRef } from "react";
import styles from "./RegisterPage.module.css";
import { NavLink, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../Context/AuthContext";

const s = styles;

const RegisterPage = () => {
  const { register, googleLogin } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const formRef = useRef(); // Create a ref to hold the current form state

  const [form, setForm] = useState({
    country: "",
    currency: "USD",
    email: "",
    password: "",
    confirmAge: false,
    confirmTax: false,
    referralCode: "",
  });

  // Update the ref whenever form state changes
  useEffect(() => {
    formRef.current = form;
  }, [form]);

  const handleChange = (e) => {
    const { name, type, value, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // In your RegisterPage component, add validation before submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.country) {
      alert("Please select your country");
      return;
    }

    if (!form.confirmAge || !form.confirmTax) {
      alert("Please confirm age and tax status.");
      return;
    }

    try {
      await register(form);
      navigate("/login");
    } catch (err) {
      alert(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Registration failed"
      );
    }
  };

  // Extract referral code from URL parameter on component mount
  useEffect(() => {
    const refCode = searchParams.get("ref");
    if (refCode) {
      setForm((prev) => ({
        ...prev,
        referralCode: refCode,
      }));
    }
  }, [searchParams]);

  // Google Sign-up handler
  const handleGoogleSignUp = () => {
    console.log("🔍 Google Sign-Up button clicked");
    console.log("🔍 Form country:", form.country);
    console.log("🔍 Form confirmAge:", form.confirmAge);
    console.log("🔍 Form confirmTax:", form.confirmTax);

    if (!form.country) {
      alert("Please select your country before signing up with Google");
      return;
    }

    if (!form.confirmAge || !form.confirmTax) {
      alert("Please confirm age and tax status before signing up with Google");
      return;
    }
  };

  // Initialize Google Sign-In when component mounts
  useEffect(() => {
    const initializeGoogle = () => {
      if (window.google) {
        try {
          console.log("🔍 Initializing Google Sign-In...");
          window.google.accounts.id.initialize({
            client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
            callback: handleGoogleResponse, // Use the function directly, it will access formRef.current
          });

          // Render the Google button in the designated div
          const buttonContainer = document.getElementById(
            "google-signup-button"
          );
          if (buttonContainer) {
            window.google.accounts.id.renderButton(buttonContainer, {
              theme: "outline",
              size: "large",
              text: "signup_with",
              width: 280,
            });
            console.log("🔍 Google Sign-In button rendered");
          }
        } catch (error) {
          console.error("Google Sign-Up initialization error:", error);
          // Show fallback button
          const fallbackBtn = document.getElementById("fallback-google-btn");
          if (fallbackBtn) {
            fallbackBtn.style.display = "block";
          }
        }
      } else {
        console.log("🔍 Google not loaded yet, will retry...");
        // Show fallback button after a delay
        setTimeout(() => {
          if (!window.google) {
            console.error("Google Identity Services script not loaded.");
            const fallbackBtn = document.getElementById("fallback-google-btn");
            if (fallbackBtn) {
              fallbackBtn.style.display = "block";
            }
          } else {
            initializeGoogle();
          }
        }, 2000);
      }
    };

    // Try to initialize immediately, or wait for script to load
    if (document.readyState === "complete") {
      initializeGoogle();
    } else {
      window.addEventListener("load", initializeGoogle);
      return () => window.removeEventListener("load", initializeGoogle);
    }
  }, []); // Only run once on mount

  const handleGoogleResponse = async (response) => {
    try {
      console.log("🔍 Google response received");

      // Use the current form state from the ref
      const currentForm = formRef.current;
      console.log("🔍 Current form state:", currentForm);

      // Check validation before processing
      if (!currentForm.country) {
        alert("Please select your country before signing up with Google");
        return;
      }

      if (!currentForm.confirmAge || !currentForm.confirmTax) {
        alert(
          "Please confirm age and tax status before signing up with Google"
        );
        return;
      }

      const additionalData = {
        country: currentForm.country,
        currency: currentForm.currency,
        referralCode: currentForm.referralCode,
      };

      console.log("🔍 Additional data for registration:", additionalData);

      await googleLogin(response.credential, true, additionalData);
      navigate("/login");
    } catch (err) {
      console.error("🔍 Google registration error:", err);
      alert(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Google registration failed"
      );
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
            <option value="Saint Kitts and Nevis">Saint Kitts and Nevis</option>
            <option value="Saint Lucia">Saint Lucia</option>
            <option value="Saint Vincent and the Grenadines">
              Saint Vincent and the Grenadines
            </option>
            <option value="Samoa">Samoa</option>
            <option value="San Marino">San Marino</option>
            <option value="Sao Tome and Principe">Sao Tome and Principe</option>
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
            <option value="United Arab Emirates">United Arab Emirates</option>
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
          <input
            type="text"
            name="referralCode"
            placeholder="Referral Code (Optional)"
            value={form.referralCode}
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

          {/* Google Sign-Up Button Container */}
          <div
            id="google-signup-button"
            style={{
              display: "flex",
              justifyContent: "center",
              marginTop: "10px",
            }}
          ></div>

          {/* Fallback button if Google doesn't load */}
          <button
            type="button"
            className={s.googleBtn}
            onClick={handleGoogleSignUp}
            style={{ display: "none" }}
            id="fallback-google-btn"
          >
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
