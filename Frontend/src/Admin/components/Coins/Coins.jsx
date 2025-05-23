import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import styles from "./Coin.module.css";
import Trends from "../Trends/Trends";
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
    trend: "Random",
  });
  const [editingCoin, setEditingCoin] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showTrendPopup, setShowTrendPopup] = useState(false);
  const [currentTrendCoin, setCurrentTrendCoin] = useState(null);
  const navigate = useNavigate();

  const fetchCoins = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${BACKEND_URL}/api/coins`);
      setCoins(response.data);
      setError("");
    } catch (err) {
      console.error("Error fetching coins:", err);
      setError("Failed to fetch coins. Please try again.");
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
      const coinData = {
        type: newCoin.type,
        profitPercentage: newCoin.profitPercentage,
        ...(newCoin.type === "Live"
          ? { name: newCoin.name }
          : {
              firstName: newCoin.firstName,
              lastName: newCoin.lastName,
              startingPrice: newCoin.startingPrice,
              name: `${newCoin.firstName}-${newCoin.lastName}`,
              trend: newCoin.trend,
            }),
      };

      const response = await axios.post(`${BACKEND_URL}/api/coins`, coinData);
      setCoins(response.data);
      setNewCoin({
        type: "Live",
        name: "",
        firstName: "",
        lastName: "",
        startingPrice: "",
        profitPercentage: "",
        trend: "Random",
      });
      setError("");
    } catch (err) {
      console.error("Error adding coin:", err);
      setError(
        err.response?.data?.message || "Failed to add coin. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
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
      setCoins(response.data);
      setEditingCoin(null);
      setError("");
    } catch (err) {
      console.error("Error updating coin:", err);
      setError("Failed to update coin. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const deleteCoin = async (id) => {
    if (window.confirm("Are you sure you want to delete this coin?")) {
      setIsLoading(true);
      try {
        const response = await axios.delete(`${BACKEND_URL}/api/coins/${id}`);
        setCoins(response.data);
        setError("");
      } catch (err) {
        console.error("Error deleting coin:", err);
        setError("Failed to delete coin. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewCoin((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditingCoin((prev) => ({ ...prev, [name]: value }));
  };

  const openTrendPopup = (coin) => {
    if (coin.type === "OTC") {
      setCurrentTrendCoin(coin);
      setShowTrendPopup(true);
    }
  };

  const closeTrendPopup = () => {
    setShowTrendPopup(false);
    setCurrentTrendCoin(null);
  };

  const handleTrendUpdate = async (newTrend) => {
    if (!currentTrendCoin) return;

    try {
      setIsLoading(true);

      if (currentTrendCoin._id) {
        const coinName =
          currentTrendCoin.type === "Live"
            ? currentTrendCoin.name
            : `${currentTrendCoin.firstName} ${currentTrendCoin.lastName}`;

        await axios.post(`${BACKEND_URL}/api/coins/trend`, {
          coinName,
          mode: newTrend,
        });

        setCoins((prevCoins) =>
          prevCoins.map((coin) =>
            coin._id === currentTrendCoin._id
              ? { ...coin, trend: newTrend }
              : coin
          )
        );
      } else {
        setNewCoin((prev) => ({ ...prev, trend: newTrend }));
      }

      setError("");
    } catch (err) {
      console.error("Error updating trend:", err);
      setError(err.response?.data?.message || "Failed to update trend");
    } finally {
      setIsLoading(false);
      closeTrendPopup();
    }
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
          <input
            type="text"
            name="name"
            placeholder="Coin Name"
            value={newCoin.name}
            onChange={handleInputChange}
            required
          />
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
              onClick={() => openTrendPopup(newCoin)}
              disabled={newCoin.type !== "OTC"}
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

      <table className={s.table}>
        <thead>
          <tr>
            <th>Type</th>
            <th>Name</th>
            <th>Starting Price</th>
            <th>Profit %</th>
            <th>Trend</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {coins.map((coin) => (
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
                  <>
                    {coin.trend || "Random"}
                    <button
                      className={s.trendButton}
                      onClick={() => openTrendPopup(coin)}
                    >
                      Set Trend
                    </button>
                  </>
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

      {editingCoin && (
        <div className={s.modalOverlay}>
          <div className={s.modal}>
            <h3>Edit Coin</h3>
            <form onSubmit={updateCoin}>
              {editingCoin.type === "Live" ? (
                <input
                  type="text"
                  name="name"
                  placeholder="Coin Name"
                  value={editingCoin.name}
                  onChange={handleEditInputChange}
                  required
                />
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

      {showTrendPopup && currentTrendCoin && (
        <div className={s.modalOverlay}>
          <div className={s.modal}>
            <button className={s.closeButton} onClick={closeTrendPopup}>
              Close
            </button>
            <Trends
              coinName={
                currentTrendCoin.type === "Live"
                  ? currentTrendCoin.name
                  : `${currentTrendCoin.firstName} ${currentTrendCoin.lastName}`
              }
              currentTrend={currentTrendCoin.trend || "Random"}
              onTrendUpdate={handleTrendUpdate}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Coins;
