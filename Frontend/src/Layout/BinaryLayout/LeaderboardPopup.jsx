import React, { useState, useEffect } from "react";
import styles from "./BinaryLayout.module.css";
import { AiOutlineClose } from "react-icons/ai";
import axios from "axios";
import { useAuth } from "../../Context/AuthContext"; // adjust path if needed

const LeaderboardPopup = ({ onClose }) => {
  const [leaders, setLeaders] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/users");
        // Sort users by profit (assuming you want today's profit)
        const today = new Date().toISOString().slice(0, 10);
        const sorted = res.data
          .map((u) => ({
            ...u,
            todayProfit:
              u.dailyProfits?.find((p) => p.date === today)?.profit || 0,
          }))
          .sort((a, b) => b.todayProfit - a.todayProfit);
        setLeaders(sorted);
      } catch (err) {
        setLeaders([]);
      }
    };
    fetchUsers();
  }, []);

  // Find current user's position
  const userIndex = leaders.findIndex((l) => l.email === user?.email);

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

        {user && userIndex !== -1 && (
          <div className={styles.lbHighlight}>
            <div>
              <strong>
                {leaders[userIndex].userId || leaders[userIndex].email}
              </strong>
              <div>Your Position: {userIndex + 1}</div>
            </div>
            <span>${leaders[userIndex].todayProfit.toLocaleString()}</span>
          </div>
        )}

        <div className={styles.lbList}>
          {leaders.map((entry, i) => (
            <div
              key={entry._id}
              className={`${styles.lbItem} ${
                user && entry.email === user.email ? styles.lbActive : ""
              }`}
              onClick={() => setSelectedUser(entry)}
            >
              <span className={styles.lbRank}>
                {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
              </span>
              <span className={styles.lbId}>{entry.userId || entry.email}</span>
              <span className={styles.lbAmount}>
                ${entry.todayProfit.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* User Stats Popup */}
      {selectedUser && (
        <div className={styles.userPopup}>
          <div className={styles.userHeader}>
            <div>
              <strong>{selectedUser.country}</strong>
              <div className={styles.username}>
                {selectedUser.username || selectedUser.email}
              </div>
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
              <div>{selectedUser.trades?.length || 0}</div>
              <div>Trades count</div>
            </div>
            <div>
              <div>
                {selectedUser.trades
                  ? selectedUser.trades.filter((t) => t.result === "win").length
                  : 0}
              </div>
              <div>Profitable trades</div>
            </div>
            <div>
              <div>${selectedUser.todayProfit.toLocaleString()}</div>
              <div>Today's profit</div>
            </div>
            {/* Add more stats as needed */}
          </div>
        </div>
      )}
    </>
  );
};

export default LeaderboardPopup;
