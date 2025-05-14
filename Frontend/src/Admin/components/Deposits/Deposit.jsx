import React, { useEffect, useState } from 'react';
import styles from './Deposit.module.css';
import axios from 'axios';

const s = styles;

const Deposit = () => {
  const [deposits, setDeposits] = useState([]);

  const fetchDeposits = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/admin/deposits');
      setDeposits(res.data);
    } catch (err) {
      console.error('Error fetching deposits:', err);
    }
  };

  const handleAction = async (id, action) => {
    try {
      await axios.put(`http://localhost:5000/api/admin/deposit-status/${id}`, {
        status: action,
      });
      fetchDeposits(); // refresh
    } catch (err) {
      console.error('Error updating deposit status:', err);
    }
  };

  useEffect(() => {
    fetchDeposits();
  }, []);

  return (
    <div className={s.container}>
      <h2 className={s.title}>User Deposits</h2>
      <table className={s.table}>
        <thead>
          <tr>
            <th>Email</th>
            <th>Amount</th>
            <th>Status</th>
            <th>TXID</th>
            <th>Date</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {deposits.map((dep) => (
            <tr key={dep._id}>
              <td>{dep.userEmail}</td>
              <td>${dep.amount}</td>
              <td>{dep.status}</td>
              <td>{dep.txId || '-'}</td>
              <td>{new Date(dep.createdAt).toLocaleString()}</td>
              <td>
                {dep.status === 'pending' && (
                  <>
                    <button onClick={() => handleAction(dep._id, 'verified')}>✅ Accept</button>
                    <button onClick={() => handleAction(dep._id, 'failed')}>❌ Reject</button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Deposit;
