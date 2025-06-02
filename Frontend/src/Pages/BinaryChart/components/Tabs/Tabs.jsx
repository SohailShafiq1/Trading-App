import React, { useState, useRef, useEffect } from "react";
import { AiOutlineSetting } from "react-icons/ai";
import { HiOutlineVolumeUp } from "react-icons/hi";
import { AiTwotoneBell } from "react-icons/ai";
import axios from "axios";
import styles from "./Tabs.module.css";
import User from "../../../../../../Backend/models/User";
import { useAuth } from "../../../../Context/AuthContext";

const Tabs = () => {
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [notifications, setNotifications] = useState([]); // Ensure notifications is initialized as an empty array
  const [showPopup, setShowPopup] = useState(false);
  const [activeTab, setActiveTab] = useState("Notifications");
  const [newsList, setNewsList] = useState([]); // Ensure newsList is initialized as an empty array
  const popupRef = useRef(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await axios.get(
          `http://localhost:5000/api/users/notifications/${user.email}`
        );
        setNotifications(res.data); // Fallback to empty array if undefined
        setUnreadNotifications(res.data.unreadCount || 0); // Fallback to 0 if undefined
      } catch (err) {
        console.error("Error fetching notifications:", err);
      }
    };

    const fetchNews = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/news");
        setNewsList(res.data || []); // Fallback to empty array if undefined
      } catch (err) {
        console.error("Error fetching news:", err);
      }
    };

    fetchNotifications();
    fetchNews();
  }, []);

  const renderContent = () => {
    if (activeTab === "Notifications") {
      return (notifications || []).length > 0 ? (
        notifications.map((item, index) => (
          <p key={index} className={styles.popupItem}>
            {item.type ? `${item.type}: ` : ""} {item.message} -{" "}
            {new Date(item.createdAt).toLocaleString()}{" "}
          </p>
        ))
      ) : (
        <div className={styles.emptyContent}>No notifications availabl e.</div>
      );
    } else if (activeTab === "News") {
      return (newsList || []).length > 0 ? (
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
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className={styles.tabs}>
      <div className={styles.tab} style={{ position: "relative" }}>
        <AiTwotoneBell onClick={() => setShowPopup(!showPopup)} />
        {unreadNotifications > 0 && (
          <span className={styles.notificationBadge}>
            {unreadNotifications}
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

      <div className={styles.tab}>
        <HiOutlineVolumeUp />
      </div>
      <div className={styles.tab}>
        <AiOutlineSetting />
      </div>
    </div>
  );
};

export default Tabs;
