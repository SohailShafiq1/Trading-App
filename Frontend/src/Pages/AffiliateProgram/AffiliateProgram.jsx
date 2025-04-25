import { FiCopy } from "react-icons/fi"; 
import { AiOutlineLink } from "react-icons/ai";
import React, { useState } from "react";
import styles from "./AffiliateProgram.module.css";
import { NavLink } from "react-router-dom";
const s = styles;
const AffiliateProgram = () => {
  const [isCopied, setIsCopied] = useState(false);
  const referralLink = "Order-ax.pro/sign-up/?lid=1249470";

  const handleCopyClick = () => {
    navigator.clipboard.writeText(referralLink);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className={s.container}>
      <div className={s.top}>
        <div className={s.balance}>
          <p>Your balance</p>
          <h1>$0.00</h1>
          <NavLink to="/withdrawal" className={s.withdrawalLink}>
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
              <button>Partner Link</button>
              <button>Partner code</button>
            </div>
          </div>
          <div className={s.linkContainer}>
            <span>{referralLink}</span>
            <div className={s.copyButton} onClick={handleCopyClick}>
                <FiCopy /> Copy
            </div>
            <button className={s.generate}>Generate New</button>
          </div>
        </div>
      </div>
      <div className={s.line}>
        <div className={s.statsBox}>
          <p>Trader Ids</p>
          <span>0</span>
        </div>
        <div className={s.statsBox}>
          <p>Clicks</p>
          <span>0</span>
        </div>
        <div className={s.statsBox}>
          <p>Registrations</p>
          <span>0</span>
        </div>
        <div className={s.statsBox}>
          <p>Prize Pool</p>
          <span>$0.00</span>
        </div>
      </div>
    </div>
  );
};

export default AffiliateProgram;
