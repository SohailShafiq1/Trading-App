import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Trades.module.css";
const s = styles;

const Trades = () => {
  const [trades, setTrades] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [profitFilter, setProfitFilter] = useState("all");
  const [lossFilter, setLossFilter] = useState("all");
  const navigate = useNavigate();

  // Fetch all trades every second
  useEffect(() => {
    let interval;
    const fetchTrades = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/admin/all-trades");
        const data = await res.json();
        setTrades(data);
        setIsLoading(false);
      } catch (err) {
        setTrades([]);
        setIsLoading(false);
      }
    };
    fetchTrades();
    interval = setInterval(fetchTrades, 1000);
    return () => clearInterval(interval);
  }, []);

  // Remove all filters handler
  const handleResetFilters = () => {
    setSearch("");
    setTypeFilter("all");
    setProfitFilter("all");
    setLossFilter("all");
  };

  // Filter trades by user email or name
  let filteredTrades = trades.filter(
    (trade) =>
      (trade.userEmail &&
        trade.userEmail.toLowerCase().includes(search.toLowerCase())) ||
      (trade.userName &&
        trade.userName.toLowerCase().includes(search.toLowerCase()))
  );

  // Filter by Buy/Sell
  if (typeFilter !== "all") {
    filteredTrades = filteredTrades.filter(
      (trade) => trade.type && trade.type.toLowerCase() === typeFilter
    );
  }

  // Filter by Profit (win)
  if (profitFilter !== "all") {
    filteredTrades = filteredTrades.filter((trade) => {
      if (trade.result !== "win") return true;
      const value = Number(trade.reward || 0);
      switch (profitFilter) {
        case "above10000":
          return value > 10000;
        case "below1000":
          return value < 1000;
        case "below500":
          return value < 500;
        case "below100":
          return value < 100;
        default:
          return true;
      }
    });
  }

  // Filter by Loss (loss)
  if (lossFilter !== "all") {
    filteredTrades = filteredTrades.filter((trade) => {
      if (trade.result !== "loss") return true;
      const value = Number(trade.investment || 0);
      switch (lossFilter) {
        case "above10000":
          return value > 10000;
        case "below1000":
          return value < 1000;
        case "below500":
          return value < 500;
        case "below100":
          return value < 100;
        default:
          return true;
      }
    });
  }

  return (
    <div className={s.container}>
      <button className={s.backButton} onClick={() => navigate(-1)}>
        Back
      </button>
      <h2 className={s.heading}>All Users' Trades</h2>
      <div className={s.searchBarWrapper}>
        <input
          type="text"
          className={s.searchBar}
          placeholder="Search by user email or name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className={s.filterDropdown}
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          style={{ marginLeft: 12 }}
        >
          <option value="all">All Types</option>
          <option value="buy">Buy</option>
          <option value="sell">Sell</option>
        </select>
        <select
          className={s.filterDropdown}
          value={profitFilter}
          onChange={(e) => setProfitFilter(e.target.value)}
          style={{ marginLeft: 12 }}
        >
          <option value="all">All Profits</option>
          <option value="above10000">Profit Above $10,000</option>
          <option value="below1000">Profit Below $1,000</option>
          <option value="below500">Profit Below $500</option>
          <option value="below100">Profit Below $100</option>
        </select>
        <select
          className={s.filterDropdown}
          value={lossFilter}
          onChange={(e) => setLossFilter(e.target.value)}
          style={{ marginLeft: 12 }}
        >
          <option value="all">All Losses</option>
          <option value="above10000">Loss Above $10,000</option>
          <option value="below1000">Loss Below $1,000</option>
          <option value="below500">Loss Below $500</option>
          <option value="below100">Loss Below $100</option>
        </select>
        <button
          className={s.resetButton}
          style={{ marginLeft: 12 }}
          onClick={handleResetFilters}
        >
          Remove All Filters
        </button>
      </div>
      {isLoading && (
        <div className={s.loaderOverlay}>
          <div className={s.loaderSpinner}></div>
          <div className={s.loaderText}>Loading trades...</div>
        </div>
      )}
      <div className={s.tableWrapper}>
        <table className={s.table}>
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Type</th>
              <th>Coin</th>
              <th>Investment</th>
              <th>Entry Price</th>
              <th>Exit Price</th>
              <th>Status</th>
              <th>Profit/Loss</th>
              <th>Opened</th>
              <th>Closed</th>
            </tr>
          </thead>
          <tbody>
            {filteredTrades.map((trade, idx) => (
              <tr key={trade._id || idx}>
                <td>{trade.userName || "-"}</td>
                <td>{trade.userEmail}</td>
                <td>{trade.type}</td>
                <td>{trade.coin}</td>
                <td>${trade.investment}</td>
                <td>{trade.entryPrice}</td>
                <td>{trade.exitPrice || "-"}</td>
                <td>
                  {trade.status === "running" || trade.result === "pending" ? (
                    <span className={s.statusOpen}>Open</span>
                  ) : trade.result === "win" ? (
                    <span className={s.statusWin}>Closed (Win)</span>
                  ) : trade.result === "loss" ? (
                    <span className={s.statusLoss}>Closed (Loss)</span>
                  ) : (
                    trade.result
                  )}
                </td>
                <td>
                  {trade.result === "win" ? (
                    <span className={s.profit}>+${trade.reward}</span>
                  ) : trade.result === "loss" ? (
                    <span className={s.loss}>-${trade.investment}</span>
                  ) : (
                    "-"
                  )}
                </td>
                <td>
                  {trade.startedAt
                    ? new Date(trade.startedAt).toLocaleString()
                    : "-"}
                </td>
                <td>
                  {trade.result === "win" || trade.result === "loss"
                    ? trade.createdAt
                      ? new Date(trade.createdAt).toLocaleString()
                      : "-"
                    : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Trades;
