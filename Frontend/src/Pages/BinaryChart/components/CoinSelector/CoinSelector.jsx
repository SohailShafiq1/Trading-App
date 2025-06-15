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
    const [activeTab, setActiveTab] = useState("Live");
    const [coins, setCoins] = useState([]);

    useEffect(() => {
      if (propCoins) {
        setCoins(propCoins);
      } else {
        axios
          .get("http://localhost:5000/api/coins")
          .then((res) => setCoins(res.data))
          .catch(() => setCoins([]));
      }
    }, [propCoins]);

    // On mount, initialize selectedCoin from localStorage if available, or default to EURUSD for Forex
    useEffect(() => {
      const storedCoin = localStorage.getItem("selectedCoin");
      if (storedCoin && !selectedCoin) {
        setSelectedCoin(storedCoin);
      } else if (!storedCoin && !selectedCoin) {
        // If no coin is selected or stored, default to EURUSD if it exists in the list
        axios.get("http://localhost:5000/api/coins").then((res) => {
          const forexCoin = res.data.find(
            (c) => c.type === "Forex" && c.name === "EURUSD"
          );
          if (forexCoin) {
            setSelectedCoin("EURUSD");
            localStorage.setItem("selectedCoin", "EURUSD");
          }
        });
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
        coin.type === activeTab &&
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
      // Do not auto-select a Forex coin; just show the list
    };

    return (
      <div className={styles.coinSelectorWrapper} ref={ref}>
       

        {isOpen && (
          <div className={styles.coinPopup}>
            <div className={styles.coinTabs}>
              {["Live", "OTC", "Forex"].map((tab) => (
                <button
                  key={tab}
                  className={`${styles.coinTab} ${
                    activeTab === tab ? styles.active : ""
                  }`}
                  onClick={() => handleTabClick(tab)}
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
