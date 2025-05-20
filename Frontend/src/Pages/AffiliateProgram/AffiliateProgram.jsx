import { GiMedal } from "react-icons/gi";
import { BsFillPersonFill } from "react-icons/bs";
import { HiCursorClick } from "react-icons/hi";
import { BiLineChartDown } from "react-icons/bi";
import { FiCopy } from "react-icons/fi";
import { AiOutlineLink } from "react-icons/ai";
import React, { useEffect, useState } from "react";
import styles from "./AffiliateProgram.module.css";
import { NavLink, Navigate } from "react-router-dom";
import { useAuth } from "../../Context/AuthContext"; // Import useAuth
import { useAffiliateAuth } from "../../Context/AffiliateAuthContext"; // Import useAffiliateAuth

const s = styles;

const AffiliateProgram = () => {
  const { user } = useAuth(); // Access user data from useAuth
  const [isCopied, setIsCopied] = useState(false);
  const [referralLink, setReferralLink] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [displayType, setDisplayType] = useState("link"); // State to track display type
  const { affiliate } = useAffiliateAuth(); // From affiliate login
  console.log("Affiliate:", affiliate);

  useEffect(() => {
    if (affiliate) {
      setReferralLink(affiliate.referralLink);
      setReferralCode(affiliate.code);
      console.log("Referral Link:", affiliate.referralLink);
      console.log("Referral Code:", affiliate.code);
    }
  }, [affiliate]);

  // Redirect if not both logins
  if (!user && !affiliate) {
    return <Navigate to="/affiliate/login" />;
  }

  const handleCopyClick = () => {
    const textToCopy = displayType === "link" ? referralLink : referralCode;
    navigator.clipboard.writeText(textToCopy);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className={s.container}>
      <div className={s.top}>
        <div className={s.balance}>
          <p>Your balance</p>
          <h1>{user?.assets || "$0.00"}</h1> {/* Display real assets */}
          <NavLink
            to="/binarychart/bankinglayout/withdraw"
            className={s.withdrawalLink}
          >
            Go to withdrawal →
          </NavLink>
          <div className={s.earning}>
            <p>Earnings for all time</p>
            <span>$0.00</span>
          </div>
        </div>
        <div className={s.partnerLink}>
          <div className={s.topBar}>
            <div className={s.header}>
              <AiOutlineLink className={s.headerIcon} /> Your Partner Link
            </div>
            <div className={s.option}>
              <button
                className={`${s.pLink} ${
                  displayType === "link" ? s.active : ""
                }`}
                onClick={() => setDisplayType("link")}
              >
                Partner Link
              </button>
              <button
                className={`${s.pCode} ${
                  displayType === "code" ? s.active : ""
                }`}
                onClick={() => setDisplayType("code")}
              >
                Partner Code
              </button>
            </div>
          </div>
          <div className={s.linkContainer}>
            <span>{displayType === "link" ? referralLink : referralCode}</span>
            <div className={s.copyButton} onClick={handleCopyClick}>
              <FiCopy /> {isCopied ? "Copied!" : "Copy"}
            </div>
            <button className={s.generate}>Generate New</button>
          </div>
        </div>
      </div>
      <div className={s.line}>
        <div className={s.statsBox}>
          <BiLineChartDown />
          <span>0</span>
          <p>Trader Ids</p>
        </div>
        <div className={s.statsBox}>
          <HiCursorClick />
          <span>0</span>
          <p>Clicks</p>
        </div>
        <div className={s.statsBox}>
          <BsFillPersonFill />
          <span>{affiliate?.team ? affiliate.team.length : 0}</span>
          <p>Registrations</p>
        </div>
        <NavLink to={"/affiliate/prizepool"} className={s.statsBox}>
          <GiMedal />
          <div
            style={{
              background: "white",
              borderRadius: "30px",
              padding: "0rem 2rem",
            }}
          >
            <p>Prize Pool</p>
          </div>
        </NavLink>
      </div>
    </div>
  );
};

export default AffiliateProgram;
