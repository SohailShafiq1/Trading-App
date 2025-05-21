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

const s = styles;

const AffiliateProgram = () => {
  const { user } = useAuth();
  const [isCopied, setIsCopied] = useState(false);
  const [referralLink, setReferralLink] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [displayType, setDisplayType] = useState("link");
  const { affiliate } = useAffiliateAuth();
  const [activeTable, setActiveTable] = useState("traders");

  useEffect(() => {
    if (affiliate) {
      setReferralLink(affiliate.referralLink);
      setReferralCode(affiliate.code);
    }
  }, [affiliate]);

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
    <div className={s.container}>
      <div className={s.top}>
        <div className={s.balance}>
          <p>Your balance</p>
          <h1>{user?.assets || "$0.00"}</h1>
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

      {/* Toggle Tabs */}
      <div className={s.toggleButtons}>
        <button
          className={activeTable === "traders" ? s.activeToggle : ""}
          onClick={() => setActiveTable("traders")}
        >
          TRADER
        </button>
        <button
          className={activeTable === "profits" ? s.activeToggle : ""}
          onClick={() => setActiveTable("profits")}
        >
          Overall Stats
        </button>
      </div>

      {/* Table Display */}
      <div className={s.tableContainer}>
        <TeamData activeTable={activeTable} traders={traders} profits={profits} />
      </div>
    </div>
  );
};

export default AffiliateProgram;
