import React, { useState, useEffect, forwardRef } from "react";
import styles from "./CoinSelector.module.css";
import axios from "axios";

const CoinSelector = forwardRef(
  ({ selectedCoin, setSelectedCoin, disabled, isOpen, setIsOpen }, ref) => {
    const [search, setSearch] = useState("");
    const [activeTab, setActiveTab] = useState("Live");
    const [coins, setCoins] = useState([]);

    useEffect(() => {
      axios
        .get("http://localhost:5000/api/coins")
        .then((res) => {
          console.log(res.data);
          setCoins(res.data);
        })
        .catch(() => setCoins([]));
    }, []);

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
    };

    return (
      <div className={styles.coinSelectorWrapper} ref={ref}>
        <div
          className={styles.coinSelectCustom}
          onClick={() => !disabled && setIsOpen(!isOpen)}
        >
          {selectedCoin || "Select Trade Pair"}
        </div>

        {isOpen && (
          <div className={styles.coinPopup}>
            <div className={styles.coinTabs}>
              {["Live", "OTC"].map((tab) => (
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
