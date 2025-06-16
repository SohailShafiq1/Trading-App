import React, { useState, useEffect } from "react";
import styles from "./PrizePool.module.css";
import { useAffiliateAuth } from "../../Context/AffiliateAuthContext";
import io from "socket.io-client";

const PrizeArray = [
  {
    id: 1,
    prize: "100$",
    timeLimit: 5,
    conditions: { deposit: 2500, profit: 2000 },
  },
  {
    id: 2,
    prize: "300$",
    timeLimit: 5,
    conditions: { deposit: 3000, profit: 2500 },
  },
  {
    id: 3,
    prize: "500$",
    timeLimit: 5,
    conditions: { deposit: 4000, profit: 3000 },
  },
  {
    id: 4,
    prize: "1000$",
    timeLimit: 5,
    conditions: { deposit: 5000, profit: 4000 },
  },
  {
    id: 5,
    prize: "5000$",
    timeLimit: 5,
    conditions: { deposit: 7000, profit: 6000 },
  },
  {
    id: 6,
    prize: "15,000$",
    timeLimit: 3,
    conditions: { deposit: 10000, profit: 9000 },
  },
  {
    id: 7,
    prize: "30,000$",
    timeLimit: 3,
    conditions: { deposit: 15000, profit: 14000 },
  },
];
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const PrizePool = () => {
  const { affiliate } = useAffiliateAuth();
  const [activePopup, setActivePopup] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [affiliateData, setAffiliateData] = useState(affiliate);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [timeExpired, setTimeExpired] = useState(false);
  const [socket, setSocket] = useState(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io(BACKEND_URL, {
      withCredentials: true,
    });
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Register affiliate with socket when email is available
  useEffect(() => {
    if (socket && affiliate?.email) {
      socket.emit("registerAffiliate", affiliate.email);

      socket.on("timerUpdate", (data) => {
        setTimeLeft(data.timeLeft);
        setTimeExpired(data.timeExpired || false);

        // Update level if changed
        if (data.level !== (affiliateData?.level || 1)) {
          setAffiliateData((prev) => ({
            ...prev,
            level: data.level,
          }));
        }
      });

      socket.on("connect_error", (err) => {
        console.error("Socket connection error:", err);
      });
    }

    return () => {
      if (socket) {
        socket.off("timerUpdate");
        socket.off("connect_error");
      }
    };
  }, [socket, affiliate?.email]);

  // Fetch and update affiliate data
  const fetchData = async () => {
    if (!affiliate?.email) return;

      try {
        setIsLoading(true);
        
        // First update team totals
        await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/affiliate/update-team-totals/${affiliate.email}`,
          { credentials: "include" }
        );

        // Then get updated affiliate data
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/affiliate/me`, {
          credentials: "include",
        });
        
        if (!res.ok) throw new Error("Failed to fetch affiliate data");
        
        const data = await res.json();
        setAffiliateData(data.user || data);
        
        // Check level status after loading data
        await checkLevelStatus();
      } catch (err) {
        console.error("Error fetching affiliate data:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
        setIsInitialLoad(false);
      }
    };

  useEffect(() => {
    fetchData();
  }, [affiliate?.email]);

  // Check level status and timer
  const checkLevelStatus = async () => {
    if (!affiliate?.email) return;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/affiliate/check-level-status/${affiliate.email}`,
        { credentials: "include" }
      );
      const data = await response.json();

      if (data.timeExpired) {
        setTimeExpired(true);
        // Refresh affiliate data if level was reset
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/affiliate/me`, {
          credentials: "include",
        });
        const updated = await res.json();
        setAffiliateData(updated.user || updated);
      } else {
        setTimeExpired(false);
      }

      if (data.timeLeft !== undefined) {
        setTimeLeft(data.timeLeft);
      }
    } catch (err) {
      console.error("Error checking level status:", err);
    }
  };

  // Set up interval for checking level status
  useEffect(() => {
    if (isInitialLoad) return;

    const interval = setInterval(() => {
      checkLevelStatus();
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [isInitialLoad, affiliate?.email]);

  // Timer countdown
  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1000) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (ms) => {
    if (ms <= 0) return "Time expired";

    const totalSeconds = Math.floor(ms / 1000);
    const days = Math.floor(totalSeconds / (24 * 3600));
    const hours = Math.floor((totalSeconds % (24 * 3600)) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  };

  const checkLevelConditions = (level) => {
    if (!affiliateData) return false;

    const depositMet = affiliateData.totalDeposit >= level.conditions.deposit;
    const profitMet = affiliateData.totalProfit >= level.conditions.profit;

    return {
      allMet: depositMet && profitMet,
      depositMet,
      profitMet,
      requiredDeposit: level.conditions.deposit,
      requiredProfit: level.conditions.profit,
      currentDeposit: affiliateData.totalDeposit || 0,
      currentProfit: affiliateData.totalProfit || 0,
    };
  };

  const handleLevelComplete = async () => {
    if (!affiliate?.email) return;
    setIsLoading(true);
    setError(null);
    setTimeExpired(false);

    try {
      const response = await fetch(
        `${BACKEND_URL}/api/affiliate/complete-level/${affiliate.email}`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || "Failed to complete level");
      }

      if (data.timeExpired) {
        setTimeExpired(true);
      }

      if (data.success) {
        // Refresh data after level completion
        const res = await fetch(`${BACKEND_URL}/api/affiliate/me`, {
          credentials: "include",
        });
        const updated = await res.json();
        setAffiliateData(updated.user || updated);
        
        // Check the new level status
        await checkLevelStatus();
      } else {
        const currentLevel = PrizeArray.find(
          (l) => l.id === (affiliateData?.level || 1)
        );

        if (currentLevel) {
          const conditions = checkLevelConditions(currentLevel);
          setActivePopup({
            ...currentLevel,
            ...conditions,
          });
        }
      }

      await fetchData();
    } catch (err) {
      setError(err.message);
      console.error("Error completing level:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const getLevelStatus = (levelId) => {
    const currentLevel = affiliateData?.level || 1;
    if (levelId < currentLevel) {
      return "completed";
    } else if (levelId === currentLevel) {
      const level = PrizeArray.find((l) => l.id === levelId);
      const conditions = checkLevelConditions(level);
      return conditions.allMet ? "current-completed" : "current";
    } else {
      return "locked";
    }
  };

  if (isLoading && !affiliateData) {
    return <div className={styles.loading}>Loading prize pool data...</div>;
  }

  return (
    <div className={styles.container}>
      {timeExpired && (
        <div className={styles.timeExpiredBanner}>
          Time expired! You've been reset to Level 1
        </div>
      )}

      <div className={styles.prizePool}>
        <div className={styles.box}>
          <h1 className={styles.Header}>Prize Pool</h1>
          <p className={styles.description}>
            Hit all targets within the time limit to claim your reward. First 5
            levels have 5 days each, last 2 levels have 3 days each. If you
            don't complete a level in time, you'll be reset to Level 1.
          </p>

          <div className={styles.timerContainer}>
            <b>Time left for Level {affiliateData?.level || 1}: </b>
            <span className={styles.timer}>{formatTime(timeLeft)}</span>
          </div>

          <div className={styles.prizes}>
            {PrizeArray.map((item) => {
              const status = getLevelStatus(item.id);
              return (
                <div
                  key={item.id}
                  className={`${styles.prize} ${
                    status === "completed" ? styles.completed : ""
                  } ${status === "current" ? styles.current : ""} ${
                    status === "current-completed"
                      ? styles.currentCompleted
                      : ""
                  }`}
                >
                  <h2 className={styles.id}>Level {item.id}</h2>
                  <h2 className={styles.name}>{item.prize}</h2>

                  {status === "completed" ? (
                    <button
                      className={`${styles.button} ${styles.completedButton}`}
                      disabled
                    >
                      Completed
                    </button>
                  ) : status === "current-completed" ? (
                    <button
                      className={`${styles.button} ${styles.registerBtn}`}
                      onClick={handleLevelComplete}
                      disabled={isLoading}
                    >
                      {isLoading ? "Processing..." : "Claim Now"}
                    </button>
                  ) : status === "current" ? (
                    <button
                      className={`${styles.button} ${styles.currentButton}`}
                      onClick={() => {
                        const conditions = checkLevelConditions(item);
                        setActivePopup({
                          ...item,
                          ...conditions,
                        });
                      }}
                    >
                      View Requirements
                    </button>
                  ) : (
                    <button
                      className={`${styles.button} ${styles.lockedButton}`}
                      disabled
                    >
                      Locked
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {activePopup && (
        <div className={styles.popupOverlay}>
          <div className={styles.popup}>
            <h3 className={styles.levelTitle}>
              Level {activePopup.id} Requirements
              <span
                className={styles.close}
                onClick={() => setActivePopup(null)}
              >
                ×
              </span>
            </h3>

            <div className={styles.timeLimitInfo}>
              Time Limit: {activePopup.timeLimit} days
            </div>

            <div className={styles.requirementsList}>
              <div className={styles.requirementItem}>
                <span className={styles.requirementLabel}>
                  Minimum Deposit:
                </span>
                <span className={styles.requirementValue}>
                  ${activePopup.requiredDeposit}
                </span>
                <span
                  className={
                    activePopup.depositMet
                      ? styles.requirementMet
                      : styles.requirementNotMet
                  }
                >
                  {activePopup.depositMet ? "✓" : "✗"}
                </span>
                <span className={styles.yourValue}>
                  (Your team: ${activePopup.currentDeposit})
                </span>
              </div>

              <div className={styles.requirementItem}>
                <span className={styles.requirementLabel}>Minimum Profit:</span>
                <span className={styles.requirementValue}>
                  ${activePopup.requiredProfit}
                </span>
                <span
                  className={
                    activePopup.profitMet
                      ? styles.requirementMet
                      : styles.requirementNotMet
                  }
                >
                  {activePopup.profitMet ? "✓" : "✗"}
                </span>
                <span className={styles.yourValue}>
                  (Your team: ${activePopup.currentProfit})
                </span>
              </div>
            </div>

            {activePopup.allMet ? (
              <button
                className={styles.claimButton}
                onClick={() => {
                  setActivePopup(null);
                  handleLevelComplete();
                }}
                disabled={isLoading}
              >
                {isLoading ? "Claiming..." : "Claim Prize"}
              </button>
            ) : (
              <button
                className={styles.closePopup}
                onClick={() => setActivePopup(null)}
              >
                Close
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PrizePool;
