import { useState, useEffect } from "react";
import { useAuth } from "../../Context/AuthContext";
import { AiOutlineCheckCircle } from "react-icons/ai";
import styles from "./TransactionPage.module.css";
const s = styles;

const TransactionPage = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await fetch(
          `http://localhost:5000/api/users/transactions/${user.email}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch transactions");
        }

        const data = await response.json();
        setTransactions(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [user.email]);

  if (loading) return <div className={s.container}>Loading...</div>;
  if (error) return <div className={s.container}>Error: {error}</div>;

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
              <tr key={tx.orderId}>
                <td className={s.tableData}>{tx.orderId || "N/A"}</td>
                <td className={s.amount}>
                  {tx.type === "deposit" ? "+" : "-"}${tx.amount.toFixed(2)}
                </td>
                <td className={s.tableData} >{new Date(tx.date).toLocaleString()}</td>
                <td className={s.tableData}>{tx.paymentMethod}</td>
                <td className={s.tableData}>
                  <AiOutlineCheckCircle className={s.circle} />
                  {tx.status === "success"
                    ? "Success"
                    : tx.status === "pending"
                    ? "Processing"
                    : "Failed"}
                </td>
                <td className={s.tableData}>{tx.type === "deposit" ? "Deposit" : "Withdrawal"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransactionPage;
