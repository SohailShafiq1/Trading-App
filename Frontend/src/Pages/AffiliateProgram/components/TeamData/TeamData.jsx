import React from 'react';
import styles from './TeamData.module.css';
const s = styles;

const TeamData = ({ activeTable, traders, profits }) => {
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