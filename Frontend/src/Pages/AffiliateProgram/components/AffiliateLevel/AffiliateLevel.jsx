import React, { useState, useEffect } from "react";
import { BiLineChartDown } from "react-icons/bi";
import styles1 from "./AffiliateLevel.module.css";
import styles from "../../AffiliateProgram.module.css";
import { useAffiliateAuth } from "../../../../Context/AffiliateAuthContext";
import axios from "axios";
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const LEVELS = Array.from({ length: 6 }, (_, i) => ({
  name: `Level ${i + 1}`,
  turnover: (1.9 + i * 0.25).toFixed(2),
  depositMin: i * 15,
  depositMax: i * 15 + 14,
  depositRequired: 15, // Each level requires 15 team deposits
}));

const AffiliateLevel = () => {
  const [showPopup, setShowPopup] = useState(false);
  const { affiliate, loading } = useAffiliateAuth();
  const [teamDepositCount, setTeamDepositCount] = useState(0);
  const [depositLoading, setDepositLoading] = useState(true);

  useEffect(() => {
    const fetchTeamDepositCount = async () => {
      if (affiliate?.email) {
        setDepositLoading(true);
        try {
          const res = await axios.get(
            `${BACKEND_URL}/api/affiliate/team-deposit-count/${affiliate.email}`
          );
          setTeamDepositCount(res.data.totalDeposits);
        } catch (err) {
          setTeamDepositCount(0);
        }
        setDepositLoading(false);
      }
    };
    fetchTeamDepositCount();
  }, [affiliate?.email]);

  if (loading || depositLoading) return <div>Loading...</div>;
  if (!affiliate)
    return <div>You must be logged in to view your affiliate level.</div>;

  // Determine current level based on teamDepositCount
  let affiliateLevel = 1;
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (teamDepositCount >= LEVELS[i].depositMin) {
      affiliateLevel = i + 1;
      break;
    }
  }

  const currentLevel = LEVELS[affiliateLevel - 1];
  const depositsForCurrentLevel = Math.max(
    0,
    Math.min(
      teamDepositCount - currentLevel.depositMin,
      currentLevel.depositRequired
    )
  );

  return (
    <>
      <div
        className={styles.statsBox}
        onClick={() => setShowPopup(true)}
        style={{ cursor: "pointer" }}
        title="View Affiliate Levels"
      >
        <BiLineChartDown />
        <span>{affiliateLevel}</span>
        <p>Trader Level</p>
      </div>
      {showPopup && (
        <div className={styles1.popupOverlay}>
          <div className={styles1.popupContent}>
            <button
              className={styles1.closeBtn}
              onClick={() => setShowPopup(false)}
            >
              ×
            </button>
            <h3>Affiliate Levels</h3>
            <table className={styles1.levelTable}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Turnover</th>
                  <th>Deposit Range</th>
                </tr>
              </thead>
              <tbody>
                {LEVELS.map((level, idx) => {
                  const isCurrentLevel = affiliateLevel === idx + 1;
                  return (
                    <React.Fragment key={idx}>
                      <tr
                        className={isCurrentLevel ? styles1.activeLevelRow : ""}
                      >
                        <td>{level.name}</td>
                        <td>{level.turnover}</td>
                        <td>
                          {level.depositMin}-{level.depositMax}
                        </td>
                      </tr>
                      {isCurrentLevel && (
                        <tr>
                          <td colSpan={3}>
                            <div className={styles1.progressContainer}>
                              <div className={styles1.progressLabel}>
                                Team Deposits: {depositsForCurrentLevel} /{" "}
                                {level.depositRequired}
                              </div>
                              <div className={styles1.progressBarBg}>
                                <div
                                  className={styles1.progressBarFill}
                                  style={{
                                    width: `${Math.min(
                                      (depositsForCurrentLevel /
                                        level.depositRequired) *
                                        100,
                                      100
                                    )}%`,
                                  }}
                                />
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
};

export default AffiliateLevel;
import React, { useState, useEffect } from "react";
import { BiLineChartDown } from "react-icons/bi";
import styles from "../../AffiliateProgram.module.css";
import { useAffiliateAuth } from "../../../../Context/AffiliateAuthContext";
import axios from "axios";

const LEVELS = Array.from({ length: 6 }, (_, i) => ({
  name: `Level ${i + 1}`,
  turnover: (1.9 + i * 0.25).toFixed(2),
  depositMin: i * 15,
  depositMax: i * 15 + 14,
  depositRequired: 15, // Each level requires 15 team deposits
}));

const AffiliateLevel = () => {
  const [showPopup, setShowPopup] = useState(false);
  const { affiliate, loading } = useAffiliateAuth();
  const [teamDepositCount, setTeamDepositCount] = useState(0);
  const [depositLoading, setDepositLoading] = useState(true);

  useEffect(() => {
    const fetchTeamDepositCount = async () => {
      if (affiliate?.email) {
        setDepositLoading(true);
        try {
          const res = await axios.get(
            `/api/affiliate/team-deposit-count/${affiliate.email}`
          );
          setTeamDepositCount(res.data.teamDepositCount || 0);
        } catch (err) {
          setTeamDepositCount(0);
        }
        setDepositLoading(false);
      }
    };
    fetchTeamDepositCount();
  }, [affiliate?.email]);

  if (loading || depositLoading) return <div>Loading...</div>;
  if (!affiliate)
    return <div>You must be logged in to view your affiliate level.</div>;

  const affiliateLevel = affiliate.affiliateLevel || 1;

  const depositsForCurrentLevel = Math.max(
    0,
    Math.min(
      teamDepositCount - LEVELS[affiliateLevel - 1].depositMin,
      LEVELS[affiliateLevel - 1].depositRequired
    )
  );

  return (
    <>
      <div
        className={styles.statsBox}
        onClick={() => setShowPopup(true)}
        style={{ cursor: "pointer" }}
        title="View Affiliate Levels"
      >
        <BiLineChartDown />
        <span>{affiliateLevel}</span>
        <p>Trader Level</p>
      </div>
      {showPopup && (
        <div className={styles.popupOverlay}>
          <div className={styles.popupContent}>
            <button
              className={styles.closeBtn}
              onClick={() => setShowPopup(false)}
            >
              ×
            </button>
            <h3>Affiliate Levels</h3>
            <table className={styles.levelTable}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Turnover</th>
                  <th>Deposit Range</th>
                </tr>
              </thead>
              <tbody>
                {LEVELS.map((level, idx) => {
                  const isCurrentLevel = affiliateLevel === idx + 1;
                  return (
                    <React.Fragment key={idx}>
                      <tr
                        className={isCurrentLevel ? styles.activeLevelRow : ""}
                      >
                        <td>{level.name}</td>
                        <td>{level.turnover}</td>
                        <td>
                          {level.depositMin}-{level.depositMax}
                        </td>
                      </tr>
                      {isCurrentLevel && (
                        <tr>
                          <td colSpan={3}>
                            <div className={styles.progressContainer}>
                              <div className={styles.progressLabel}>
                                Team Deposits: {depositsForCurrentLevel} /{" "}
                                {level.depositRequired}
                              </div>
                              <div className={styles.progressBarBg}>
                                <div
                                  className={styles.progressBarFill}
                                  style={{
                                    width: `${Math.min(
                                      (depositsForCurrentLevel /
                                        level.depositRequired) *
                                        100,
                                      100
                                    )}%`,
                                  }}
                                />
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
};

export default AffiliateLevel;
