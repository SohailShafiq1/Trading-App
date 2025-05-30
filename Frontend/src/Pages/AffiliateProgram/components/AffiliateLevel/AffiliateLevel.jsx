import React, { useState, useEffect } from "react";
import { BiLineChartDown } from "react-icons/bi";
import styles1 from "./AffiliateLevel.module.css";
import styles from "../../AffiliateProgram.module.css";
import { useAffiliateAuth } from "../../../../Context/AffiliateAuthContext";
import axios from "axios";
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

// Define levels and their deposit ranges
const LEVELS = [
  {
    name: "Level 1",
    turnover: "1.90",
    depositMin: 0,
    depositMax: 14,
    depositRequired: 15,
  },
  {
    name: "Level 2",
    turnover: "2.15",
    depositMin: 15,
    depositMax: 60,
    depositRequired: 46, // 60-15+1=46
  },
  {
    name: "Level 3",
    turnover: "2.40",
    depositMin: 61,
    depositMax: 120,
    depositRequired: 60, // 120-61+1=60
  },
  {
    name: "Level 4",
    turnover: "2.65",
    depositMin: 121,
    depositMax: 210,
    depositRequired: 90, // 210-121+1=90
  },
  {
    name: "Level 5",
    turnover: "2.90",
    depositMin: 211,
    depositMax: 420,
    depositRequired: 210, // 420-211+1=210
  },
  {
    name: "Level 6",
    turnover: "3.15",
    depositMin: 421,
    depositMax: 720,
    depositRequired: 300, // 720-421+1=300
  },
  {
    name: "Level 7",
    turnover: "3.40",
    depositMin: 721,
    depositMax: Infinity,
    depositRequired: null, // No upper limit
  },
];

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

  // Determine current level based on teamDepositCount and LEVELS
  let affiliateLevel = 1;
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (teamDepositCount >= LEVELS[i].depositMin) {
      affiliateLevel = i + 1;
      break;
    }
  }
  if (affiliateLevel > LEVELS.length) affiliateLevel = LEVELS.length;

  const currentLevel = LEVELS[affiliateLevel - 1];

  // Calculate progress for current level
  let depositsForCurrentLevel = 0;
  let progressMax = currentLevel.depositRequired;
  if (affiliateLevel === LEVELS.length) {
    // Level 7: no upper limit, show total deposits above 721
    depositsForCurrentLevel = teamDepositCount - currentLevel.depositMin;
    progressMax = null;
  } else {
    depositsForCurrentLevel = Math.max(
      0,
      Math.min(
        teamDepositCount - currentLevel.depositMin,
        currentLevel.depositRequired
      )
    );
  }

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
                          {level.depositMax === Infinity
                            ? `${level.depositMin}+`
                            : `${level.depositMin}-${level.depositMax}`}
                        </td>
                      </tr>
                      {isCurrentLevel && (
                        <tr>
                          <td colSpan={3}>
                            <div className={styles1.progressContainer}>
                              <div className={styles1.progressLabel}>
                                Team Deposits:{" "}
                                {progressMax
                                  ? `${depositsForCurrentLevel} / ${progressMax}`
                                  : `${depositsForCurrentLevel} (no limit)`}
                              </div>
                              <div className={styles1.progressBarBg}>
                                <div
                                  className={styles1.progressBarFill}
                                  style={{
                                    width: progressMax
                                      ? `${Math.min(
                                          (depositsForCurrentLevel /
                                            progressMax) *
                                            100,
                                          100
                                        )}%`
                                      : "100%",
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
