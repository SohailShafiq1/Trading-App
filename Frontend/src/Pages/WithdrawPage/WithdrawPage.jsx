import { BiRightArrowCircle } from "react-icons/bi";
import React, { useState, useEffect } from "react";
import styles from "./WithdrawPage.module.css";
import { useUserAssets } from "../../Context/UserAssetsContext";
import { useAuth } from "../../Context/AuthContext";
import { useAccountType } from "../../Context/AccountTypeContext";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useTheme } from "../../Context/ThemeContext";

const s = styles;

const WithdrawPage = () => {
  const { theme } = useTheme();
  const { userAssets, setUserAssets } = useUserAssets();
  const { user } = useAuth();
  const { isDemo, demo_assets } = useAccountType();
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
          `${import.meta.env.VITE_BACKEND_URL}/api/users/is-verified/${
            user._id
          }`
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

    // Show loading toast
    const toastId = toast.loading("Processing your withdrawal request...");

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/users/withdraw`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: user.email,
            amount: withdrawAmount,
            purse, // Use purse as entered
            network,
            paymentMethod,
          }),
        }
      );

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
    <div
      className={s.container}
      style={{ background: theme.background, color: theme.textColor }}
    >
      <div className={s.Box} style={{ background: theme.background }}>
        <div
          className={s.account}
          style={{
            background: theme.box,
            color: theme.textColor,
            border: `1px solid ${theme.border}`,
          }}
        >
          <h3 className={s.sectionTitle} style={{ color: theme.textColor }}>
            Account:
          </h3>
          <div className={s.accountInfo} style={{ color: theme.textColor }}>
            <p style={{ color: theme.textColor }}>In the account:</p>
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
              $
            </p>
          </div>
          <hr
            className={s.divider}
            style={{ borderTop: `1px solid ${theme.border}` }}
          />
          <div className={s.accountInfo} style={{ color: theme.textColor }}>
            <p style={{ color: theme.textColor }}>Available for withdrawal:</p>
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
              $
            </p>
          </div>
          <h1
            className={s.note}
            style={{
              color: theme.warning,
              background: theme.warningBackground,
              borderLeft: `4px solid ${theme.warning}`,
              boxShadow: theme.boxShadow,
              marginTop: "0.5rem",
            }}
          >
            <span style={{ color: theme.textColor }}>
              Note: You can't withdraw your bonus amount. Only your deposited
              balance is available for withdrawal.
            </span>
          </h1>
        </div>

        <div
          className={s.form}
          style={{
            background: theme.box,
            color: theme.textColor,
            border: `1px solid ${theme.border}`,
          }}
        >
          <h3 className={s.sectionTitle} style={{ color: theme.textColor }}>
            Withdrawal:
          </h3>

          {isDemo && (
            <div
              className={s.demoWarning}
              style={{
                color: theme.warning,
                background: theme.warningBackground,
              }}
            >
              <p style={{ color: theme.textColor }}>
                ⚠️ You cannot withdraw from a demo account. Please switch to a
                Live account.
              </p>
            </div>
          )}

          {!isVerified && !isDemo && (
            <div
              className={s.verificationWarning}
              style={{
                color: theme.warning,
                background: theme.warningBackground,
              }}
            >
              <p style={{ color: theme.textColor }}>
                ⚠️ Please verify your account to make withdrawals.
              </p>
            </div>
          )}

          <div className={s.row}>
            <div className={s.inputGroup}>
              <label style={{ color: theme.textColor }}>Amount</label>
              <div className={s.inputWithSuffix}>
                <input
                  type="number"
                  placeholder="10"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                  disabled={isDemo || !isVerified}
                  min="10"
                  style={{
                    background: theme.inputBackground,
                    color: theme.textColor,
                    border: `1px solid ${theme.border}`,
                  }}
                />
                <span className={s.suffix} style={{ color: theme.textColor }}>
                  USD
                </span>
              </div>
            </div>

            <div className={s.inputGroup}>
              <label style={{ color: theme.textColor }}>Payment Method</label>
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
                style={{
                  background: theme.inputBackground,
                  color: theme.textColor,
                  border: `1px solid ${theme.border}`,
                }}
              >
                <option style={{ color: theme.textColor }}>USD Tether</option>
                <option style={{ color: theme.textColor }}>PayPal</option>
                <option style={{ color: theme.textColor }}>
                  Bank Transfer
                </option>
              </select>
            </div>
          </div>

          <div className={s.inputGroup}>
            <label style={{ color: theme.textColor }}>Purse</label>
            <input
              type="text"
              placeholder="Enter your wallet address or account"
              value={purse}
              onChange={(e) => setPurse(e.target.value)}
              disabled={isDemo || !isVerified}
              style={{
                background: theme.inputBackground,
                color: theme.textColor,
                border: `1px solid ${theme.border}`,
              }}
            />
          </div>

          <div className={s.inputGroup}>
            <label style={{ color: theme.textColor }}>Network</label>
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
              style={{
                background: theme.inputBackground,
                color: theme.textColor,
                border: `1px solid ${theme.border}`,
              }}
            >
              <option value="" style={{ color: theme.textColor }}>
                Select Network
              </option>
              <option value="TRC-20" style={{ color: theme.textColor }}>
                TRC-20{" "}
              </option>
              <option value="ERC-20" style={{ color: theme.textColor }}>
                ERC-20{" "}
              </option>
              <option value="BEP-20" style={{ color: theme.textColor }}>
                BNB Smart Chain{" "}
              </option>
              <option value="BTC" style={{ color: theme.textColor }}>
                Bitcoin{" "}
              </option>
              <option value="ETH" style={{ color: theme.textColor }}>
                Ethereum{" "}
              </option>
              <option value="LTC" style={{ color: theme.textColor }}>
                Litecoin{" "}
              </option>
              <option value="SOL" style={{ color: theme.textColor }}>
                Solana{" "}
              </option>
              <option value="XRP" style={{ color: theme.textColor }}>
                Ripple{" "}
              </option>
              <option value="DOGE" style={{ color: theme.textColor }}>
                DogeCoin{" "}
              </option>
              <option value="USDC_POLYGON" style={{ color: theme.textColor }}>
                Polygon{" "}
              </option>
              <option value="UNI" style={{ color: theme.textColor }}>
                Uniswap{" "}
              </option>
              <option value="MATIC" style={{ color: theme.textColor }}>
                Polygon{" "}
              </option>
            </select>
          </div>

          <button
            className={s.confirmBtn}
            onClick={handleWithdraw}
            disabled={isDemo || !isVerified}
            style={{
              background: theme.button,
              color: theme.textColor,
              border: `1px solid ${theme.accent}`,
            }}
          >
            {isDemo
              ? "Switch to Live Account"
              : !isVerified
              ? "Verify Your Account"
              : "Confirm"}

            <BiRightArrowCircle
              className={s.icon}
              style={{ color: theme.buttonText }}
            />
          </button>

          <div className={s.note} style={{ color: theme.textColor }}>
            <span className={s.icon} style={{ color: theme.accent }}>
              💳
            </span>
            <span className={s.mini} style={{ color: theme.textColor }}>
              Minimum withdrawal amount:{" "}
              <strong className={s.green} style={{ color: theme.accent }}>
                $10
              </strong>
            </span>
          </div>
        </div>
      </div>

      {/* Professional popup for unavailable methods */}
      {showUnavailablePopup && (
        <div
          className={s.popupOverlay}
          style={{ background: theme.popupOverlay }}
        >
          <div
            className={s.popupBox}
            style={{ background: theme.box, color: theme.textColor }}
          >
            <div className={s.popupIcon}>
              <span
                role="img"
                aria-label="warning"
                style={{ fontSize: "2.5rem", color: theme.warning }}
              >
                🚧
              </span>
            </div>
            <div className={s.popupTitle} style={{ color: theme.textColor }}>
              Coming Soon
            </div>
            <div className={s.popupMsg} style={{ color: theme.textColor }}>
              We are currently working on this withdrawal method.
              <br />
              <span style={{ color: theme.textColor }}>
                Please choose from{" "}
                <b style={{ color: theme.textColor }}>TRC-20</b>,{" "}
                <b style={{ color: theme.textColor }}>ERC-20</b>, or{" "}
                <b style={{ color: theme.textColor }}>BEP-20</b>.
              </span>
            </div>
            <button
              className={s.closePopupBtn}
              onClick={() => setShowUnavailablePopup(false)}
              style={{ background: theme.button, color: theme.buttonText }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Professional popup for method selection */}
      {showMethodPopup && (
        <div
          className={s.popupOverlay}
          style={{ background: theme.popupOverlay }}
        >
          <div
            className={s.popupBox}
            style={{ background: theme.box, color: theme.textColor }}
          >
            <div className={s.popupIcon}>
              <span
                role="img"
                aria-label="info"
                style={{ fontSize: "2.5rem", color: theme.accent }}
              >
                💸
              </span>
            </div>
            <div className={s.popupTitle} style={{ color: theme.textColor }}>
              Choose a Withdrawal Network
            </div>
            <div className={s.popupMsg} style={{ color: theme.textColor }}>
              Please select one of the following networks to withdraw your
              funds:
              <br />
              <span style={{ color: theme.textColor }}>
                <b style={{ color: theme.textColor }}>TRC-20</b>,{" "}
                <b style={{ color: theme.textColor }}>ERC-20</b>,{" "}
                <b style={{ color: theme.textColor }}>BNB Smart Chain</b>
              </span>
            </div>
            <button
              className={s.closePopupBtn}
              onClick={() => setShowMethodPopup(false)}
              style={{ background: theme.button, color: theme.buttonText }}
            >
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
