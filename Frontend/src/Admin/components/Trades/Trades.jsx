import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Trades.module.css";
import axios from "axios";
const s = styles;
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const Trades = () => {
  const [trades, setTrades] = useState([]);
  const [deposits, setDeposits] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [profitFilter, setProfitFilter] = useState("all");
  const [lossFilter, setLossFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("all"); // NEW
  const navigate = useNavigate();

  // Fetch all trades and deposits every second
  useEffect(() => {
    let interval;
    const fetchData = async () => {
      try {
        const [tradesRes, depositsRes, withdrawalsRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_BACKEND_URL}/api/admin/all-trades`),
          fetch(`${import.meta.env.VITE_BACKEND_URL}/api/admin/deposits`),
          fetch(`${import.meta.env.VITE_BACKEND_URL}/api/admin/withdraw-requests`),
        ]);
        const tradesData = await tradesRes.json();
        const depositsData = await depositsRes.json();
        const withdrawalsData = await withdrawalsRes.json();
        setTrades(tradesData);
        setDeposits(depositsData);
        setWithdrawals(withdrawalsData);
        setIsLoading(false);
      } catch (err) {
        setTrades([]);
        setDeposits([]);
        setWithdrawals([]);
        setIsLoading(false);
      }
    };
    fetchData();
    interval = setInterval(fetchData, 1000);
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

  // Helper to get coin type by name (async)
  const [coinTypes, setCoinTypes] = useState({});

  const fetchCoinType = async (coinName) => {
    if (!coinName || coinTypes[coinName]) return;
    try {
      const res = await axios.get(`${BACKEND_URL}/api/coins/type/${coinName}`);
      setCoinTypes((prev) => ({ ...prev, [coinName]: res.data.type }));
    } catch {
      setCoinTypes((prev) => ({ ...prev, [coinName]: null }));
    }
  };

  useEffect(() => {
    // Preload coin types for all running trades
    filteredTrades.forEach((trade) => {
      if ((trade.status === "running" || trade.result === "pending") && trade.coin) {
        fetchCoinType(trade.coin);
      }
    });
    // eslint-disable-next-line
  }, [filteredTrades]);

  return (
    <div className={s.container}>
      <button className={s.backButton} onClick={() => navigate(-1)}>
        Back
      </button>
      <h2 className={s.heading}>All Users' Trades</h2>

      {/* Tab Buttons */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
        <button
          className={`${s.tabBtn} ${activeTab === "all" ? s.activeTab : ""}`}
          onClick={() => setActiveTab("all")}
        >
          All
        </button>
        <button
          className={`${s.tabBtn} ${
            activeTab === "deposit" ? s.activeTab : ""
          }`}
          onClick={() => setActiveTab("deposit")}
        >
          Deposit
        </button>
        <button
          className={`${s.tabBtn} ${
            activeTab === "withdrawal" ? s.activeTab : ""
          }`}
          onClick={() => setActiveTab("withdrawal")}
        >
          Withdrawal
        </button>
        <button
          className={`${s.tabBtn} ${activeTab === "trades" ? s.activeTab : ""}`}
          onClick={() => setActiveTab("trades")}
        >
          Trades
        </button>
      </div>

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
        {/* Show tables based on activeTab */}
        {(activeTab === "all" || activeTab === "trades") && (
          <>
            <h3>Trades</h3>
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
                    <td>{trade.coin}
                      {(trade.status === "running" || trade.result === "pending") && coinTypes[trade.coin] === "OTC" && (
                        <span className={s.trendBtnGroup}>
                          <button
                            className={s.trendSetBtnUp}
                            title="Set trend to Up"
                            onClick={async () => {
                              await axios.post(`${BACKEND_URL}/api/coins/trend`, {
                                coinName: trade.coin,
                                mode: "Up",
                              });
                            }}
                          >
                            ⬆ Up
                          </button>
                          <button
                            className={s.trendSetBtnDown}
                            title="Set trend to Down"
                            onClick={async () => {
                              await axios.post(`${BACKEND_URL}/api/coins/trend`, {
                                coinName: trade.coin,
                                mode: "Down",
                              });
                            }}
                          >
                            ⬇ Down
                          </button>
                          <button
                            className={s.trendSetBtnRandom}
                            title="Set trend to Random"
                            onClick={async () => {
                              await axios.post(`${BACKEND_URL}/api/coins/trend`, {
                                coinName: trade.coin,
                                mode: "Random",
                              });
                            }}
                          >
                            🎲 Random
                          </button>
                        </span>
                      )}
                    </td>
                    <td>${trade.investment}</td>
                    <td>{trade.entryPrice}</td>
                    <td>{trade.exitPrice || "-"}</td>
                    <td>
                      {trade.status === "running" ||
                      trade.result === "pending" ? (
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
          </>
        )}

        {(activeTab === "all" || activeTab === "deposit") && (
          <>
            <h3 style={{ marginTop: 32 }}>Deposits</h3>
            <table className={s.table}>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Status</th>
                  <th>Requested At</th>
                  <th>Completed At</th>
                </tr>
              </thead>
              <tbody>
                {deposits.map((dep, idx) => (
                  <tr key={dep._id || idx}>
                    <td>{dep.userName || "-"}</td>
                    <td>{dep.userEmail}</td>
                    <td>${dep.amount}</td>
                    <td>{dep.method || "-"}</td>
                    <td>
                      <span
                        className={
                          dep.status === "completed"
                            ? s.statusWin
                            : dep.status === "pending"
                            ? s.statusOpen
                            : s.statusLoss
                        }
                      >
                        {dep.status}
                      </span>
                    </td>
                    <td>
                      {dep.requestedAt
                        ? new Date(dep.requestedAt).toLocaleString()
                        : "-"}
                    </td>
                    <td>
                      {dep.completedAt
                        ? new Date(dep.completedAt).toLocaleString()
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {(activeTab === "all" || activeTab === "withdrawal") && (
          <>
            <h3 style={{ marginTop: 32 }}>Withdrawals</h3>
            <table className={s.table}>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Status</th>
                  <th>Requested At</th>
                  <th>Completed At</th>
                </tr>
              </thead>
              <tbody>
                {withdrawals.map((w, idx) => (
                  <tr key={w._id || idx}>
                    <td>{w.userName || "-"}</td>
                    <td>{w.userEmail}</td>
                    <td>${w.amount}</td>
                    <td>{w.method || "-"}</td>
                    <td>
                      <span
                        className={
                          w.status === "completed"
                            ? s.statusWin
                            : w.status === "pending"
                            ? s.statusOpen
                            : s.statusLoss
                        }
                      >
                        {w.status}
                      </span>
                    </td>
                    <td>
                      {w.requestedAt
                        ? new Date(w.requestedAt).toLocaleString()
                        : "-"}
                    </td>
                    <td>
                      {w.completedAt
                        ? new Date(w.completedAt).toLocaleString()
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </div>
  );
};

export default Trades;
