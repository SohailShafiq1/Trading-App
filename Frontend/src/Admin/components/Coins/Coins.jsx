import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import styles from "./Coin.module.css";
import Trends from "../Trends/Trends"; // Import the Trends component
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const s = styles;

const Coins = () => {
  const [coins, setCoins] = useState([]);
  const [newCoin, setNewCoin] = useState({
    type: "Live",
    name: "",
    firstName: "",
    lastName: "",
    startingPrice: "",
    profitPercentage: "",
  });
  const [editingCoin, setEditingCoin] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showTrendPopup, setShowTrendPopup] = useState(false); // State to control the popup
  const navigate = useNavigate();

  const fetchCoins = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${BACKEND_URL}/api/coins`);
      if (Array.isArray(response.data)) {
        setCoins(response.data);
      } else if (Array.isArray(response.data?.coins)) {
        setCoins(response.data.coins);
      } else {
        setError("Invalid data format received from server");
        setCoins([]);
      }
    } catch (err) {
      console.error("Error fetching coins:", err);
      setError("Failed to fetch coins. Please try again.");
      setCoins([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCoins();
  }, []);

  const addCoin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await axios.post(`${BACKEND_URL}/api/coins`, newCoin);
      setCoins(response.data.coins);
      setNewCoin({
        type: "Live",
        name: "",
        firstName: "",
        lastName: "",
        startingPrice: "",
        profitPercentage: "",
      });
      setError("");
    } catch (err) {
      console.error("Error adding coin:", err);
      setError("Failed to add coin. Please try again.");
    } finally {
      setIsLoading(false);
    }
    await fetchCoins();
  };

  const updateCoin = async (e) => {
    e.preventDefault();
    if (!editingCoin) return;

    setIsLoading(true);
    try {
      const response = await axios.put(
        `${BACKEND_URL}/api/coins/${editingCoin._id}`,
        editingCoin
      );
      setCoins(response.data.coins);
      setEditingCoin(null);
      setError("");
    } catch (err) {
      console.error("Error updating coin:", err);
      setError("Failed to update coin. Please try again.");
    } finally {
      setIsLoading(false);
    }
    await fetchCoins();
  };

  const deleteCoin = async (id) => {
    if (window.confirm("Are you sure you want to delete this coin?")) {
      setIsLoading(true);
      try {
        const response = await axios.delete(`${BACKEND_URL}/api/coins/${id}`);
        setCoins(response.data.coins);
        setError("");
      } catch (err) {
        console.error("Error deleting coin:", err);
        setError("Failed to delete coin. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }
    await fetchCoins();
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewCoin((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditingCoin((prev) => ({ ...prev, [name]: value }));
  };

  const openTrendPopup = () => {
    setShowTrendPopup(true); // Show the popup
  };

  const closeTrendPopup = () => {
    setShowTrendPopup(false); // Close the popup
  };

  return (
    <div className={s.container}>
      <button className={s.backButton} onClick={() => navigate(-1)}>
        Back
      </button>
      <h2>Coin Management</h2>

      {error && <div className={s.error}>{error}</div>}
      {isLoading && <div className={s.loading}>Loading...</div>}

      <form className={s.form} onSubmit={addCoin}>
        <select name="type" value={newCoin.type} onChange={handleInputChange}>
          <option value="Live">Live</option>
          <option value="OTC">OTC</option>
        </select>

        {newCoin.type === "Live" ? (
          <>
            <input
              type="text"
              name="name"
              placeholder="Coin Name"
              value={newCoin.name}
              onChange={handleInputChange}
              required
            />
          </>
        ) : (
          <>
            <input
              type="text"
              name="firstName"
              placeholder="Coin First Name"
              value={newCoin.firstName}
              onChange={handleInputChange}
              required
            />
            <input
              type="text"
              name="lastName"
              placeholder="Coin Last Name"
              value={newCoin.lastName}
              onChange={handleInputChange}
              required
            />
            <input
              type="number"
              name="startingPrice"
              placeholder="Starting Price"
              value={newCoin.startingPrice}
              onChange={handleInputChange}
              required
              min="0"
              step="0.01"
            />
            <button
              type="button"
              className={s.trendButton}
              onClick={openTrendPopup} // Open the popup for Trends
            >
              Set OTC Trend
            </button>
          </>
        )}

        <input
          type="number"
          name="profitPercentage"
          placeholder="Profit Percentage"
          value={newCoin.profitPercentage}
          onChange={handleInputChange}
          required
          min="0"
          max="100"
          step="0.1"
        />
        <button type="submit" disabled={isLoading}>
          {isLoading ? "Adding..." : "Add Coin"}
        </button>
      </form>

      {/* Coin List Table */}
      <table className={s.table}>
        <thead>
          <tr>
            <th>Type</th>
            <th>Name</th>
            <th>Starting Price</th>
            <th>Profit %</th>
            <th>Trend</th> {/* New Trend column */}
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {coins &&
            coins.map((coin) => (
              <tr key={coin._id}>
                <td>{coin.type}</td>
                <td>
                  {coin.type === "Live"
                    ? coin.name
                    : `${coin.firstName} ${coin.lastName}`}
                </td>
                <td>{coin.startingPrice || "N/A"}</td>
                <td>{coin.profitPercentage}%</td>
                <td>
                  {coin.type === "OTC" ? (
                    <button
                      className={s.trendButton}
                      onClick={() => openTrendPopup()} // Open Trend popup for OTC
                    >
                      Set Trend
                    </button>
                  ) : (
                    "N/A"
                  )}
                </td>
                <td>
                  <button
                    type="button"
                    onClick={() => setEditingCoin(coin)}
                    disabled={isLoading}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteCoin(coin._id)}
                    disabled={isLoading}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
        </tbody>
      </table>

      {/* Edit Coin Modal */}
      {editingCoin && (
        <div className={s.modalOverlay}>
          <div className={s.modal}>
            <h3>Edit Coin</h3>
            <form onSubmit={updateCoin}>
              {editingCoin.type === "Live" ? (
                <>
                  <input
                    type="text"
                    name="name"
                    placeholder="Coin Name"
                    value={editingCoin.name}
                    onChange={handleEditInputChange}
                    required
                  />
                </>
              ) : (
                <>
                  <input
                    type="text"
                    name="firstName"
                    placeholder="Coin First Name"
                    value={editingCoin.firstName}
                    onChange={handleEditInputChange}
                    required
                  />
                  <input
                    type="text"
                    name="lastName"
                    placeholder="Coin Last Name"
                    value={editingCoin.lastName}
                    onChange={handleEditInputChange}
                    required
                  />
                  <input
                    type="number"
                    name="startingPrice"
                    placeholder="Starting Price"
                    value={editingCoin.startingPrice}
                    onChange={handleEditInputChange}
                    required
                    min="0"
                    step="0.01"
                  />
                </>
              )}

              <input
                type="number"
                name="profitPercentage"
                placeholder="Profit Percentage"
                value={editingCoin.profitPercentage}
                onChange={handleEditInputChange}
                required
                min="0"
                max="100"
                step="0.1"
              />
              <div className={s.modalButtons}>
                <button type="submit" disabled={isLoading}>
                  {isLoading ? "Saving..." : "Save"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingCoin(null)}
                  disabled={isLoading}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Trend Popup */}
      {showTrendPopup && (
        <div className={s.modalOverlay}>
          <div className={s.modal}>
            <button className={s.closeButton} onClick={closeTrendPopup}>
              Close
            </button>
            <Trends /> {/* Render the Trends component */}
          </div>
        </div>
      )}
    </div>
  );
};

export default Coins;
