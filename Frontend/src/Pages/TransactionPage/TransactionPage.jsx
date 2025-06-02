import { useState, useEffect } from "react";
import { useAuth } from "../../Context/AuthContext";
import { AiOutlineCheckCircle } from "react-icons/ai";
import styles from "./TransactionPage.module.css";
const s = styles;

const TransactionPage = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch transactions
        const txRes = await fetch(
          `http://localhost:5000/api/users/transactions/${user.email}`
        );
        if (!txRes.ok) throw new Error("Failed to fetch transactions");
        const txData = await txRes.json();
        setTransactions(txData);

        // Fetch withdrawals
        const wdRes = await fetch(
          `http://localhost:5000/api/users/withdrawals/${user.email}`
        );
        if (!wdRes.ok) throw new Error("Failed to fetch withdrawals");
        const wdData = await wdRes.json();
        setWithdrawals(wdData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user.email]);

  // 1. Filter out withdrawal transactions that have a matching withdrawal
  const withdrawalOrderIds = new Set(withdrawals.map((wd) => wd.orderId));

  // Combine and sort by date (descending)
  const allRows = [
    // Only include deposit transactions and withdrawal transactions that do NOT have a matching withdrawal
    ...transactions
      .filter(
        (tx) =>
          tx.type === "deposit" ||
          (tx.type === "withdrawal" && !withdrawalOrderIds.has(tx.orderId))
      )
      .map((tx) => ({
        ...tx,
        rowType: "transaction",
        displayDate: tx.date,
        displayAmount:
          (tx.type === "deposit" ? "+" : "-") + "$" + tx.amount.toFixed(2),
        displayType: tx.type === "deposit" ? "Deposit" : "Withdrawal",
        displayStatus:
          tx.status === "success"
            ? "Success"
            : tx.status === "pending"
            ? "Processing"
            : "Failed",
      })),
    // Always include withdrawals
    ...withdrawals.map((wd) => ({
      ...wd,
      rowType: "withdrawal",
      displayDate: wd.createdAt,
      displayAmount: "-$" + wd.amount.toFixed(2),
      displayType: "Withdrawal",
      displayStatus:
        wd.status === "autoapproved"
          ? "Auto Approved"
          : wd.status.charAt(0).toUpperCase() + wd.status.slice(1),
    })),
  ].sort((a, b) => new Date(b.displayDate) - new Date(a.displayDate));

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
            {allRows.map((row) => (
              <tr key={row.orderId}>
                <td className={s.tableData}>{row.orderId || "N/A"}</td>
                <td className={s.amount}>{row.displayAmount}</td>
                <td className={s.tableData}>
                  {new Date(row.displayDate).toLocaleString()}
                </td>
                <td className={s.tableData}>
                  {row.paymentMethod || row.network || row.purse || "N/A"}
                </td>
                <td className={s.tableData}>
                  <AiOutlineCheckCircle className={s.circle} />
                  {row.displayStatus}
                </td>
                <td className={s.tableData}>{row.displayType}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransactionPage;
