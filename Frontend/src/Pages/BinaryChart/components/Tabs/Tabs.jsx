import { BiVolumeMute } from "react-icons/bi";
import React, { useState, useRef, useEffect } from "react";
import { AiOutlineSetting } from "react-icons/ai";
import { HiOutlineVolumeUp } from "react-icons/hi";
import { AiTwotoneBell } from "react-icons/ai";
import axios from "axios";
import styles from "./Tabs.module.css";
import { useAuth } from "../../../../Context/AuthContext";
import { useAccountType } from "../../../../Context/AccountTypeContext";
import { NavLink } from "react-router-dom";
import { useTheme } from "../../../../Context/ThemeContext";

const Tabs = () => {
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [activeTab, setActiveTab] = useState("Notifications");
  const [newsList, setNewsList] = useState([]);
  const [showSettingsPopup, setShowSettingsPopup] = useState(false);
  const [showTradePopup, setShowTradePopup] = useState(false);
  const [totalTrades, setTotalTrades] = useState(0); // Simulated total trades
  const [unreadNews, setUnreadNews] = useState(0);
  const popupRef = useRef(null);
  const settingsRef = useRef(null);
  const tradePopupRef = useRef(null);
  const { user } = useAuth();
  const { mute, isMute } = useAccountType();
  const { theme, setTheme, THEMES } = useTheme();

  useEffect(() => {
    const fetchTradeCount = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/users/tradeCount/${
            user.email
          }`
        );
        setTotalTrades(res.data.totalTrades);
      } catch (err) {
        console.error("Error Fetching trades", err);
      }
    };
    fetchTradeCount();
  }, []);
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/users/notifications/${
            user.email
          }`
        );
        setNotifications(res.data.notifications || []);
        setUnreadNotifications(res.data.unreadCount || 0);
      } catch (err) {
        console.error("Error fetching notifications:", err);
      }
    };

    const fetchNews = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/news?email=${user.email}`
        );
        // Sort news by createdAt (latest first)
        const sortedNews = (res.data.news || [])
          .slice()
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setNewsList(sortedNews);
        setUnreadNews(res.data.unreadCount || 0);
      } catch (err) {
        console.error("Error fetching news:", err);
      }
    };

    fetchNotifications();
    fetchNews();
  }, [user.email]);

  // Mark all notifications/news as read when popup is opened
  useEffect(() => {
    if (showPopup) {
      // Mark notifications as read
      axios
        .put(
          `${
            import.meta.env.VITE_BACKEND_URL
          }/api/users/notifications/mark-all-read/${user.email}`
        )
        .then(() => setUnreadNotifications(0));
      // Mark news as read
      axios
        .put(
          `${import.meta.env.VITE_BACKEND_URL}/api/news/mark-all-read/${
            user.email
          }`
        )
        .then(() => setUnreadNews(0));
    }
  }, [showPopup, user.email]);

  const renderContent = () => {
    if (activeTab === "Notifications") {
      return notifications.length > 0 ? (
        notifications.map((item, index) => (
          <p key={index} className={styles.popupItem}>
            <strong style={{ color: "Green", fontSize: "14px" }}>
              {item.type ? `${item.type}: ` : ""}
            </strong>
            <br />
            <div
              style={{
                color: "black",
                fontWeight: "700",
                fontSize: "16px",
              }}
            >
              {item.message}
            </div>
            <br />
            <strong style={{ color: "red" }}>
              {new Date(item.createdAt).toLocaleString()}
            </strong>
          </p>
        ))
      ) : (
        <div className={styles.emptyContent}>No notifications available.</div>
      );
    } else if (activeTab === "News") {
      return newsList.length > 0 ? (
        newsList.map((news, index) => (
          <div key={index} className={styles.newsItem}>
            <h4 className={styles.newsTitle}>{news.title}</h4>
            <p className={styles.newsContent}>{news.content}</p>
          </div>
        ))
      ) : (
        <div className={styles.emptyContent}>No news available.</div>
      );
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        setShowPopup(false);
      }
      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
        setShowSettingsPopup(false);
      }
      if (
        tradePopupRef.current &&
        !tradePopupRef.current.contains(event.target)
      ) {
        setShowTradePopup(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Combine unread notifications and news
  const totalUnread = unreadNotifications + unreadNews;

  // Poll for new notifications and news every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      // Fetch notifications
      axios
        .get(
          `${import.meta.env.VITE_BACKEND_URL}/api/users/notifications/${
            user.email
          }`
        )
        .then((res) => {
          setNotifications(res.data.notifications || []);
          setUnreadNotifications(res.data.unreadCount || 0);
        });
      // Fetch news
      axios
        .get(`${import.meta.env.VITE_BACKEND_URL}/api/news?email=${user.email}`)
        .then((res) => {
          const sortedNews = (res.data.news || [])
            .slice()
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          setNewsList(sortedNews);
          setUnreadNews(res.data.unreadCount || 0);
        });
    }, 10000); // 10 seconds
    return () => clearInterval(interval);
  }, [user.email]);

  return (
    <div className={styles.tabs}>
      {/* Notifications Tab */}
      <div className={styles.tab} style={{ position: "relative" }}>
        <button className={styles.tabBTN}>
          <AiTwotoneBell
            onClick={() => {
              setShowPopup(!showPopup);
              setShowSettingsPopup(false);
            }}
          />
        </button>
        {totalUnread > 0 && (
          <span
            className={styles.notificationBadge}
            onClick={() => {
              setShowPopup(true);
              setShowSettingsPopup(false);
              setShowTradePopup(false);
            }}
          >
            {totalUnread}
          </span>
        )}
        {showPopup && (
          <div className={styles.popup} ref={popupRef}>
            <div className={styles.popupHeader}>
              <button
                className={`${styles.tabButton} ${
                  activeTab === "Notifications" ? styles.activeTabButton : ""
                }`}
                onClick={() => setActiveTab("Notifications")}
              >
                Notifications
              </button>
              <button
                className={`${styles.tabButton} ${
                  activeTab === "News" ? styles.activeTabButton : ""
                }`}
                onClick={() => setActiveTab("News")}
              >
                News
              </button>
            </div>
            <div className={styles.popupContent}>{renderContent()}</div>
          </div>
        )}
      </div>

      {/* Mute/Unmute Tab */}
      <div className={styles.tab}>
        <button
          className={styles.tabBTN}
          onClick={() => {
            setShowSettingsPopup(false);
            setShowPopup(false);
            isMute(!mute);
          }}
        >
          {mute ? <BiVolumeMute /> : <HiOutlineVolumeUp />}
        </button>
      </div>

      {/* Settings Tab */}
      <div className={styles.tab} style={{ position: "relative" }}>
        <button
          className={styles.tabBTN}
          onClick={() => {
            setShowSettingsPopup(!showSettingsPopup);
            setShowPopup(false);
          }}
        >
          <AiOutlineSetting />
        </button>
        {showSettingsPopup && (
          <div className={styles.settingsPopup} ref={settingsRef}>
            {/* Theme Switcher */}
            <div
              style={{
                marginBottom: 12,
                display: "flex",
                gap: 8,
                flexDirection: "column",
              }}
            >
              <span
                style={{
                  fontWeight: 600,
                  fontSize: 14,
                  marginBottom: 2,
                }}
              >
                Theme:
              </span>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  style={{
                    background: theme.name === "Black" ? "#111" : "#eee",
                    color: theme.name === "Black" ? "#fff" : "#222",
                    border:
                      theme.name === "Black"
                        ? "2px solid #10A055"
                        : "1px solid #ccc",
                    borderRadius: 6,
                    padding: "4px 12px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                  onClick={() => setTheme(THEMES.BLACK)}
                >
                  Black
                </button>
                <button
                  style={{
                    background: theme.name === "White" ? "#fff" : "#eee",
                    color: theme.name === "White" ? "#222" : "#222",
                    border:
                      theme.name === "White"
                        ? "2px solid #10A055"
                        : "1px solid #ccc",
                    borderRadius: 6,
                    padding: "4px 12px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                  onClick={() => setTheme(THEMES.WHITE)}
                >
                  White
                </button>
                <button
                  style={{
                    background: theme.name === "Grey" ? "#e5e5e5" : "#eee",
                    color: theme.name === "Grey" ? "#222" : "#222",
                    border:
                      theme.name === "Grey"
                        ? "2px solid #10A055"
                        : "1px solid #ccc",
                    borderRadius: 6,
                    padding: "4px 12px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                  onClick={() => setTheme(THEMES.GREY)}
                >
                  Grey
                </button>
              </div>
            </div>
            <NavLink
              to={"/binarychart/bankinglayout/deposit"}
              className={styles.settingButton}
            >
              Deposit
            </NavLink>
            <NavLink
              to={"/binarychart/bankinglayout/withdraw"}
              className={styles.settingButton}
            >
              Withdrawal
            </NavLink>
            <NavLink
              to={"/binarychart/bankinglayout/transactions"}
              className={styles.settingButton}
            >
              Transactions
            </NavLink>
            <NavLink
              className={styles.settingButton}
              onClick={() => setShowTradePopup(!showTradePopup)}
            >
              Trades
            </NavLink>
            <NavLink
              to={"/binarychart/profile"}
              className={styles.settingButton}
            >
              Account
            </NavLink>
          </div>
        )}
        {showTradePopup && (
          <div className={styles.tradePopup} ref={tradePopupRef}>
            <h3>Total Trades</h3>
            <p>
              <strong>{totalTrades}</strong>
            </p>
            <button
              className={styles.closeButton}
              onClick={() => setShowTradePopup(false)}
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Tabs;
