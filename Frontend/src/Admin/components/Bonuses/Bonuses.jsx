import React, { useEffect, useState } from "react";
import axios from "axios";
import styles from "./Bonus.module.css";
import { useNavigate } from "react-router-dom";
const s = styles;

const Bonuses = () => {
  const [bonuses, setBonuses] = useState([]);
  const navigate = useNavigate();
  const [min, setMin] = useState("");
  const [percent, setPercent] = useState("");
  const [editId, setEditId] = useState(null);

  const fetchBonuses = async () => {
    const res = await axios.get("http://localhost:5000/api/bonuses");
    setBonuses(res.data);
  };

  useEffect(() => {
    fetchBonuses();
  }, []);

  const handleAddOrUpdate = async (e) => {
    e.preventDefault();
    if (editId) {
      await axios.put(`http://localhost:5000/api/bonuses/${editId}`, {
        min,
        percent,
      });
      setEditId(null);
    } else {
      await axios.post("http://localhost:5000/api/bonuses", { min, percent });
    }
    setMin("");
    setPercent("");
    fetchBonuses();
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this bonus?")) {
      await axios.delete(`http://localhost:5000/api/bonuses/${id}`);
      fetchBonuses();
    }
  };

  const handleEdit = (bonus) => {
    setEditId(bonus._id);
    setMin(bonus.min);
    setPercent(bonus.percent);
  };

  const handleCancelEdit = () => {
    setEditId(null);
    setMin("");
    setPercent("");
  };

  return (
    <div className={s.container}>
      <button className={styles.backButton} onClick={() => navigate(-1)}>
        ← Back
      </button>
      <h2 className={s.title}>Manage Deposit Bonuses</h2>
      <form onSubmit={handleAddOrUpdate} className={s.form}>
        <input
          type="number"
          className={s.input}
          placeholder="Min Deposit"
          value={min}
          onChange={(e) => setMin(e.target.value)}
          required
        />
        <input
          type="number"
          className={s.input}
          placeholder="Bonus %"
          value={percent}
          onChange={(e) => setPercent(e.target.value)}
          required
        />
        <button type="submit" className={s.button}>
          {editId ? "Update" : "Add Bonus"}
        </button>
        {editId && (
          <button
            type="button"
            className={s.button}
            style={{ background: "#aaa", marginLeft: 8 }}
            onClick={handleCancelEdit}
          >
            Cancel
          </button>
        )}
      </form>
      <table className={s.table}>
        <thead>
          <tr>
            <th>Min Deposit</th>
            <th>Bonus %</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {bonuses.map((b) => (
            <tr key={b._id}>
              <td>${b.min}</td>
              <td>{b.percent}%</td>
              <td>
                <button
                  className={s.button}
                  style={{ padding: "4px 12px", fontSize: "0.95em" }}
                  onClick={() => handleEdit(b)}
                >
                  Edit
                </button>
                <button
                  className={s.button}
                  style={{
                    background: "#e53935",
                    marginLeft: 8,
                    padding: "4px 12px",
                    fontSize: "0.95em",
                  }}
                  onClick={() => handleDelete(b._id)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Bonuses;
