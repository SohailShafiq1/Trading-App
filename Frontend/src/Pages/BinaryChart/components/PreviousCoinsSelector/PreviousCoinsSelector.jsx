import React, { useState, useEffect } from "react";
import { AiOutlineClose } from "react-icons/ai";
import styles from "./PreviousCoinsSelector.module.css";

const PreviousCoinsSelector = ({ setSelectedCoin, coins, currentCoin }) => {
  const [previousCoins, setPreviousCoins] = useState([]);

  // Load previous coins from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("previousSelectedCoins");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setPreviousCoins(parsed);
      } catch (error) {
        console.error("Error parsing previous coins:", error);
        setPreviousCoins([]);
      }
    }
  }, []);

  // Add current coin to previous coins when it changes
  useEffect(() => {
    if (currentCoin && coins.length > 0) {
      const coinData = coins.find((c) => c.name === currentCoin);
      if (coinData) {
        // Create a lightweight version of the coin data
        const lightweightCoin = {
          name: coinData.name,
          firstName: coinData.firstName,
          lastName: coinData.lastName,
          type: coinData.type,
          profitPercentage: coinData.profitPercentage,
        };

        setPreviousCoins((prev) => {
          // Check if coin already exists
          const exists = prev.find((coin) => coin.name === currentCoin);
          if (exists) {
            // Move to front if already exists
            return [
              lightweightCoin,
              ...prev.filter((coin) => coin.name !== currentCoin),
            ];
          } else {
            // Add new coin to front, limit to 6 coins
            const newCoins = [lightweightCoin, ...prev].slice(0, 6);
            return newCoins;
          }
        });
      }
    }
  }, [currentCoin, coins]);

  // Save to localStorage whenever previousCoins changes
  useEffect(() => {
    if (previousCoins.length > 0) {
      try {
        localStorage.setItem(
          "previousSelectedCoins",
          JSON.stringify(previousCoins)
        );
      } catch (error) {
        console.error("Failed to save previous coins to localStorage:", error);
        // If storage is full, try to clear old data and save again
        if (error.name === "QuotaExceededError") {
          try {
            // Clear the previous coins storage and try again with just the current coin
            localStorage.removeItem("previousSelectedCoins");
            if (previousCoins.length > 0) {
              localStorage.setItem(
                "previousSelectedCoins",
                JSON.stringify([previousCoins[0]]) // Only save the most recent coin
              );
            }
          } catch (secondError) {
            console.error("Failed to save even minimal data:", secondError);
          }
        }
      }
    }
  }, [previousCoins]);

  const handleCoinClick = (coin) => {
    setSelectedCoin(coin.name);
  };

  const handleRemoveCoin = (coinToRemove, event) => {
    event.stopPropagation(); // Prevent coin selection when clicking remove
    setPreviousCoins((prev) =>
      prev.filter((coin) => coin.name !== coinToRemove.name)
    );

    // Update localStorage after removal
    const updatedCoins = previousCoins.filter(
      (coin) => coin.name !== coinToRemove.name
    );

    try {
      if (updatedCoins.length > 0) {
        localStorage.setItem(
          "previousSelectedCoins",
          JSON.stringify(updatedCoins)
        );
      } else {
        localStorage.removeItem("previousSelectedCoins");
      }
    } catch (error) {
      console.error("Failed to update localStorage after coin removal:", error);
    }
  };

  if (previousCoins.length === 0) {
    return null; // Don't render if no previous coins
  }

  return (
    <div className={styles.container}>
      <div className={styles.coinsGrid}>
        {previousCoins.map((coin) => (
          <div
            key={coin.name}
            className={`${styles.coinBox} ${
              coin.name === currentCoin ? styles.active : ""
            }`}
            onClick={() => handleCoinClick(coin)}
          >
            <div className={styles.coinInfo}>
              <div className={styles.coinName}>
                {(coin.type === "OTC" || coin.type === "Forex") &&
                (coin.firstName || coin.lastName)
                  ? `${coin.firstName || ""}${
                      coin.lastName ? "/" + coin.lastName : ""
                    }`
                  : coin.name}
              </div>
              <div className={styles.coinType}>
                {coin.type === "OTC"
                  ? "(OTC)"
                  : coin.type === "Forex"
                  ? "(Forex)"
                  : "(Live)"}
              </div>
              {/* <div className={styles.coinProfit}>
                {coin.profitPercentage !== undefined
                  ? coin.profitPercentage
                  : "--"}
                %
              </div> */}
              <div
                className={styles.removeBtn}
                onClick={(e) => handleRemoveCoin(coin, e)}
                title="Remove from list"
              >
                <AiOutlineClose />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PreviousCoinsSelector;
