import React, { useEffect, useState } from "react";
import styles from "./TeamData.module.css";
import { useAffiliateAuth } from "../../../../Context/AffiliateAuthContext";

const s = styles;

const TeamData = ({ activeTable }) => {
  const { affiliate } = useAffiliateAuth();
  const [teamUsers, setTeamUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const res = await fetch(
          `http://localhost:5000/api/affiliate/team/${affiliate.email}`
        );
        const data = await res.json();
        if (data.success) {
          setTeamUsers(data.teamUsers);
        } else {
          console.error(data.message);
        }
      } catch (err) {
        console.error("Error fetching team users:", err);
      } finally {
        setLoading(false);
      }
    };

    if (affiliate?.email) {
      fetchTeam();
    }
  }, [affiliate]);

  // Transformations
  const traders = teamUsers.map((user) => ({
    id: `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email,
    linkId: user.userId,
    balance: user.assets,
    deposits:
      user.transactions?.filter((t) => t.type === "deposit").length || 0,
    depositSum:
      user.transactions?.reduce((sum, t) => {
        return t.type === "deposit" && t.status === "success"
          ? sum + t.amount
          : sum;
      }, 0) || 0,
    bonuses: 0,
    withdrawals: user.withdrawals?.reduce((sum, w) => sum + w.amount, 0) || 0,
  }));

  const profits = teamUsers.map((user) => ({
    id: `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email,
    country: user.country,
    deposit:
      user.transactions?.reduce((sum, t) => {
        return t.type === "deposit" && t.status === "success"
          ? sum + t.amount
          : sum;
      }, 0) || 0,
    profit: user.dailyProfits?.reduce((sum, d) => sum + d.profit, 0) || 0,
  }));

  if (loading) return <div className={s.loader}>Loading team data...</div>;

  return (
    <div className={s.container}>
      {activeTable === "traders" ? (
        <table className={s.dataTable}>
          <thead>
            <tr>
              <th>TRADER</th>
              <th>LINK ID</th>
              <th>BALANCE</th>
              <th>DEPOSITS</th>
              <th>DEPOSITS SUM</th>
              <th>BONUSES</th>
              <th>WITHDRAWALS</th>
            </tr>
          </thead>
          <tbody>
            {traders.map((t, i) => (
              <tr key={i}>
                <td>{t.id}</td>
                <td className={s.greenLink}>{t.linkId}</td>
                <td>{t.balance}</td>
                <td>{t.deposits}</td>
                <td>{t.depositSum}</td>
                <td>{t.bonuses}</td>
                <td>{t.withdrawals}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <table className={s.dataTable}>
          <thead>
            <tr>
              <th>TRADER</th>
              <th>Countries</th>
              <th>Total Deposit</th>
              <th>Total Profit</th>
            </tr>
          </thead>
          <tbody>
            {profits.map((p, i) => (
              <tr key={i}>
                <td>{p.id}</td>
                <td>{p.country}</td>
                <td>{p.deposit}</td>
                <td>{p.profit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default TeamData;
