import { BiRightArrowCircle } from "react-icons/bi";
import React, { useState } from "react";
import styles from "./WithdrawPage.module.css";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useAffiliateAuth } from "../../../../Context/AffiliateAuthContext";

const s = styles;

const WithdrawPage = () => {
  const { affiliate } = useAffiliateAuth ? useAffiliateAuth() : { affiliate: null };
  const [withdrawAmount, setWithdrawAmount] = useState(0);
  const [purse, setPurse] = useState("");
  const [network, setNetwork] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("USD Tether");
  const [showPopup, setShowtPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [showMethodPopup, setShowMethodPopup] = useState(false);
  const [showUnavailablePopup, setShowUnavailablePopup] = useState(false);
  const [loading, setLoading] = useState(false);

  // Remove backend verification logic
  const isVerified = true; // Always verified for UI demo

  // Remove backend withdrawal logic and demo logic
  const handleWithdraw = async () => {
    if (!isVerified) {
      toast.error("Please verify your account to make withdrawals", {
        autoClose: 3000,
      });
      return;
    }
    if (withdrawAmount < 10) {
      toast.warn("Minimum withdrawal amount is $10", {
        autoClose: 2500,
      });
      return;
    }
    if (!purse || !network) {
      toast.error("Please fill in all the required fields", {
        autoClose: 2500,
      });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/affiliate/withdraw`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("affiliate_token")}`,
        },
        body: JSON.stringify({
          amount: withdrawAmount,
          purse,
          network,
          paymentMethod,
          affiliateId: affiliate?._id,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Withdrawal request submitted!", { autoClose: 3000 });
        setWithdrawAmount(0);
        setPurse("");
        setNetwork("");
        setPaymentMethod("USD Tether");
        // Immediately update local affiliate prize pool
        if (affiliate && typeof affiliate.totalPrize !== 'undefined') {
          affiliate.totalPrize = Number(affiliate.totalPrize) - Number(withdrawAmount);
        }
      } else {
        toast.error(data.error || "Failed to submit withdrawal request", { autoClose: 3000 });
      }
    } catch (err) {
      toast.error("Network error. Please try again.", { autoClose: 3000 });
    }
    setLoading(false);
  };

  // Helper for displaying balance/prize pool
  const displayPrize = () =>
    affiliate?.totalPrize
      ? `$${Number(affiliate.totalPrize).toLocaleString()}`
      : "$0.00";

  // Show professional popup on mount (UI only)
  React.useEffect(() => {
    setShowMethodPopup(true);
  }, []);

  return (
    <div className={s.container}>
      <div className={s.Box}>
        <div className={s.account}>
          <h3 className={s.sectionTitle}>Account:</h3>
          <div className={s.accountInfo}>
            <p>In the account:</p>
            <p className={s.amount}>{displayPrize()}</p>
          </div>
          <hr className={s.divider} />
          <div className={s.accountInfo}>
            <p>Available for withdrawal:</p>
            <p className={s.amount}>{displayPrize()}</p>
          </div>
          {loading && (
            <div className={s.spinnerContainer}>
              <div className={s.spinner}></div>
            </div>
          )}
          <h1
            className={s.note}
            style={{ color: "#ff9800", marginTop: "0.5rem" }}
          >
            Note: You can't withdraw your bonus amount. Only your deposited
            balance is available for withdrawal.
          </h1>
        </div>

        <div className={s.form}>
          <h3 className={s.sectionTitle}>Withdrawal:</h3>

          {/* Demo warning removed */}

          {/* Verification warning (should never show) */}
          {!isVerified && (
            <div className={s.verificationWarning}>
              <p>⚠️ Please verify your account to make withdrawals.</p>
            </div>
          )}

          <div className={s.row}>
            <div className={s.inputGroup}>
              <label>Amount</label>
              <div className={s.inputWithSuffix}>
                <input
                  type="number"
                  placeholder="10"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                  disabled={!isVerified}
                  min="100"
                />
                <span className={s.suffix}>USD</span>
              </div>
            </div>

            <div className={s.inputGroup}>
              <label>Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === "USD Tether") {
                    setPaymentMethod(value);
                    setShowUnavailablePopup(false);
                  } else {
                    setShowUnavailablePopup(true);
                    setPaymentMethod("USD Tether");
                  }
                }}
                disabled={!isVerified}
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
              disabled={!isVerified}
            />
          </div>

          <div className={s.inputGroup}>
            <label>Network</label>
            <select
              value={network}
              onChange={(e) => {
                const value = e.target.value;
                if (["TRC-20", "ERC-20", "BEP-20"].includes(value)) {
                  setNetwork(value);
                  setShowUnavailablePopup(false);
                } else if (value) {
                  setShowUnavailablePopup(true);
                  setNetwork("");
                } else {
                  setNetwork("");
                }
              }}
              disabled={!isVerified}
            >
              <option value="">Select Network</option>
              <option value="TRC-20">TRC-20 </option>
              <option value="ERC-20">ERC-20 </option>
              <option value="BEP-20">BNB Smart Chain </option>
              <option value="BTC">Bitcoin </option>
              <option value="ETH">Ethereum </option>
              <option value="LTC">Litecoin </option>
              <option value="SOL">Solana </option>
              <option value="XRP">Ripple </option>
              <option value="DOGE">DogeCoin </option>
              <option value="USDC_POLYGON">Polygon </option>
              <option value="UNI">Uniswap  </option>
              <option value="MATIC">Polygon  </option>
            </select>
          </div>

          <button
            className={s.confirmBtn}
            onClick={handleWithdraw}
            disabled={!isVerified || loading}
          >
            {loading ? 'Processing...' : 'Confirm'}
            <BiRightArrowCircle className={s.icon} />
          </button>

          <div className={s.note}>
            <span className={s.icon}>💳</span>
            <span className={s.mini}>
              Minimum withdrawal amount: {" "}
              <strong className={s.green}>$100</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Professional popup for unavailable methods */}
      {showUnavailablePopup && (
        <div className={s.popupOverlay}>
          <div className={s.popupBox}>
            <div className={s.popupIcon}>
              <span role="img" aria-label="warning" style={{fontSize: '2.5rem', color: '#e67e22'}}>🚧</span>
            </div>
            <div className={s.popupTitle}>Coming Soon</div>
            <div className={s.popupMsg}>
              We are currently working on this withdrawal method.<br />
              Please choose from <b>TRC-20</b>, <b>ERC-20</b>, or <b>BEP-20</b>.
            </div>
            <button className={s.closePopupBtn} onClick={() => setShowUnavailablePopup(false)}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* Professional popup for method selection */}
      {showMethodPopup && (
        <div className={s.popupOverlay}>
          <div className={s.popupBox}>
            <div className={s.popupIcon}>
              <span role="img" aria-label="info" style={{fontSize: '2.5rem', color: '#3498db'}}>💸</span>
            </div>
            <div className={s.popupTitle}>Choose a Withdrawal Network</div>
            <div className={s.popupMsg}>
              Please select one of the following networks to withdraw your funds:<br />
              <b>TRC-20</b>, <b>ERC-20</b>, <b>BNB Smart Chain</b>
            </div>
            <button className={s.closePopupBtn} onClick={() => setShowMethodPopup(false)}>
              Close
            </button>
          </div>
        </div>
      )}

      <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </div>
  );
};

export default WithdrawPage;
