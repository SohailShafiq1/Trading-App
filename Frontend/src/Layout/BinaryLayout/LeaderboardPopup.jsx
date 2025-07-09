import React, { useState, useEffect } from "react";
import styles from "./BinaryLayout.module.css";
import { AiOutlineClose } from "react-icons/ai";
import axios from "axios";
import { useAuth } from "../../Context/AuthContext"; // adjust path if needed

const todayStr = new Date().toISOString().slice(0, 10);

const LeaderboardPopup = ({ onClose }) => {
  const [leaders, setLeaders] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchLeaders = async () => {
      try {
        // Fetch admin leaderboard entries
        const adminRes = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/admin/leaderboard`
        );
        const adminEntries = adminRes.data;

        // Fetch all users (with email, userId, etc.)
        const usersRes = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/admin/all-users`
        );
        console.log("Fetched users:", usersRes.data); // Debug: log users response
        const users = usersRes.data.users;

        // For each user, fetch their profit for today and trades info
        const userProfits = await Promise.all(
          users.map(async (u) => {
            try {
              console.log("Fetching user details for:", u.email); // Debug: log each user email
              const userDetailRes = await axios.get(
                `${import.meta.env.VITE_BACKEND_URL}/api/users/email/${u.email}`
              );
              const userDetail = userDetailRes.data;
              const todayProfit =
                userDetail.dailyProfits?.find((p) => p.date === todayStr)
                  ?.profit || 0;
              const trades = userDetail.trades || [];
              const tradesCount = trades.length;
              const profitableTrades = trades.filter(
                (t) => t.result === "win"
              ).length;
              return {
                ...u,
                username: userDetail.username || u.firstName || u.email,
                country: userDetail.country || "",
                todayProfit,
                tradesCount,
                profitableTrades,
                trades,
              };
            } catch {
              return null;
            }
          })
        );

        // Merge logic: for each unique email, use the higher of real or admin-entered profit
        const byEmail = {};

        // Add all admin entries
        for (const entry of adminEntries) {
          byEmail[entry.email] = {
            ...entry,
            tradesCount: entry.tradesCount ?? 0,
            profitableTrades: entry.profitableTrades ?? 0,
            trades: [],
            username: entry.username || entry.email,
          };
        }

        // For each real user, if profit is higher, use it
        for (const real of userProfits.filter(Boolean)) {
          if (
            !byEmail[real.email] ||
            real.todayProfit > Number(byEmail[real.email].todayProfit)
          ) {
            byEmail[real.email] = real;
          }
        }

        // Sort by profit descending
        const sorted = Object.values(byEmail).sort(
          (a, b) => Number(b.todayProfit) - Number(a.todayProfit)
        );
        setLeaders(sorted);
      } catch (err) {
        setLeaders([]);
      }
    };
    fetchLeaders();
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
            <span>
              ${Number(leaders[userIndex].todayProfit).toLocaleString()}
            </span>
          </div>
        )}

        <div className={styles.lbList}>
          {leaders.map((entry, i) => (
            <div
              key={entry.email}
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
                ${Number(entry.todayProfit).toLocaleString()}
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
              <div>
                {selectedUser.tradesCount ?? selectedUser.trades?.length ?? 0}
              </div>
              <div>Trades count</div>
            </div>
            <div>
              <div>
                {selectedUser.profitableTrades ??
                  (selectedUser.trades
                    ? selectedUser.trades.filter((t) => t.result === "win")
                        .length
                    : 0)}
              </div>
              <div>Profitable trades</div>
            </div>
            <div>
              <div>${Number(selectedUser.todayProfit).toLocaleString()}</div>
              <div>Today's profit</div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LeaderboardPopup;
