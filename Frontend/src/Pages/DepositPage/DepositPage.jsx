import React, { useState, useEffect } from "react";
import styles from "./DepositPage.module.css";
import { BsCurrencyBitcoin } from "react-icons/bs";
import { AiFillBank } from "react-icons/ai";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useAuth } from "../../Context/AuthContext";
import { useAccountType } from "../../Context/AccountTypeContext";
import { useTheme } from "../../Context/ThemeContext";

import bitcoin from "./assets/bitcoin.png";
import ethereum from "./assets/ethereum.png";
import ltc from "./assets/ltc.png";
import solana from "./assets/solana.png";
import ripple from "./assets/ripple.png";
import dogecoin from "./assets/dogecoin.png";
import uniswap from "./assets/uniswap.png";
import polygon from "./assets/polygon.png";
import TRC20 from "./assets/TRC20.png";
import BEP20 from "./assets/BEP20.png";
import ERC20 from "./assets/ERC20.png";
import USDpolygon from "./assets/USDpolygon.png";
import trxImg from "./assets/trc.jpg";
import ercImg from "./assets/erc.jpg";
import bnbImg from "./assets/bnb.jpg";
const s = styles;
const ADMIN_WALLET_TRC = "TTuh3Sou6PX5fRDypDWH4UKJpejusKoPYK";
const ADMIN_WALLET_ERC = "0xa0e5b67ddf1ff2f0dd0dd8e38aacf84799e6637f";
const ADMIN_WALLET_BNB = "0xa0e5b67ddf1ff2f0dd0dd8e38aacf84799e6637f";

const CurrencyArray = [
  { name: "USD Tether(TRC-20)", icon: TRC20 },
  { name: "USD Tether(ERC-20)", icon: ERC20 },
  { name: "BNB Smart Chain", icon: BEP20 },

  { name: "Bitcoin(BTC)", icon: bitcoin },
  { name: "Ethereum(ETH)", icon: ethereum },
  { name: "Litecoin(LTC)", icon: ltc },
  { name: "Solana", icon: solana },
  { name: "Ripple", icon: ripple },
  { name: "DogeCoin", icon: dogecoin },
  { name: "USD Coin(Polygon)", icon: USDpolygon },
  { name: "Uniswap(UNI)", icon: uniswap },
  { name: "Polygon(MATIC)", icon: polygon },
];

const supportedCoins = [
  "USD Tether(TRC-20)",
  "USD Tether(ERC-20)",
  "BNB Smart Chain",
];

