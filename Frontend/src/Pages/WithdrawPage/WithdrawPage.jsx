import { BiRightArrowCircle } from "react-icons/bi";
import React, { useState, useEffect } from "react";
import styles from "./WithdrawPage.module.css";
import { useUserAssets } from "../../Context/UserAssetsContext";
import { useAuth } from "../../Context/AuthContext";
import { useAccountType } from "../../Context/AccountTypeContext";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const s = styles;

const WithdrawPage = () => {
  const { userAssets, setUserAssets } = useUserAssets();
  const { user } = useAuth();
  const { isDemo } = useAccountType();
  const [withdrawAmount, setWithdrawAmount] = useState(0);
  const [purse, setPurse] = useState("");
  const [network, setNetwork] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("USD Tether");
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [checkingVerification, setCheckingVerification] = useState(true);
  const [showMethodPopup, setShowMethodPopup] = useState(false);
  const [showUnavailablePopup, setShowUnavailablePopup] = useState(false);

  // Check verification status
  useEffect(() => {
    const checkVerification = async () => {
      if (!user?._id) {
        setCheckingVerification(false);
        return;
      }

      try {
        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/users/is-verified/${user._id}`
        );
        const data = await response.json();
        setIsVerified(data.verified);

        if (!data.verified) {
          toast.warn("Please verify your account to make withdrawals", {
            autoClose: 3000,
          });
        }
      } catch (err) {
        console.error("Error checking verification status:", err);
        toast.error("Failed to check verification status", {
          autoClose: 2000,
        });
      } finally {
        setCheckingVerification(false);
      }
    };

    checkVerification();
  }, [user?._id]);

  const handleWithdraw = async () => {
    if (isDemo) {
      toast.error("Please switch to a Live account to make withdrawals", {
        autoClose: 3000,
      });
      return;
    }

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

    if (withdrawAmount > userAssets) {
      toast.error("Insufficient balance for withdrawal", {
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

    const sanitizedPurse = purse.replace(/[^a-z0-9]/g, "");

    if (sanitizedPurse !== purse) {
      toast.error(
        "Wallet address can only contain lowercase letters and numbers",
        {
          autoClose: 3000,
        }
      );
      return;
    }

    // Show loading toast
    const toastId = toast.loading("Processing your withdrawal request...");

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/users/withdraw`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          amount: withdrawAmount,
          purse: sanitizedPurse,
          network,
          paymentMethod,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.update(toastId, {
          render: "Withdrawal request submitted successfully!",
          type: "success",
          isLoading: false,
          autoClose: 3000,
        });

        setUserAssets((prev) => prev - withdrawAmount);
        setWithdrawAmount(0);
        setPurse("");
        setNetwork("");
        setPaymentMethod("USD Tether");

        // Additional success toast
        toast.success(`$${withdrawAmount} withdrawal initiated`, {
          autoClose: 3000,
        });
      } else {
        toast.update(toastId, {
          render: data.error || "Failed to process withdrawal",
          type: "error",
          isLoading: false,
          autoClose: 3000,
        });
      }
    } catch (err) {
      console.error("Error submitting withdrawal request:", err);
      toast.update(toastId, {
        render: "Network error. Please try again",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    }
  };

  const bonus = typeof user?.totalBonus === "number" ? user.totalBonus : 0;
  const totalBalance = (userAssets || 0) + bonus;

  // Show professional popup on mount
  useEffect(() => {
    setShowMethodPopup(true);
  }, []);

  return (
    <div className={s.container}>
      <div className={s.Box}>
        <div className={s.account}>
          <h3 className={s.sectionTitle}>Account:</h3>
          <div className={s.accountInfo}>
            <p>In the account:</p>
            <p className={s.amount}>
                 {isDemo
                  ? demo_assets.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })
                  : Number(totalBalance).toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
               $</p>
          </div>
          <hr className={s.divider} />
          <div className={s.accountInfo}>
            <p>Available for withdrawal:</p>
            <p className={s.amount}>
            
             {isDemo
                  ? demo_assets.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })
                  : Number(userAssets).toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
             $</p>
          </div>
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

          {isDemo && (
            <div className={s.demoWarning}>
              <p>
                ⚠️ You cannot withdraw from a demo account. Please switch to a
                Live account.
              </p>
            </div>
          )}

          {!isVerified && !isDemo && (
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
                  disabled={isDemo || !isVerified}
                  min="10"
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
                disabled={isDemo || !isVerified}
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
              disabled={isDemo || !isVerified}
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
              disabled={isDemo || !isVerified}
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
            disabled={isDemo || !isVerified}
          >
            {isDemo
              ? "Switch to Live Account"
              : !isVerified
              ? "Verify Your Account"
              : "Confirm"}
              
            <BiRightArrowCircle className={s.icon} />
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
