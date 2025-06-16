import React, { useState, useEffect, forwardRef } from "react";
import styles from "./CoinSelector.module.css";
import axios from "axios";

const CoinSelector = forwardRef(
  (
    {
      selectedCoin,
      setSelectedCoin,
      disabled,
      isOpen,
      setIsOpen,
      coins: propCoins,
    },
    ref
  ) => {
    const [search, setSearch] = useState("");
    // Only show Forex coins, but label the tab as 'Live'
    const allowedTabs = ["Live", "OTC"];
    const [activeTab, setActiveTab] = useState(allowedTabs[0]);
    const [coins, setCoins] = useState([]);

    useEffect(() => {
      if (propCoins) {
        setCoins(propCoins);
      } else {
        axios
          .get(`${import.meta.env.VITE_BACKEND_URL}/api/coins`)
          .then((res) => setCoins(res.data))
          .catch(() => setCoins([]));
      }
    }, [propCoins]);

    // On mount, initialize selectedCoin from localStorage if available, or default to EURUSD for Forex
    useEffect(() => {
      const storedCoin = localStorage.getItem("selectedCoin");
      if (storedCoin && !selectedCoin) {
        setSelectedCoin(storedCoin);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Whenever selectedCoin changes, update localStorage
    useEffect(() => {
      if (selectedCoin) {
        localStorage.setItem("selectedCoin", selectedCoin);
      }
    }, [selectedCoin]);

    const filteredCoins = coins.filter(
      (coin) =>
        ((activeTab === "Live" && coin.type === "Forex") ||
          (activeTab === "OTC" && coin.type === "OTC")) &&
        (coin.name.toLowerCase().includes(search.toLowerCase()) ||
          ((coin.firstName || "") + " " + (coin.lastName || ""))
            .toLowerCase()
            .includes(search.toLowerCase()))
    );

    const handleSelect = (coin) => {
      setSelectedCoin(coin.name);
      setIsOpen(false);
      localStorage.setItem("selectedCoin", coin.name);
    };

    const handleTabClick = (tab) => {
      setActiveTab(tab);
      // Removed auto-select logic for Forex
    };

    return (
      <div className={styles.coinSelectorWrapper} ref={ref}>
        {isOpen && (
          <div className={styles.coinPopup}>
            <div className={styles.coinTabs}>
              {allowedTabs.map((tab) => (
                <button
                  key={tab}
                  className={`${styles.coinTab} ${
                    activeTab === tab ? styles.active : ""
                  }`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>

            <input
              type="text"
              className={styles.coinSearch}
              placeholder="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <div className={styles.coinListPopup}>
              <div className={styles.coinHeader}>
                <span>Name</span>
                <span>Profit</span>
              </div>
              {filteredCoins.map((coin) => (
                <div
                  key={coin._id}
                  className={styles.coinRow}
                  onClick={() => handleSelect(coin)}
                >
                  <span>
                    {coin.type === "OTC"
                      ? `${coin.firstName} (${coin.name})`
                      : coin.name}
                  </span>
                  <span>
                    {coin.profitPercentage !== undefined
                      ? coin.profitPercentage
                      : "--"}
                    %
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }
);

export default CoinSelector;
