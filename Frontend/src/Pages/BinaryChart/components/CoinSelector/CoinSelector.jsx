import React, { useState, useEffect, forwardRef } from "react";
import styles from "./CoinSelector.module.css";
import axios from "axios";
import { useTheme } from "../../../../Context/ThemeContext";

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
    const { theme } = useTheme();
    const [search, setSearch] = useState("");
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

    const handleSelect = (coin) => {
      setSelectedCoin(coin.name);
      setIsOpen(false);
      localStorage.setItem("selectedCoin", coin.name);
    };

    return (
      <div
        className={styles.coinSelectorWrapper}
        ref={ref}
        style={{ background: theme.background }}
      >
        {isOpen && (
          <div
            className={styles.coinPopup}
            style={{
              background: theme.box,
              color: theme.textColor,
              border: `1.5px solid ${theme.inputBackground}`,
              boxShadow: "0 4px 16px rgba(0,0,0,0.10)",
            }}
          >
            <input
              type="text"
              className={styles.coinSearch}
              placeholder="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                background: theme.inputBackground,
                color: theme.textColor,
                border: `1px solid ${theme.box}`,
                borderRadius: 6,
                marginBottom: 8,
                padding: 7,
                outline: "none",
                transition: "background 0.2s, color 0.2s, border 0.2s",
              }}
            />

            <div
              className={styles.coinListPopup}
              style={{ background: theme.box, color: theme.textColor }}
            >
              <div
                className={styles.coinHeader}
                style={{ color: theme.textColor, opacity: 0.8 }}
              >
                <span>Name</span>
                <span>Profit</span>
              </div>
              {coins
                .filter(
                  (coin) =>
                    coin.name.toLowerCase().includes(search.toLowerCase()) ||
                    ((coin.firstName || "") + " " + (coin.lastName || ""))
                      .toLowerCase()
                      .includes(search.toLowerCase())
                )
                .map((coin) => (
                  <div
                    key={coin._id}
                    className={styles.coinRow}
                    onClick={() => handleSelect(coin)}
                    style={{
                      background:
                        coin.name === selectedCoin
                          ? theme.inputBackground
                          : theme.box,
                      color: theme.textColor,
                      borderRadius: 5,
                      cursor: "pointer",
                      transition: "background 0.2s, color 0.2s",
                    }}
                  >
                    <span>
                      {(coin.type === "OTC" || coin.type === "Forex") &&
                      (coin.firstName || coin.lastName)
                        ? `${coin.firstName || ""}${
                            coin.lastName ? "/" + coin.lastName : ""
                          }`
                        : coin.name}
                      <span
                        style={{
                          fontSize: "0.95em",
                          color: "#10a055", // keep special color for Buy/Sell
                          marginLeft: 8,
                          fontWeight: 700,
                          letterSpacing: 0.5,
                        }}
                      >
                        {coin.type === "OTC" ? "(OTC)" : "(Live)"}
                      </span>
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
