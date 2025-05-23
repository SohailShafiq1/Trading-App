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

  // Check verification status
  useEffect(() => {
    const checkVerification = async () => {
      if (!user?._id) {
        setCheckingVerification(false);
        return;
      }

      try {
        const response = await fetch(
          `http://localhost:5000/api/users/is-verified/${user._id}`
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
      const response = await fetch("http://localhost:5000/api/users/withdraw", {
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
                onChange={(e) => setPaymentMethod(e.target.value)}
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
              onChange={(e) => setNetwork(e.target.value)}
              disabled={isDemo || !isVerified}
            >
              <option value="">Select Network</option>
              <option>Ethereum</option>
              <option>Binance Smart Chain</option>
              <option>Polygon</option>
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
