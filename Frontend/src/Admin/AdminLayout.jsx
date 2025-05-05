import React, { useState, useEffect } from "react";
import axios from "axios";
import styles from "./AdminLayout.module.css";

const s = styles;

const AdminLayout = () => {
  const [coins, setCoins] = useState([]);
  const [newCoin, setNewCoin] = useState({ name: "", type: "Live", startingPrice: "" });
  const [trend, setTrend] = useState("Normal");

  // Fetch coins from the backend
  useEffect(() => {
    const fetchCoins = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/coins");
        setCoins(response.data);
      } catch (err) {
        console.error("Error fetching coins:", err);
      }
    };
    fetchCoins();
  }, []);

  // Add a new coin
  const addCoin = async () => {
    if (!newCoin.name || !newCoin.type || (newCoin.type === "OTC" && !newCoin.startingPrice)) {
      alert("All fields are required");
      return;
    }
    try {
      const response = await axios.post("http://localhost:5000/api/coins", newCoin);
      setCoins(response.data.coins);
      setNewCoin({ name: "", type: "Live", startingPrice: "" }); // Reset form
    } catch (err) {
      console.error("Error adding coin:", err);
    }
  };

  // Delete a coin
  const deleteCoin = async (name) => {
    try {
      console.log("Attempting to delete coin:", name); // Debugging log
      const response = await axios.delete(`http://localhost:5000/api/coins/${name}`);
      console.log("Delete response:", response.data); // Debugging log
      setCoins(response.data.coins); // Update the state with the updated coin list
      console.log(`Coin ${name} deleted successfully`);
    } catch (err) {
      console.error("Error deleting coin:", err.response?.data || err.message);
      alert("Failed to delete the coin. Please try again.");
    }
  };

  const updateTrend = async (mode) => {
    console.log("Updating trend to:", mode); // Debugging log
    setTrend(mode);
    try {
      await axios.post("http://localhost:5000/api/admin/trend", { mode });
    } catch (err) {
      console.error("Error updating trend:", err);
    }
  };

  return (
    <div className={s.container}>
      <h1 className={s.title}>Admin Panel</h1>

      {/* Coin Management Section */}
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
            onChange={(e) => setNewCoin({ ...newCoin, type: e.target.value, startingPrice: "" })}
          >
            <option value="Live">Live</option>
            <option value="OTC">OTC</option>
          </select>
          <input
            type="number"
            placeholder="Starting Price"
            value={newCoin.type === "Live" ? "" : newCoin.startingPrice} // Clear input for Live coins
            onChange={(e) => setNewCoin({ ...newCoin, startingPrice: e.target.value })}
            disabled={newCoin.type === "Live"} // Disable input for Live coins
          />
          <button onClick={addCoin}>Add Coin</button>
        </div>

        {/* Coin List */}
        <div className={s.coinListContainer}>
          {coins.map((coin) => (
            <div key={coin.name} className={s.coinItem}>
              <span>{coin.name} ({coin.type}) - {coin.type === "Live" ? "Real-Time Price" : `$${coin.startingPrice}`}</span>
              <button onClick={() => deleteCoin(coin.name)}>Delete</button>
            </div>
          ))}
        </div>
      </div>

      {/* Trend Management Section */}
      <div className={s.section}>
        <h2>Trend Management</h2>

        <h3>Basic Trends</h3>
        <div className={s.buttonGroup}>
          <button className={s.button} onClick={() => updateTrend("Up")}>
            Up
          </button>
          <button className={s.button} onClick={() => updateTrend("Down")}>
            Down
          </button>
          <button className={s.button} onClick={() => updateTrend("Normal")}>
            Normal
          </button>
        </div>

        <h3>Scenario Patterns</h3>
        <div className={s.buttonGroup}>
          <button className={s.button} onClick={() => updateTrend("Scenario1")}>
            Scenario 1
          </button>
          <button className={s.button} onClick={() => updateTrend("Scenario2")}>
            Scenario 2
          </button>
          <button className={s.button} onClick={() => updateTrend("Scenario3")}>
            Scenario 3
          </button>
          <button className={s.button} onClick={() => updateTrend("Scenario4")}>
            Scenario 4
          </button>
          <button className={s.button} onClick={() => updateTrend("Scenario5")}>
            Scenario 5
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
