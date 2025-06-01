import React, { useState, useRef, useEffect } from "react";
import { AiOutlineSetting } from "react-icons/ai";
import { HiOutlineVolumeUp } from "react-icons/hi";
import { AiTwotoneBell } from "react-icons/ai";
import styles from "./Tabs.module.css";

const Tabs = () => {
  const unreadNotifications = 5;
  const [showPopup, setShowPopup] = useState(false);
  const [activeTab, setActiveTab] = useState("Notifications");
  const popupRef = useRef(null);

  const dummyNotifications = [
    "New trade executed successfully.",
    "Market update: BTC price has risen by 5%.",
    "New feature available: Dark mode.",
  ];
  const dummyNews = [
    "Breaking News: Ethereum hits a new all-time high.",
    "Crypto adoption increases in South America.",
    "Regulatory updates: New crypto tax laws introduced.",
  ];

  const renderContent = () => {
    const data = activeTab === "Notifications" ? dummyNotifications : dummyNews;

    return data.length > 0 ? (
      data.map((item, index) => (
        <p key={index} className={styles.popupItem}>
          {item}
        </p>
      ))
    ) : (
      <div className={styles.emptyContent}>Empty</div>
    );
  };

  // Close popup if clicked outside
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
