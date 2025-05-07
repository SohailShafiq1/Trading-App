import React, { useState, useEffect } from "react";
import axios from "axios";
import styles from "./Coin.module.css";

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

  const addCoin = async () => {
    try {
      const response = await axios.post("http://localhost:5000/api/coins", newCoin);
      setCoins(response.data); // Update the coin list
      setNewCoin({
        type: "Live",
        name: "",
        firstName: "",
        lastName: "",
        startingPrice: "",
        profitPercentage: "",
      }); // Reset form
    } catch (err) {
      console.error("Error adding coin:", err);
    }
  };

  // Update a coin
  const updateCoin = async () => {
    try {
      const response = await axios.put(
        `http://localhost:5000/api/coins/${editingCoin._id}`,
        editingCoin
      );
      setCoins(response.data);
      setEditingCoin(null);
    } catch (err) {
      console.error("Error updating coin:", err);
    }
  };

  // Delete a coin
  const deleteCoin = async (id) => {
    try {
      const response = await axios.delete(`http://localhost:5000/api/coins/${id}`);
      setCoins(response.data); // Update the coin list
    } catch (err) {
      console.error("Error deleting coin:", err);
    }
  };

  return (
    <div className={s.container}>
      <h2>Coin Management</h2>

      {/* Add/Edit Coin Form */}
      <div className={s.form}>
        <select
          value={newCoin.type}
          onChange={(e) =>
            setNewCoin({
              ...newCoin,
              type: e.target.value,
              name: "",
              firstName: "",
              lastName: "",
              startingPrice: "",
            })
          }
        >
          <option value="Live">Live</option>
          <option value="OTC">OTC</option>
        </select>

        {newCoin.type === "Live" ? (
          <>
            <input
              type="text"
              placeholder="Coin Name"
              value={newCoin.name}
              onChange={(e) => setNewCoin({ ...newCoin, name: e.target.value })}
            />
          </>
        ) : (
          <>
            <input
              type="text"
              placeholder="Coin First Name"
              value={newCoin.firstName}
              onChange={(e) => setNewCoin({ ...newCoin, firstName: e.target.value })}
            />
            <input
              type="text"
              placeholder="Coin Last Name"
              value={newCoin.lastName}
              onChange={(e) => setNewCoin({ ...newCoin, lastName: e.target.value })}
            />
            <input
              type="number"
              placeholder="Starting Price"
              value={newCoin.startingPrice}
              onChange={(e) => setNewCoin({ ...newCoin, startingPrice: e.target.value })}
            />
          </>
        )}

        <input
          type="number"
          placeholder="Profit Percentage"
          value={newCoin.profitPercentage}
          onChange={(e) => setNewCoin({ ...newCoin, profitPercentage: e.target.value })}
        />
        <button onClick={addCoin}>Add Coin</button>
      </div>

      {/* Coin List Table */}
      <table className={s.table}>
        <thead>
          <tr>
            <th>Type</th>
            <th>Name</th>
            <th>Starting Price</th>
            <th>Profit %</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {coins.map((coin) => (
            <tr key={coin._id}>
              <td>{coin.type}</td>
              <td>{coin.type === "Live" ? coin.name : `${coin.firstName}/${coin.lastName}`}</td>
              <td>{coin.startingPrice || "N/A"}</td>
              <td>{coin.profitPercentage}%</td>
              <td>
                <button onClick={() => setEditingCoin(coin)}>Edit</button>
                <button onClick={() => deleteCoin(coin._id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Edit Coin Modal */}
      {editingCoin && (
        <div className={s.modal}>
          <h3>Edit Coin</h3>
          {editingCoin.type === "Live" ? (
            <>
              <input
                type="text"
                placeholder="Coin Name"
                value={editingCoin.name}
                onChange={(e) => setEditingCoin({ ...editingCoin, name: e.target.value })}
              />
            </>
          ) : (
            <>
              <input
                type="text"
                placeholder="Coin First Name"
                value={editingCoin.firstName}
                onChange={(e) => setEditingCoin({ ...editingCoin, firstName: e.target.value })}
              />
              <input
                type="text"
                placeholder="Coin Last Name"
                value={editingCoin.lastName}
                onChange={(e) => setEditingCoin({ ...editingCoin, lastName: e.target.value })}
              />
              <input
                type="number"
                placeholder="Starting Price"
                value={editingCoin.startingPrice}
                onChange={(e) => setEditingCoin({ ...editingCoin, startingPrice: e.target.value })}
              />
            </>
          )}
          <input
            type="number"
            placeholder="Profit Percentage"
            value={editingCoin.profitPercentage}
            onChange={(e) =>
              setEditingCoin({ ...editingCoin, profitPercentage: e.target.value })
            }
          />
          <button onClick={updateCoin}>Save</button>
          <button onClick={() => setEditingCoin(null)}>Cancel</button>
        </div>
      )}
    </div>
  );
};

export default Coins;