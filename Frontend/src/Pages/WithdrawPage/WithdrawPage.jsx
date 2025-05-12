import { BiRightArrowCircle } from "react-icons/bi";
import React, { useState } from "react";
import styles from "./WithdrawPage.module.css";
import { useUserAssets } from "../../Context/UserAssetsContext"; // Import useUserAssets
import { useAuth } from "../../Context/AuthContext"; // Import useAuth for logged-in user
const s = styles;

const WithdrawPage = () => {
  const { userAssets, setUserAssets } = useUserAssets(); // Access and update userAssets from context
  const { user } = useAuth(); // Get the logged-in user from AuthContext
  const [withdrawAmount, setWithdrawAmount] = useState(0);
  const [purse, setPurse] = useState("");
  const [network, setNetwork] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("USD Tether");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleWithdraw = async () => {
    if (withdrawAmount < 10) {
      setError("Minimum withdrawal amount is $10.");
      setSuccess("");
      return;
    }

    if (withdrawAmount > userAssets) {
      setError("Insufficient balance.");
      setSuccess("");
      return;
    }

    if (!purse || !network) {
      setError("Please fill in all the required fields.");
      setSuccess("");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/users/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email, // Use the logged-in user's email
          amount: withdrawAmount,
          purse,
          network,
          paymentMethod,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setError("");
        setSuccess("Withdrawal request submitted successfully.");
        setUserAssets((prev) => prev - withdrawAmount); // Deduct locally
      } else {
        setError(data.error || "Failed to submit withdrawal request.");
        setSuccess("");
      }
    } catch (err) {
      console.error("Error submitting withdrawal request:", err);
      setError("An error occurred. Please try again.");
      setSuccess("");
    }
  };

  return (
    <div className={s.container}>
      <div className={s.Box}>
        <div className={s.account}>
          <h3 className={s.sectionTitle}>Account:</h3>
          <div className={s.accountInfo}>
            <p>In the account:</p>
            <p className={s.amount}>{userAssets} $</p>
          </div>
          <hr className={s.divider} />
          <div className={s.accountInfo}>
            <p>Available for withdrawal:</p>
            <p className={s.amount}>{userAssets} $</p>
          </div>
        </div>

        <div className={s.form}>
          <h3 className={s.sectionTitle}>Withdrawal:</h3>

          <div className={s.row}>
            <div className={s.inputGroup}>
              <label>Amount</label>
              <div className={s.inputWithSuffix}>
                <input
                  type="number"
                  placeholder="10"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                />
                <span className={s.suffix}>USD</span>
              </div>
            </div>

            <div className={s.inputGroup}>
              <label>Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option>USD Tether</option>
                <option>PayPal</option>
                <option>Bank Transfer</option>
              </select>
            </div>
          </div>

          <div className={s.inputGroup}>
            <label>Purse</label>
            <input
              type="text"
              placeholder="Enter your wallet address or account"
              value={purse}
              onChange={(e) => setPurse(e.target.value)}
            />
          </div>

          <div className={s.inputGroup}>
            <label>Network</label>
            <select
              value={network}
              onChange={(e) => setNetwork(e.target.value)}
            >
              <option value="">Select Network</option>
              <option>Ethereum</option>
              <option>Binance Smart Chain</option>
              <option>Polygon</option>
            </select>
          </div>

          {error && <p className={s.error}>{error}</p>}
          {success && <p className={s.success}>{success}</p>}

          <button className={s.confirmBtn} onClick={handleWithdraw}>
            Confirm <BiRightArrowCircle className={s.icon} />
          </button>

          <div className={s.note}>
            <span className={s.icon}>💳</span>
            <span className={s.mini}>
              Minimum withdrawal amount:{" "}
              <strong className={s.green}>$10</strong>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WithdrawPage;