const DepositPage = () => {
  const { user } = useAuth();
  const { isDemo } = useAccountType(); // Get account type
  const { theme } = useTheme();
  const [selected, setSelected] = useState("USD Tether(TRC-20)");
  const [showModal, setShowModal] = useState(false);
  const [amount, setAmount] = useState("");
  const [txId, setTxId] = useState("");
  const [email, setEmail] = useState(user?.email || "");
  const [fromAddress, setFromAddress] = useState("");
  const [message, setMessage] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [checkingVerification, setCheckingVerification] = useState(true);
  const [showContinue, setShowContinue] = useState(false);
  const [showBonusPopup, setShowBonusPopup] = useState(false);
  const [selectedBonus, setSelectedBonus] = useState(null);
  const [amountLocked, setAmountLocked] = useState(false); // <-- Added state for amount locked
  const [showMethodPopup, setShowMethodPopup] = useState(false);
  const [pendingDeposit, setPendingDeposit] = useState(null);
  const [pendingDeposits, setPendingDeposits] = useState([]);
  const [totalPendingAmount, setTotalPendingAmount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [showPendingNotification, setShowPendingNotification] = useState(false);
  const [showTxIdPopup, setShowTxIdPopup] = useState(false);

  const [bonusOptions, setBonusOptions] = useState([]);

  // Function to check pending deposits
  const checkPendingDeposits = async () => {
    if (!user?._id) return;

    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/users/pending-deposits/${
          user._id
        }`
      );

      if (response.data.hasPending) {
        setPendingDeposits(response.data.deposits || []);
        setTotalPendingAmount(response.data.totalPendingAmount || 0);
        setPendingCount(response.data.pendingCount || 0);
        setPendingDeposit(response.data.deposit); // Keep for backward compatibility
        setShowPendingNotification(true);
      } else {
        setPendingDeposits([]);
        setTotalPendingAmount(0);
        setPendingCount(0);
        setPendingDeposit(null);
        setShowPendingNotification(false);
      }
    } catch (err) {
      console.error("Error checking pending deposits:", err);
    }
  };

  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_BACKEND_URL}/api/bonuses`)
      .then((res) => setBonusOptions(res.data));
  }, []);

  // Check for pending deposits
  useEffect(() => {
    checkPendingDeposits();
  }, [user?._id]);

  // Show professional popup on mount
  useEffect(() => {
    setShowMethodPopup(true);
  }, []);

  // Check verification status
  useEffect(() => {
    const checkVerification = async () => {
      if (!user?._id) {
        setCheckingVerification(false);
        return;
      }

      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/users/is-verified/${
            user._id
          }`
        );
        setIsVerified(response.data.verified);
      } catch (err) {
        console.error("Error checking verification status:", err);
        toast.error("Failed to check verification status");
      } finally {
        setCheckingVerification(false);
      }
    };

    checkVerification();
  }, [user?._id]);

  const fetchBonuses = async () => {
    const res = await axios.get(
      `${import.meta.env.VITE_BACKEND_URL}/api/bonuses`
    );
    setBonusOptions(res.data);
  };

  const handleCoinClick = (coin) => {
    if (isDemo) {
      toast.error("Please switch to a Live account to make deposits");
      return;
    }

    if (!isVerified) {
      toast.error("Please verify your account to make deposits");
      return;
    }

    setSelected(coin.name);
    if (
      coin.name === "USD Tether(TRC-20)" ||
      coin.name === "USD Tether(ERC-20)" ||
      coin.name === "BNB Smart Chain"
    ) {
      fetchBonuses();
      setShowModal(true);
      setSelectedBonus(null); // Reset bonus selection each time modal opens
    } else {
      setShowMethodPopup(true);
    }
  };

  useEffect(() => {
    fetchBonuses();
  }, []);
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isDemo) {
      toast.error("Please switch to a Live account to make deposits");
      return;
    }

    if (!isVerified) {
      toast.error("Please verify your account to make deposits");
      return;
    }

    if (!amount) {
      setMessage("Amount is required.");
      return;
    }

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/users/deposit`,
        {
          email,
          amount,
          txId,
          fromAddress,
          bonusPercent: selectedBonus?.percent,
          bonusId: selectedBonus?._id, // Send bonus ID
        }
      );

      setMessage(res.data.message);
      setAmount("");
      setTxId("");
      setFromAddress("");
      setSelectedBonus(null);

      // Check for pending deposits after successful submission
      checkPendingDeposits();

      toast.success("Deposit submitted successfully! Pending approval.");
    } catch {
      setMessage("Deposit failed. Try again.");
      toast.error("Deposit failed. Please try again.");
    }
  };

  // Optionally update email if user changes (e.g. after login)
  useEffect(() => {
    if (user?.email) setEmail(user.email);
  }, [user?.email]);

  const usedBonuses = user?.usedBonuses || [];

  const getWalletInfo = (currencyName) => {
    if (currencyName === "USD Tether(TRC-20)") {
      return { address: ADMIN_WALLET_TRC, qr: trxImg, label: "TRC-20" };
    }
    if (currencyName === "USD Tether(ERC-20)") {
      return { address: ADMIN_WALLET_ERC, qr: ercImg, label: "ERC-20" };
    }
    if (currencyName === "BNB Smart Chain") {
      return { address: ADMIN_WALLET_BNB, qr: bnbImg, label: "BEP-20" };
    }
    return { address: "", qr: "", label: "" };
  };

  // Auto-select bonus if amount is greater than or equal to a bonus min
  useEffect(() => {
    if (!bonusOptions.length || !amount || isNaN(Number(amount))) return;
    // Find the highest eligible bonus (if multiple bonuses, pick the one with the highest min <= amount)
    const eligibleBonuses = bonusOptions.filter(
      (opt) => Number(amount) >= Number(opt.min)
    );
    if (eligibleBonuses.length > 0) {
      // If already selected, don't change unless user manually changed amount
      const bestBonus = eligibleBonuses.reduce((prev, curr) =>
        Number(curr.percent) > Number(prev.percent) ? curr : prev
      );
      if (!selectedBonus || selectedBonus._id !== bestBonus._id) {
        setSelectedBonus({ _id: bestBonus._id, percent: bestBonus.percent });
      }
    } else if (selectedBonus) {
      setSelectedBonus(null);
    }
  }, [amount, bonusOptions]);

  return (
    <div
      className={s.container}
      style={{ color: theme.textColor, background: theme.background }}
    >
      <div className={s.rightSide} style={{ color: theme.textColor }}>
        <div
          className={s.title}
          style={{ color: theme.textColor, background: theme.box }}
        >
          <BsCurrencyBitcoin
            className={s.iconTitle}
            style={{ color: theme.textColor }}
          />
          <span className={s.text} style={{ color: theme.textColor }}>
            Cryptocurrencies
          </span>
        </div>

        <div
          className={s.box}
          style={{ background: theme.box, color: theme.textColor }}
        >
          {pendingDeposits.length > 0 && (
            <div
              className={s.pendingWarning}
              style={{
                background: theme.warningBackground,
                color: theme.warning,
              }}
            >
              <div className={s.warningIcon}>⏳</div>
              <div className={s.warningContent}>
                <h4 style={{ color: theme.textColor }}>
                  {pendingCount === 1
                    ? "1 Deposit Pending Approval"
                    : `${pendingCount} Deposits Pending Approval`}
                </h4>
                <p style={{ color: theme.textColor }}>
                  You have{" "}
                  {pendingCount === 1
                    ? "a deposit"
                    : `${pendingCount} deposits`}{" "}
                  totaling{" "}
                  <strong style={{ color: "#28a745" }}>
                    ${totalPendingAmount.toFixed(2)}
                  </strong>{" "}
                  awaiting approval. You can still make additional deposits
                  while these are being processed.
                </p>
              </div>
            </div>
          )}
          {CurrencyArray.map((currency, index) => (
            <div
              className={s.currency}
              key={index}
              onClick={() => handleCoinClick(currency)}
              style={{
                color: theme.textColor,
                background: theme.background,
                border: `1px solid ${theme.border}`,
                borderRadius: 8,
                marginBottom: 8,
                cursor: "pointer",
                transition: "background 0.2s",
              }}
            >
              <div className={s.imageBox}>
                <img
                  src={currency.icon}
                  alt={currency.name}
                  className={s.image}
                />
              </div>
              <p style={{ color: theme.textColor }}>{currency.name}</p>
            </div>
          ))}
        </div>

        <div className={s.constraint} style={{ color: theme.textColor }}>
          <AiFillBank className={s.icon} style={{ color: theme.textColor }} />
          <span className={s.text} style={{ color: theme.textColor }}>
            Minimum deposit amount:
          </span>
          <span className={s.span} style={{ color: "#28a745" }}>
            {" "}
            $10{" "}
          </span>
        </div>
      </div>

      {showModal && (
        <div className={s.modalOverlay}>
          <div
            className={s.modal}
            style={{ background: theme.box, color: theme.textColor }}
          >
            <button
              className={s.closeButton}
              onClick={() => {
                setShowModal(false);
                setShowContinue(false);
                setAmount("");
                setMessage("");
              }}
              style={{ color: theme.textColor, background: theme.box }}
            >
              ✕
            </button>
            <h2 className={s.modalHeader} style={{ color: theme.textColor }}>
              {selected} <br /> Deposit
            </h2>

            {!showContinue ? (
              <>
                <div
                  className={s.instructions}
                  style={{ color: theme.textColor }}
                >
                  <p>
                    <strong style={{ color: "#28a745" }}>
                      📌 Instructions:
                    </strong>
                  </p>
                  <ol>
                    <li>
                      Go to your crypto wallet (Trust Wallet, Binance, etc.)
                    </li>
                    <li>
                      Select{" "}
                      <strong style={{ color: "#28a745" }}>
                        USDT (TRC-20)
                      </strong>
                    </li>
                    <li>Enter the amount you want to deposit below</li>
                  </ol>
                </div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!amount || Number(amount) < 10) {
                      setMessage("Please enter an amount of at least $10");
                      return;
                    }
                    setShowContinue(true);
                  }}
                  className={s.form}
                  style={{ color: theme.textColor }}
                >
                  <input
                    type="number"
                    placeholder="Amount"
                    value={amount}
                    onChange={(e) => {
                      setAmount(e.target.value);
                      if (amountLocked) {
                        setSelectedBonus(null);
                        setAmountLocked(false);
                      }
                    }}
                    onClick={() => {
                      if (amountLocked) {
                        setSelectedBonus(null);
                        setAmountLocked(false);
                        setAmount("");
                      }
                    }}
                    min="10"
                    required
                    disabled={isDemo || !isVerified}
                    readOnly={amountLocked}
                    style={{
                      background: theme.inputBackground,
                      color: theme.textColor,
                      border: `1px solid ${theme.border}`,
                    }}
                  />

                  {/* Bonus options listed below Amount input */}
                  <div className={s.bonusOptions}>
                    <label
                      style={{
                        fontWeight: 500,
                        marginBottom: 4,
                        display: "block",
                        color: theme.textColor,
                      }}
                    >
                      Select Deposit Bonus:
                    </label>
                    {bonusOptions
                      .filter(
                        (opt) =>
                          !usedBonuses.some((bonusId) => bonusId === opt._id)
                      )
                      .map((opt, idx) => (
                        <label
                          key={idx}
                          className={s.bonusRadioLabel}
                          style={{ color: theme.textColor }}
                        >
                          <input
                            type="radio"
                            name="bonus"
                            value={opt._id}
                            checked={selectedBonus?._id === opt._id}
                            onChange={() => {
                              setSelectedBonus({
                                _id: opt._id,
                                percent: opt.percent,
                              });
                              setAmount(String(opt.min));
                              setAmountLocked(false);
                            }}
                            disabled={isDemo || !isVerified}
                          />
                          Min Deposit:{" "}
                          <b style={{ color: "#28a745" }}>${opt.min}</b> –
                          Bonus:{" "}
                          <b style={{ color: "#28a745" }}>{opt.percent}%</b>
                        </label>
                      ))}
                    {/* Optionally show a message if all bonuses are used */}
                    {bonusOptions.filter(
                      (opt) => !usedBonuses.includes(opt.percent)
                    ).length === 0 && (
                      <div
                        style={{
                          color: theme.textColor,
                          fontSize: "0.95em",
                        }}
                      >
                        You have already used all available deposit bonuses.
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isDemo || !isVerified}
                    style={{
                      background: theme.button,
                      color: theme.buttonText,
                    }}
                  >
                    Continue
                  </button>

                  {message && (
                    <p className={s.message} style={{ color: theme.textColor }}>
                      {message}
                    </p>
                  )}
                  {isDemo && (
                    <p
                      className={s.errorMessage}
                      style={{ color: theme.warning }}
                    >
                      You cannot deposit with a demo account. Please switch to a
                      Live account.
                    </p>
                  )}
                  {!isVerified && (
                    <p
                      className={s.errorMessage}
                      style={{ color: theme.warning }}
                    >
                      Please verify your account to make deposits.
                    </p>
                  )}
                </form>
                {amountLocked && (
                  <p
                    className={s.note}
                    style={{ color: theme.textColor, fontSize: "0.95em" }}
                  >
                    Amount is set by your bonus selection. Edit amount to remove
                    bonus.
                  </p>
                )}
              </>
            ) : (
              <>
                <div
                  className={s.instructions}
                  style={{ color: theme.textColor }}
                >
                  {(() => {
                    const wallet = getWalletInfo(selected);
                    return (
                      <>
                        <img
                          src={wallet.qr}
                          alt={`${wallet.label} QR Code`}
                          className={styles.trxQrImg}
                        />
                        <p>
                          <strong style={{ color: "#28a745" }}>
                            Send to Wallet ({wallet.label}):
                          </strong>
                        </p>
                        <div className={s.walletRow}>
                          <code
                            className={s.walletCode}
                            style={{ color: theme.textColor }}
                          >
                            {wallet.address}
                          </code>
                          <button
                            type="button"
                            className={s.copyButton}
                            onClick={() => {
                              navigator.clipboard.writeText(wallet.address);
                              toast.success("Wallet address copied!");
                            }}
                            style={{
                              background: theme.button,
                              color: theme.buttonText,
                            }}
                          >
                            Copy
                          </button>
                        </div>
                        {/* Transaction ID input field */}
                        <div className={s.txidInputBox}>
                          <label
                            htmlFor="txIdInput"
                            className={s.txidLabel}
                            style={{ color: theme.textColor }}
                          >
                            Transaction ID (TxID):
                          </label>
                          <input
                            id="txIdInput"
                            type="text"
                            placeholder="Enter your transaction ID"
                            value={txId}
                            onChange={(e) => setTxId(e.target.value)}
                            className={s.txidInput}
                            required
                            style={{
                              background: theme.inputBackground,
                              color: theme.textColor,
                              border: `1px solid ${theme.border}`,
                            }}
                          />
                        </div>
                      </>
                    );
                  })()}
                  <p style={{ color: theme.textColor }}>
                    After sending, click{" "}
                    <b style={{ color: "#28a745" }}>Submit</b> to finish your
                    deposit request.
                  </p>
                </div>
                <button
                  className={s.submitButton}
                  onClick={async () => {
                    if (!txId) {
                      setShowTxIdPopup(true);
                      return;
                    }
                    try {
                      const res = await axios.post(
                        `${import.meta.env.VITE_BACKEND_URL}/api/users/deposit`,
                        {
                          email,
                          amount,
                          txId, // Send the actual txId
                          fromAddress,
                          bonusPercent: selectedBonus?.percent,
                          bonusId: selectedBonus?._id,
                        }
                      );
                      setMessage(res.data.message);
                      setAmount("");
                      setShowModal(false);
                      setShowContinue(false);

                      // Check for pending deposits after successful submission
                      checkPendingDeposits();

                      toast.success(
                        "Deposit submitted successfully! Pending approval."
                      );
                    } catch {
                      setMessage("Deposit failed. Try again.");
                      toast.error("Deposit failed. Please try again.");
                    }
                  }}
                  disabled={isDemo || !isVerified}
                  style={{ background: theme.button, color: theme.buttonText }}
                >
                  Submit
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Pending Deposit Notification */}
      {showPendingNotification && pendingDeposits.length > 0 && (
        <div className={s.pendingNotificationOverlay}>
          <div
            className={s.pendingNotificationModal}
            style={{ background: theme.box, color: theme.textColor }}
          >
            <div className={s.pendingIcon}>
              <span
                role="img"
                aria-label="pending"
                style={{ fontSize: "3rem", color: theme.warning }}
              >
                ⏳
              </span>
            </div>
            <h3 className={s.pendingTitle} style={{ color: theme.textColor }}>
              {pendingCount === 1
                ? "Deposit Submitted - Pending Approval"
                : `${pendingCount} Deposits Pending Approval`}
            </h3>
            <div
              className={s.pendingDetails}
              style={{ color: theme.textColor }}
            >
              <p>
                {pendingCount === 1
                  ? "Your deposit has been submitted and is awaiting admin approval:"
                  : `You have ${pendingCount} deposits awaiting admin approval:`}
              </p>
              <div className={s.depositInfo}>
                {pendingCount === 1 ? (
                  // Show single deposit details
                  <>
                    <div className={s.infoRow}>
                      <span
                        className={s.infoLabel}
                        style={{ color: theme.textColor }}
                      >
                        Amount:
                      </span>
                      <span
                        className={s.infoValue}
                        style={{ color: theme.accent }}
                      >
                        ${pendingDeposit.amount}
                      </span>
                    </div>
                    <div className={s.infoRow}>
                      <span
                        className={s.infoLabel}
                        style={{ color: theme.textColor }}
                      >
                        Date:
                      </span>
                      <span
                        className={s.infoValue}
                        style={{ color: theme.textColor }}
                      >
                        {new Date(
                          pendingDeposit.createdAt
                        ).toLocaleDateString()}
                      </span>
                    </div>
                    <div className={s.infoRow}>
                      <span
                        className={s.infoLabel}
                        style={{ color: theme.textColor }}
                      >
                        Status:
                      </span>
                      <span
                        className={s.infoValue}
                        style={{ color: theme.warning, fontWeight: "bold" }}
                      >
                        Pending
                      </span>
                    </div>
                  </>
                ) : (
                  // Show multiple deposits summary
                  <>
                    <div className={s.infoRow}>
                      <span
                        className={s.infoLabel}
                        style={{ color: theme.textColor }}
                      >
                        Total Amount:
                      </span>
                      <span
                        className={s.infoValue}
                        style={{ color: "#10a055" }}
                      >
                        ${totalPendingAmount.toFixed(2)}
                      </span>
                    </div>
                    <div className={s.infoRow}>
                      <span
                        className={s.infoLabel}
                        style={{ color: theme.textColor }}
                      >
                        Number of Deposits:
                      </span>
                      <span
                        className={s.infoValue}
                        style={{ color: "#10a055" }}
                      >
                        {pendingCount}
                      </span>
                    </div>
                    <div className={s.infoRow}>
                      <span
                        className={s.infoLabel}
                        style={{ color: theme.textColor }}
                      >
                        Latest Deposit:
                      </span>
                      <span
                        className={s.infoValue}
                        style={{ color: "#10a055" }}
                      >
                        {new Date(
                          pendingDeposits[0].createdAt
                        ).toLocaleDateString()}
                      </span>
                    </div>
                    <div className={s.infoRow}>
                      <span
                        className={s.infoLabel}
                        style={{ color: theme.textColor }}
                      >
                        Status:
                      </span>
                      <span
                        className={s.infoValue}
                        style={{ color: "#10a055", fontWeight: "bold" }}
                      >
                        All Pending
                      </span>
                    </div>
                  </>
                )}
              </div>
              <p
                className={s.pendingMessage}
                style={{ color: theme.textColor }}
              >
                {pendingCount === 1
                  ? "Your deposit has been successfully submitted and is now pending admin approval. Please wait while our team reviews your deposit. You will receive a notification once it's approved and the funds are added to your account."
                  : `Your ${pendingCount} deposits have been submitted and are pending admin approval. You can continue making additional deposits while these are being processed. You will receive notifications as each deposit is approved.`}
              </p>
            </div>
            <div className={s.pendingButtonGroup}>
              <button
                className={s.refreshPendingBtn}
                onClick={() => {
                  checkPendingDeposits();
                  toast.info("Status refreshed");
                }}
                style={{ background: theme.button, color: theme.buttonText }}
              >
                Refresh Status
              </button>
              <button
                className={s.closePendingBtn}
                onClick={() => setShowPendingNotification(false)}
                style={{ background: theme.button, color: theme.buttonText }}
              >
                I Understand
              </button>
            </div>
          </div>
        </div>
      )}

      {showBonusPopup && (
        <div className={s.bonusModalOverlay}>
          <div
            className={s.bonusModal}
            style={{ background: theme.box, color: theme.textColor }}
          >
            <h3 style={{ color: theme.textColor }}>Deposit Bonus Structure</h3>
            <ul className={s.bonusList}>
              {bonusOptions
                .filter(
                  (opt) => !usedBonuses.some((bonusId) => bonusId === opt._id)
                )
                .map((opt, idx) => (
                  <li
                    key={idx}
                    className={s.bonusListItem}
                    style={{ color: theme.textColor }}
                  >
                    <label style={{ color: theme.textColor }}>
                      <input
                        type="radio"
                        name="bonus"
                        checked={selectedBonus?._id === opt._id}
                        onChange={() => {
                          setSelectedBonus({
                            _id: opt._id,
                            percent: opt.percent,
                          });
                          setAmount(String(opt.min));
                          setShowBonusPopup(false);
                        }}
                      />
                      Deposit: <b style={{ color: theme.accent }}>${opt.min}</b>{" "}
                      – Bonus:{" "}
                      <b style={{ color: theme.accent }}>{opt.percent}%</b>
                    </label>
                  </li>
                ))}
            </ul>
            <button
              className={s.closeBonusBtn}
              onClick={() => setShowBonusPopup(false)}
              style={{ background: theme.button, color: theme.buttonText }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {showMethodPopup && (
        <div className={s.popupOverlay}>
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
              Choose a Deposit Method
            </div>
            <div className={s.popupMsg} style={{ color: theme.textColor }}>
              Please use <b style={{ color: "#28a745" }}>USD Tether (TRC-20)</b>
              , <b style={{ color: "#28a745" }}>USD Tether (ERC-20)</b>, or{" "}
              <b style={{ color: "#28a745" }}>BNB Smart Chain</b> to deposit.
              <br /> We are currently working on other methods.
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

      {showTxIdPopup && (
        <div className={s.popupOverlay}>
          <div
            className={s.popupBox}
            style={{ background: theme.box, color: theme.textColor }}
          >
            <div className={s.popupIcon}>
              <span
                role="img"
                aria-label="info"
                style={{ fontSize: "2.5rem", color: theme.warning }}
              >
                ⚠️
              </span>
            </div>
            <div className={s.popupTitle} style={{ color: theme.textColor }}>
              Transaction ID Required
            </div>
            <div className={s.popupMsg} style={{ color: theme.textColor }}>
              Please enter your Transaction ID (TxID) before submitting your
              deposit.
              <br />
              This helps us verify your payment quickly and securely.
            </div>
            <button
              className={s.closePopupBtn}
              onClick={() => setShowTxIdPopup(false)}
              style={{ background: theme.button, color: theme.buttonText }}
            >
              OK
            </button>
          </div>
        </div>
      )}
      <ToastContainer position="top-center" autoClose={2000} />
    </div>
  );
};

export default DepositPage;
