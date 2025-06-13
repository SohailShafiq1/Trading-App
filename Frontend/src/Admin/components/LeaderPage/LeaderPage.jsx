import React, { useState, useEffect } from "react";
import styles from "./LeaderPage.module.css";
import axios from "axios";
import { AiFillEdit, AiFillDelete } from "react-icons/ai";

const todayStr = new Date().toISOString().slice(0, 10);

const LeaderPage = () => {
  const [filter, setFilter] = useState("admin");
  const [form, setForm] = useState({
    userId: "",
    username: "",
    email: "",
    country: "",
    todayProfit: "",
    tradesCount: "",
    profitableTrades: "",
    date: todayStr,
  });
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);

  // New: store real user profits
  const [realUserProfits, setRealUserProfits] = useState([]);
  const [editId, setEditId] = useState(null);

  // Fetch admin leaderboard entries
  const fetchEntries = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        "http://localhost:5000/api/admin/leaderboard"
      );
      setEntries(res.data);
    } catch {
      setEntries([]);
    }
    setLoading(false);
  };

  // Fetch all users and their real profits
  const fetchRealUserProfits = async () => {
    try {
      // Get all users (with email, userId, etc.)
      const usersRes = await axios.get(
        "http://localhost:5000/api/admin/all-users"
      );
      const users = usersRes.data;

      // For each user, fetch their profit for today
      // (Assume you have an endpoint to get user by email with dailyProfits array)
      const userProfits = await Promise.all(
        users.map(async (user) => {
          try {
            const userDetailRes = await axios.get(
              `http://localhost:5000/api/users/email/${user.email}`
            );
            const userDetail = userDetailRes.data;
            const todayProfit =
              userDetail.dailyProfits?.find((p) => p.date === todayStr)
                ?.profit || 0;
            const trades = userDetail.trades || [];
            const tradesCount = trades.length;
            const profitableTrades = trades.filter(
              (t) => t.result === "win"
            ).length;
            return {
              userId: user.userId || "",
              username: user.firstName
                ? `${user.firstName} ${user.lastName || ""}`.trim()
                : "",
              email: user.email,
              country: userDetail.country || "",
              todayProfit,
              date: todayStr,
              tradesCount,
              profitableTrades,
              source: "real", // mark as real user
            };
          } catch {
            return null;
          }
        })
      );
      setRealUserProfits(userProfits.filter(Boolean));
    } catch {
      setRealUserProfits([]);
    }
  };

  useEffect(() => {
    fetchEntries();
    fetchRealUserProfits();
    // eslint-disable-next-line
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Handle delete
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this entry?")) {
      await axios.delete(`http://localhost:5000/api/admin/leaderboard/${id}`);
      fetchEntries();
    }
  };

  // Handle edit (populate form)
  const handleEdit = (entry) => {
    setEditId(entry._id);
    setForm({
      userId: entry.userId,
      username: entry.username,
      email: entry.email,
      country: entry.country,
      todayProfit: entry.todayProfit,
      date: entry.date,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Handle form submit (add or update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editId) {
      await axios.put(`http://localhost:5000/api/admin/leaderboard/${editId}`, {
        ...form,
        todayProfit: Number(form.todayProfit),
        tradesCount: Number(form.tradesCount),
        profitableTrades: Number(form.profitableTrades),
      });
      setEditId(null);
    } else {
      await axios.post("http://localhost:5000/api/admin/leaderboard", {
        ...form,
        todayProfit: Number(form.todayProfit),
        tradesCount: Number(form.tradesCount),
        profitableTrades: Number(form.profitableTrades),
      });
    }
    setForm({
      ...form,
      userId: "",
      username: "",
      email: "",
      country: "",
      todayProfit: "",
      tradesCount: "",
      profitableTrades: "",
    });
    fetchEntries();
  };

  // Merge logic: for each unique userId/email, use the higher of real or admin-entered profit
  const merged = (() => {
    // Map by email (or userId if you prefer)
    const byEmail = {};

    // Add all admin entries
    for (const entry of entries) {
      byEmail[entry.email] = {
        ...entry,
        source: "admin",
      };
    }

    // For each real user, if profit is higher, use it
    for (const real of realUserProfits) {
      if (
        !byEmail[real.email] ||
        real.todayProfit > Number(byEmail[real.email].todayProfit)
      ) {
        byEmail[real.email] = real;
      }
    }

    // Return as sorted array
    return Object.values(byEmail).sort(
      (a, b) => Number(b.todayProfit) - Number(a.todayProfit)
    );
  })();

  const filtered = merged.filter((entry) => {
    if (filter === "all") return true;
    if (filter === "admin") return entry.source === "admin";
    if (filter === "real") return entry.source === "real";
    return true;
  });

  return (
    <div className={styles.container}>
      <h2>{editId ? "Edit" : "Admin"} Leaderboard Entry</h2>
      <form className={styles.form} onSubmit={handleSubmit}>
        <input
          name="userId"
          placeholder="User ID"
          value={form.userId}
          onChange={handleChange}
          required
        />
        <input
          name="username"
          placeholder="Username"
          value={form.username}
          onChange={handleChange}
        />
        <input
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
        />
        <input
          name="country"
          placeholder="Country"
          value={form.country}
          onChange={handleChange}
        />
        <input
          name="todayProfit"
          placeholder="Today's Profit"
          value={form.todayProfit}
          onChange={handleChange}
          type="number"
          required
        />
        <input
          name="date"
          type="date"
          value={form.date}
          onChange={handleChange}
          required
        />
        <input
          name="tradesCount"
          placeholder="Trades count"
          value={form.tradesCount}
          onChange={handleChange}
          type="number"
        />
        <input
          name="profitableTrades"
          placeholder="Profitable trades"
          value={form.profitableTrades}
          onChange={handleChange}
          type="number"
        />
        <button type="submit">
          {editId ? "Update" : "Save"} Leaderboard Entry
        </button>
        {editId && (
          <button
            type="button"
            style={{ marginLeft: 8, background: "#aaa" }}
            onClick={() => {
              setEditId(null);
              setForm({
                ...form,
                userId: "",
                username: "",
                email: "",
                country: "",
                todayProfit: "",
                tradesCount: "",
                profitableTrades: "",
              });
            }}
          >
            Cancel
          </button>
        )}
      </form>

      <div className={styles.filterBar}>
        <button
          className={filter === "all" ? styles.filterActive : ""}
          onClick={() => setFilter("all")}
        >
          All
        </button>
        <button
          className={filter === "admin" ? styles.filterActive : ""}
          onClick={() => setFilter("admin")}
        >
          Admin Entered
        </button>
        <button
          className={filter === "real" ? styles.filterActive : ""}
          onClick={() => setFilter("real")}
        >
          Real User
        </button>
      </div>

      <h3>Leaderboard Entries (Merged)</h3>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>#</th>
                <th>User ID</th>
                <th>Username</th>
                <th>Email</th>
                <th>Country</th>
                <th>Today's Profit</th>
                <th>Trades count</th>
                <th>Profitable trades</th>
                <th>Date</th>
                <th>Source</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((entry, i) => (
                <tr key={entry.email}>
                  <td>{i + 1}</td>
                  <td>{entry.userId}</td>
                  <td>{entry.username}</td>
                  <td>{entry.email}</td>
                  <td>{entry.country}</td>
                  <td>${Number(entry.todayProfit).toLocaleString()}</td>
                  <td>{entry.tradesCount || 0}</td>
                  <td>{entry.profitableTrades || 0}</td>
                  <td>{entry.date}</td>
                  <td>
                    {entry.source === "real" ? (
                      <span style={{ color: "green" }}>Real</span>
                    ) : (
                      <span style={{ color: "blue" }}>Admin</span>
                    )}
                  </td>
                  <td>
                    {entry.source === "admin" && entry._id && (
                      <div className={styles.actionBtns}>
                        <button
                          className={styles.editBtn}
                          title="Edit"
                          onClick={() => handleEdit(entry)}
                        >
                          <AiFillEdit />
                        </button>
                        <button
                          className={styles.deleteBtn}
                          title="Delete"
                          onClick={() => handleDelete(entry._id)}
                        >
                          <AiFillDelete />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={11} style={{ textAlign: "center" }}>
                    No entries found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default LeaderPage;
