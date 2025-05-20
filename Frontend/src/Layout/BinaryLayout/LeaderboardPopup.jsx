import React, { useState } from "react";
import styles from "./BinaryLayout.module.css";
import { AiOutlineClose } from "react-icons/ai";

const LeaderboardPopup = ({ onClose }) => {
  const [selectedUser, setSelectedUser] = useState(null);

  const leaders = [
    {
      id: "#55445289",
      amount: 16156,
      trades: 26,
      profit: 1096.15,
      country: "Pakistan",
      username: "haseeb_trading",
      profitable: 18,
    },
    {
      id: "#55444258",
      amount: 12106,
      trades: 20,
      profit: 950.0,
      country: "USA",
      username: "john_trader",
      profitable: 15,
    },
    {
      id: "#55441148",
      amount: 11100,
      trades: 22,
      profit: 870.25,
      country: "UK",
      username: "lisa_trade",
      profitable: 16,
    },
    {
      id: "#55468924",
      amount: 10500,
      trades: 19,
      profit: 800,
      country: "India",
      username: "amitx",
      profitable: 13,
    },
    {
      id: "#55440058",
      amount: 8589,
      trades: 16,
      profit: 600,
      country: "Canada",
      username: "maple_fx",
      profitable: 10,
    },
  ];

  return (
    <>
      {/* Leaderboard Sidebar */}
      <div className={styles.lbSidebar}>
        <div className={styles.lbHeader}>
          <div>
            <div className={styles.lbTitle}>Leader Board</div>
            <div className={styles.lbSubTitle}>of the Day</div>
          </div>
          <button className={styles.lbClose} onClick={onClose}>
            <AiOutlineClose size={18} />
          </button>
        </div>

        <div className={styles.lbHighlight}>
          <div>
            <strong>#55468924</strong>
            <div>Your Position: 4</div>
          </div>
          <span>$10,500</span>
        </div>

        <div className={styles.lbList}>
          {leaders.map((entry, i) => (
            <div
              key={i}
              className={`${styles.lbItem} ${
                entry.id === "#55468924" ? styles.lbActive : ""
              }`}
              onClick={() => setSelectedUser(entry)}
            >
              <span className={styles.lbRank}>
                {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
              </span>
              <span className={styles.lbId}>{entry.id}</span>
              <span className={styles.lbAmount}>
                ${entry.amount.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* User Stats Popup (positioned left of the sidebar) */}
      {selectedUser && (
        <div className={styles.userPopup}>
          <div className={styles.userHeader}>
            <div>
              <strong>{selectedUser.country}</strong>
              <div className={styles.username}>{selectedUser.username}</div>
            </div>
            <button
              className={styles.userClose}
              onClick={() => setSelectedUser(null)}
            >
              ✕
            </button>
          </div>
          <div className={styles.userStats}>
            <div>
              <div>{selectedUser.trades}</div>
              <div>Trades count</div>
            </div>
            <div>
              <div>{selectedUser.profitable}</div>
              <div>Profitable trades</div>
            </div>
            <div>
              <div>${selectedUser.amount.toLocaleString()}</div>
              <div>Trades profit</div>
            </div>
            <div>
              <div>${selectedUser.profit}</div>
              <div>Average profit</div>
            </div>
            <div>
              <div>$2,000.00</div>
              <div>Min trade amount</div>
            </div>
            <div>
              <div>$3,000.00</div>
              <div>Max trade amount</div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LeaderboardPopup;
