import React, { useState } from "react";
import styles from "./PrizePool.module.css";
import { useAffiliateAuth } from "../../Context/AffiliateAuthContext";
const s = styles;

const PrizeArray = [
  { id: 1, prize: "100$", conditions: { deposit: "$2500", profit: "$2000", ftds: "10" } },
  { id: 2, prize: "300$", conditions: { deposit: "$3000", profit: "$2500", ftds: "15" } },
  { id: 3, prize: "500$", conditions: { deposit: "$4000", profit: "$3000", ftds: "20" } },
  { id: 4, prize: "1000$", conditions: { deposit: "$5000", profit: "$4000", ftds: "25" } },
  { id: 5, prize: "5000$", conditions: { deposit: "$7000", profit: "$6000", ftds: "35" } },
  { id: 6, prize: "15,000$", conditions: { deposit: "$10000", profit: "$9000", ftds: "50" } },
  { id: 7, prize: "30,000$", conditions: { deposit: "$15000", profit: "$14000", ftds: "70" } },
];

const PrizePool = () => {
  const [activePopup, setActivePopup] = useState(null);
  const { affiliate } = useAffiliateAuth();
  const userLevel = affiliate?.level || 1;

  return (
    <div className={s.container}>
      <div className={s.prizePool}>
        <div className={s.box}>
          <h1>Prize Pool</h1>
          <p>
            Hit all three targets to claim your reward. You can choose to take
            the prize or receive a cash alternative.
          </p>
          <div className={s.prizes}>
            {PrizeArray.map((item) => (
              <div key={item.id} className={s.prize}>
                <h2 className={s.id}>Level {item.id}</h2>
                <h2 className={s.name}>{item.prize}</h2>
                {item.id <= userLevel ? (
                  <button
                    className={s.button}
                    onClick={() => setActivePopup(item)}
                  >
                    Claim
                  </button>
                ) : (
                  <button
                    className={s.button}
                    disabled
                    style={{ background: "#ccc", cursor: "not-allowed",color: "#000" }}
                  >
                    Locked
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
