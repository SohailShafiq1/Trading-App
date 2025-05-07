import React, { useState, useEffect } from "react";
import axios from "axios";
import styles from "./Coin.module.css";
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const s = styles;

const Coins = () => {
  const [coins, setCoins] = useState([]);
  const [newCoin, setNewCoin] = useState({
    name: "",
    type: "Live",
    startingPrice: "",
  });

  // Fetch coins from the backend
  useEffect(() => {
    const fetchCoins = async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/coins`);
        setCoins(response.data);
      } catch (err) {
        console.error("Error fetching coins:", err);
      }
    };
    fetchCoins();
  }, []);

  // Add a new coin
  const addCoin = async () => {
    if (
      !newCoin.name ||
      !newCoin.type ||
      (newCoin.type === "OTC" && !newCoin.startingPrice)
    ) {
      alert("All fields are required");
      return;
    }
    try {
      const response = await axios.post(`${BACKEND_URL}/api/coins`, newCoin);
      setCoins(response.data.coins);
      setNewCoin({ name: "", type: "Live", startingPrice: "" }); // Reset form
    } catch (err) {
      console.error("Error adding coin:", err);
    }
  };

  // Delete a coin
  const deleteCoin = async (name) => {
    try {
      const response = await axios.delete(`${BACKEND_URL}/api/coins/${name}`);
      setCoins(response.data.coins);
    } catch (err) {
      console.error("Error deleting coin:", err.response?.data || err.message);
      alert("Failed to delete the coin. Please try again.");
    }
  };

  return (
    <div className={s.section}>
      <h2>Coin Management</h2>

      {/* Add Coin Form */}
      <div className={s.addCoinForm}>
        <input
          type="text"
          placeholder="Coin Name"
          value={newCoin.name}
          onChange={(e) => setNewCoin({ ...newCoin, name: e.target.value })}
        />
        <select
          value={newCoin.type}
          onChange={(e) =>
            setNewCoin({ ...newCoin, type: e.target.value, startingPrice: "" })
          }
        >
          <option value="Live">Live</option>
          <option value="OTC">OTC</option>
        </select>
        <input
          type="number"
          placeholder="Starting Price"
          value={newCoin.type === "Live" ? "" : newCoin.startingPrice}
          onChange={(e) =>
            setNewCoin({ ...newCoin, startingPrice: e.target.value })
          }
          disabled={newCoin.type === "Live"}
        />
        <button onClick={addCoin}>Add Coin</button>
      </div>

      {/* Coin List */}
      <div className={s.coinListContainer}>
        {coins.map((coin) => (
          <div key={coin.name} className={s.coinItem}>
            <span>
              {coin.name} ({coin.type}) -{" "}
              {coin.type === "Live"
                ? "Real-Time Price"
                : `$${coin.startingPrice}`}
            </span>
            <button onClick={() => deleteCoin(coin.name)}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Coins;
