import { AiOutlineCheckCircle } from "react-icons/ai";
import React from "react";
import styles from "./TransactionPage.module.css";
const s = styles;

const TransactionPage = () => {
  const transactions = [
    {
      order: 456985,
      date: "16/03/2025",
      status: "Processing",
      type: "Deposit",
      payment: "USD Tether (BEP-20)",
      amount: "+$90.00",
    },
    {
      order: 456947,
      date: "27/00/2025",
      status: "Successed",
      type: "Deposit",
      payment: "USD Tether (TRC-20)",
      amount: "+$20.00",
    },
    {
      order: 456964,
      date: "19/02/2025",
      status: "Successed",
      type: "Deposit",
      payment: "Bitcoin (BTC)",
      amount: "+$40.00",
    },
    {
      order: 456944,
      date: "05/02/2025",
      status: "Successed",
      type: "Deposit",
      payment: "USD Tether (BEP-20)",
      amount: "+$50.00",
    },
    {
      order: 456925,
      date: "28/01/2025",
      status: "Successed",
      type: "Deposit",
      payment: "USD Tether (TRC-20)",
      amount: "+$20.00",
    },
    {
      order: 456949,
      date: "14/01/2025",
      status: "Successed",
      type: "Deposit",
      payment: "Bitcoin (BTC)",
      amount: "+$10.00",
    },
  ];

  return (
    <div className={s.container}>
      <div className={s.box}>
        <table className={s.table}>
          <thead>
            <tr>
              <th>Order</th>
              <th>Amount</th>

              <th>Date and time</th>
              <th>Payment system</th>

              <th>Status</th>
              <th>Transaction type</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr key={tx.order}>
                <td>{tx.order}</td>
                <td className={s.amount}>{tx.amount}</td>
                <td>{tx.date}</td>
                <td>{tx.payment}</td>
                <td>
                  <AiOutlineCheckCircle className={s.circle} />
                  {tx.status}
                </td>
                <td>{tx.type}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransactionPage;
