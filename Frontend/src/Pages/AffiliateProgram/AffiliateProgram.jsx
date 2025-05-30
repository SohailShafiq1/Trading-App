import { GiMedal } from "react-icons/gi";
import { BsFillPersonFill } from "react-icons/bs";
import { HiCursorClick } from "react-icons/hi";
import { BiLineChartDown } from "react-icons/bi";
import { FiCopy } from "react-icons/fi";
import { AiOutlineLink } from "react-icons/ai";
import React, { useEffect, useState } from "react";
import styles from "./AffiliateProgram.module.css";
import { NavLink, Navigate } from "react-router-dom";
import { useAuth } from "../../Context/AuthContext";
import { useAffiliateAuth } from "../../Context/AffiliateAuthContext";
import TeamData from "./components/TeamData/TeamData";
import axios from "axios";
import AffiliateLevel from "./components/AffiliateLevel/AffiliateLevel";
import AffiliateLevel from "./components/AffiliateLevel/AffiliateLevel";
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const AffiliateProgram = () => {
  const { user } = useAuth();
  const [isCopied, setIsCopied] = useState(false);
  const [referralLink, setReferralLink] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [displayType, setDisplayType] = useState("link");
  const { affiliate } = useAffiliateAuth();
  const [activeTable, setActiveTable] = useState("traders");

  // Questions state
  const [questionsForm, setQuestionsForm] = useState({
    primarySources: "",
    tiktokProfile: "",
    mainIncomeSource: "",
    monthlyEarningGoal: "",
  });
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showQuestions, setShowQuestions] = useState(false);

  useEffect(() => {
    if (affiliate) {
      setReferralLink(affiliate.referralLink);
      setReferralCode(affiliate.affiliateCode);

      if (affiliate.trafficQuestions) {
        setQuestionsForm({ ...affiliate.trafficQuestions });
      }

      if (!affiliate.trafficQuestionsAnswered) {
        setShowQuestions(true);
      }
    }
  }, [affiliate]);

  useEffect(() => {
    const getQuestions = async () => {
      try {
        const { data } = await axios.get(
          `${BACKEND_URL}/api/affiliate/traffic-questions-list`
        );
        if (data.success) setQuestions(data.questions);
      } catch (err) {
        console.error("Failed to fetch traffic questions list:", err);
      }
    };
    getQuestions();
  }, []);

  const handleQuestionsChange = (e) => {
    setQuestionsForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleQuestionsSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const token = localStorage.getItem("affiliate_token");
    try {
      await axios.put(
        `${BACKEND_URL}/api/affiliate/traffic-questions`,
        {
          primarySources: questionsForm.primarySources,
          tiktokProfile: questionsForm.tiktokProfile,
          mainIncomeSource: questionsForm.mainIncomeSource,
          monthlyEarningGoal: questionsForm.monthlyEarningGoal,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      setShowSuccess(true);
      setShowQuestions(false);
    } catch (err) {
      console.error("Failed to submit traffic questions:", err);
      alert("Submission failed.");
    } finally {
      setLoading(false);
    }
  };

  const closeSuccessPopup = () => {
    setShowSuccess(false);
    window.location.reload();
  };

  if (!user && !affiliate) {
    return <Navigate to="/affiliate/login" />;
  }

  const handleCopyClick = () => {
    const textToCopy = displayType === "link" ? referralLink : referralCode;
    navigator.clipboard.writeText(textToCopy);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const traders = [
    {
      id: "#557585",
      linkId: "#680710",
      balance: "$4.75",
      deposits: 1,
      depositSum: "$30.00",
      bonuses: "$0.00",
      withdrawals: "$0.00",
    },
    {
      id: "#557347",
      linkId: "#680710",
      balance: "$0.00",
      deposits: 0,
      depositSum: "$0.00",
      bonuses: "$0.00",
      withdrawals: "$0.00",
    },
  ];

  const profits = [
    { id: "#557585", country: "🇧🇷", deposit: "$0.00", profit: "$0.00" },
    { id: "#557347", country: "🇧🇷", deposit: "$0.00", profit: "$0.00" },
  ];

  return (
    <div className={styles.container}>
      {/* Main Content with blur effect */}
      <div
        className={`${styles.mainContent} ${
          showQuestions ? styles.blurBackground : ""
        }`}
      >
        <div className={styles.top}>
          <div className={styles.balance}>
            <p>Your balance</p>
            <h1>{user?.assets || "$0.00"}</h1>
            <NavLink
              to="/binarychart/bankinglayout/withdraw"
              className={styles.withdrawalLink}
            >
              Go to withdrawal →
            </NavLink>
            <div className={styles.earning}>
              <p>Earnings for all time</p>
              <span>
                {affiliate?.totalPrize
                  ? `$${Number(affiliate.totalPrize).toLocaleString()}`
                  : "$0.00"}
              </span>
            </div>
          </div>
          <div className={styles.partnerLink}>
            <div className={styles.topBar}>
              <div className={styles.header}>
                <AiOutlineLink className={styles.headerIcon} /> Your Partner
                Link
              </div>
              <div className={styles.option}>
                <button
                  className={`${styles.pLink} ${
                    displayType === "link" ? styles.active : ""
                  }`}
                  onClick={() => setDisplayType("link")}
                >
                  Partner Link
                </button>
                <button
                  className={`${styles.pCode} ${
                    displayType === "code" ? styles.active : ""
                  }`}
                  onClick={() => setDisplayType("code")}
                >
                  Partner Code
                </button>
              </div>
            </div>
            <div className={styles.linkContainer}>
              <span>
                {displayType === "link" ? referralLink : referralCode}
              </span>
              <div className={styles.copyButton} onClick={handleCopyClick}>
                <FiCopy /> {isCopied ? "Copied!" : "Copy"}
              </div>
              <button className={styles.generate}>Generate New</button>
            </div>
          </div>
        </div>

        <div className={styles.line}>
            <AffiliateLevel />
          <div className={styles.statsBox}>
            <HiCursorClick />
            <span>0</span>
            <p>Clicks</p>
          </div>
          <div className={styles.statsBox}>
            <BsFillPersonFill />
            <span>{affiliate?.team ? affiliate.team.length : 0}</span>
            <p>Registrations</p>
          </div>
          <NavLink to={"/affiliate/prizepool"} className={styles.statsBox}>
            <GiMedal />
            <div className={styles.prizePoolContent}>
              <p>Prize Pool</p>
            </div>
          </NavLink>
        </div>

        <div className={styles.toggleButtons}>
          <button
            className={activeTable === "traders" ? styles.activeToggle : ""}
            onClick={() => setActiveTable("traders")}
          >
            TRADER
          </button>
          <button
            className={activeTable === "profits" ? styles.activeToggle : ""}
            onClick={() => setActiveTable("profits")}
          >
            Overall Stats
          </button>
        </div>

        <div className={styles.tableContainer}>
          <TeamData
            activeTable={activeTable}
            traders={traders}
            profits={profits}
          />
        </div>
      </div>

      {/* Questions Modal (outside blurred content) */}
      {showQuestions && (
        <div className={styles.questionsModal}>
          <div className={styles.questionsContent}>
            <h2>Traffic Strategy Questions</h2>
            <form onSubmit={handleQuestionsSubmit}>
              <div className={styles.formGroup}>
                <label>{questions[0] || "Primary traffic sources"}</label>
                <input
                  type="text"
                  name="primarySources"
                  value={questionsForm.primarySources}
                  onChange={handleQuestionsChange}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>{questions[1] || "TikTok profile link"}</label>
                <input
                  type="text"
                  name="tiktokProfile"
                  value={questionsForm.tiktokProfile}
                  onChange={handleQuestionsChange}
                />
              </div>
              <div className={styles.formGroup}>
                <label>{questions[2] || "Main income source"}</label>
                <input
                  type="text"
                  name="mainIncomeSource"
                  value={questionsForm.mainIncomeSource}
                  onChange={handleQuestionsChange}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>{questions[3] || "Monthly earning goal"}</label>
                <input
                  type="text"
                  name="monthlyEarningGoal"
                  value={questionsForm.monthlyEarningGoal}
                  onChange={handleQuestionsChange}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className={styles.submitButton}
              >
                {loading ? "Submitting..." : "Submit"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Success Popup */}
      {showSuccess && (
        <div className={styles.popupOverlay}>
          <div className={styles.popupContent}>
            <h3>Form Submitted!</h3>
            <p>Your answers have been saved.</p>
            <button className={styles.closeButton} onClick={closeSuccessPopup}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AffiliateProgram;
