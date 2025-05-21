import React, { useState, useEffect } from "react";
import styles from "./PrizePool.module.css";
import { useAffiliateAuth } from "../../Context/AffiliateAuthContext";
const s = styles;

const PrizeArray = [
  { id: 1, prize: "100$", timeLimit: 5, conditions: { deposit: "$2500", profit: "$2000", ftds: "10" } },
  { id: 2, prize: "300$", timeLimit: 5, conditions: { deposit: "$3000", profit: "$2500", ftds: "15" } },
  { id: 3, prize: "500$", timeLimit: 5, conditions: { deposit: "$4000", profit: "$3000", ftds: "20" } },
  { id: 4, prize: "1000$", timeLimit: 5, conditions: { deposit: "$5000", profit: "$4000", ftds: "25" } },
  { id: 5, prize: "5000$", timeLimit: 5, conditions: { deposit: "$7000", profit: "$6000", ftds: "35" } },
  { id: 6, prize: "15,000$", timeLimit: 3, conditions: { deposit: "$10000", profit: "$9000", ftds: "50" } },
  { id: 7, prize: "30,000$", timeLimit: 3, conditions: { deposit: "$15000", profit: "$14000", ftds: "70" } },
];

const PrizePool = () => {
  const [activePopup, setActivePopup] = useState(null);
  const { affiliate } = useAffiliateAuth();
  const userLevel = affiliate?.level || 1;
  const [levelStartTime, setLevelStartTime] = useState(
    () => localStorage.getItem("levelStartTime") || Date.now()
  );
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    const currentLevel = PrizeArray.find((l) => l.id === userLevel);
    const start = new Date(levelStartTime).getTime();
    const now = Date.now();
    const msLeft = start + currentLevel.timeLimit * 24 * 60 * 60 * 1000 - now;
    setTimeLeft(msLeft > 0 ? msLeft : 0);

    const timer = setInterval(() => {
      const now = Date.now();
      const msLeft = start + currentLevel.timeLimit * 24 * 60 * 60 * 1000 - now;
      setTimeLeft(msLeft > 0 ? msLeft : 0);
      if (msLeft <= 0) {
        setLevelStartTime(Date.now());
        localStorage.setItem("levelStartTime", Date.now());
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [userLevel, levelStartTime]);

  const checkConditionsMet = (level) => {
    return false;
  };

  const handleLevelComplete = () => {
    const currentLevel = PrizeArray.find((l) => l.id === userLevel);
    if (checkConditionsMet(currentLevel)) {
      if (userLevel < PrizeArray.length) {
        setLevelStartTime(Date.now());
        localStorage.setItem("levelStartTime", Date.now());
      }
    } else {
      setActivePopup(currentLevel);
    }
  };

  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const days = Math.floor(totalSeconds / (24 * 3600));
    const hours = Math.floor((totalSeconds % (24 * 3600)) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  };

  return (
    <div className={s.container}>
      <div className={s.prizePool}>
        <div className={s.box}>
          <h1>Prize Pool</h1>
          <p>
            Hit all three targets to claim your reward. You can choose to take
            the prize or receive a cash alternative.
          </p>
          <div>
            <b>Time left for Level {userLevel}: </b>
            <span className={s.timer}>{formatTime(timeLeft)}</span>
          </div>
          <div className={s.prizes}>
            {PrizeArray.map((item) => (
              <div key={item.id} className={s.prize}>
                <h2 className={s.id}>Level {item.id}</h2>
                <h2 className={s.name}>{item.prize}</h2>
                
                {item.id === userLevel ? (
                  <button
                    className={s.button}
                    onClick={handleLevelComplete}
                  >
                    Claim
                  </button>
                ) : (
                  <button
                    className={s.button}
                    disabled
                    style={{
                      background: "#ccc",
                      cursor: "not-allowed",
                      color: "#000",
                    }}
                  >
                    {item.id < userLevel ? "Completed" : "Locked"}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {activePopup && (
        <div className={s.popupOverlay}>
          <div className={s.popup}>
            <h3 className={s.levelTitle}>
              Level {activePopup.id}
              <span className={s.close} onClick={() => setActivePopup(null)}>
                ×
              </span>
            </h3>
            <ul>
              <li>🟢 Minimum deposit {activePopup.conditions.deposit}</li>
              <li>🟢 Minimum profit must be {activePopup.conditions.profit}</li>
              <li>🟢 Minimum FTDs should be {activePopup.conditions.ftds}</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrizePool;
