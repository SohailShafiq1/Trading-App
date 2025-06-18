import React, { useState, useEffect } from "react";
import styles from "./DepositPage.module.css";
import { BsCurrencyBitcoin } from "react-icons/bs";
import { AiFillBank } from "react-icons/ai";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useAuth } from "../../Context/AuthContext";
import { useAccountType } from "../../Context/AccountTypeContext";

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
  { name: "Bitcoin(BTC)", icon: bitcoin },
  { name: "Ethereum(ETH)", icon: ethereum },
  { name: "USD Tether(TRC-20)", icon: TRC20 },
  { name: "Litecoin(LTC)", icon: ltc },
  { name: "USD Tether(ERC-20)", icon: ERC20 },
  { name: "Solana", icon: solana },
  { name: "USD Tether(BEP-20)", icon: BEP20 },
  { name: "Ripple", icon: ripple },
  { name: "DogeCoin", icon: dogecoin },
  { name: "USD Coin(Polygon)", icon: USDpolygon },
  { name: "Uniswap(UNI)", icon: uniswap },
  { name: "Polygon(MATIC)", icon: polygon },
];

const supportedCoins = ["USD Tether(TRC-20)"];

const DepositPage = () => {
  const { user } = useAuth();
  const { isDemo } = useAccountType(); // Get account type
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

  const [bonusOptions, setBonusOptions] = useState([]);

  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_BACKEND_URL}/api/bonuses`)
      .then((res) => setBonusOptions(res.data));
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
      coin.name === "USD Tether(BEP-20)"
    ) {
      fetchBonuses();
      setShowModal(true);
      setSelectedBonus(null); // Reset bonus selection each time modal opens
    } else {
      toast.info(
        "We are working on this deposit method. Please use USDT for now."
      );
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
      toast.success("Deposit request submitted successfully!");
    } catch (err) {
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
    if (currencyName === "USD Tether(BEP-20)") {
      return { address: ADMIN_WALLET_BNB, qr: bnbImg, label: "BEP-20" };
    }
    return { address: "", qr: "", label: "" };
  };

  return (
    <div className={s.container}>
      <div className={s.rightSide}>
        <div className={s.title}>
          <BsCurrencyBitcoin className={s.iconTitle} />
          <span className={s.text}>Cryptocurrencies</span>
        </div>

        <div className={s.box}>
          {CurrencyArray.map((currency, index) => (
            <div
              className={s.currency}
              key={index}
              onClick={() => handleCoinClick(currency)}
            >
              <div className={s.imageBox}>
                <img
                  src={currency.icon}
                  alt={currency.name}
                  className={s.image}
                />
              </div>
              <p>{currency.name}</p>
            </div>
          ))}
        </div>

        <div className={s.constraint}>
          <AiFillBank className={s.icon} />
          <span className={s.text}>Minimum deposit amount:</span>
          <span className={s.span}> $10 </span>
        </div>
      </div>

      {showModal && (
        <div className={s.modalOverlay}>
          <div className={s.modal}>
            <button
              className={s.closeButton}
              onClick={() => {
                setShowModal(false);
                setShowContinue(false);
                setAmount("");
                setMessage("");
              }}
            >
              ✕
            </button>
            <h2>{selected} Deposit</h2>

            {!showContinue ? (
              <>
                <div className={s.instructions}>
                  <p>
                    <strong>📌 Instructions:</strong>
                  </p>
                  <ol>
                    <li>
                      Go to your crypto wallet (Trust Wallet, Binance, etc.)
                    </li>
                    <li>
                      Select <strong>USDT (TRC-20)</strong>
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
                >
                  <input
                    type="number"
                    placeholder="Amount"
                    value={amount}
                    onChange={(e) => {
                      setAmount(e.target.value);
                      // If user edits, unlock and unselect bonus
                      if (amountLocked) {
                        setSelectedBonus(null);
                        setAmountLocked(false);
                      }
                    }}
                    onClick={() => {
                      if (amountLocked) {
                        setSelectedBonus(null);
                        setAmountLocked(false);
                        setAmount(""); // Reset amount to zero/empty
                      }
                    }}
                    min="10"
                    required
                    disabled={isDemo || !isVerified}
                    readOnly={amountLocked}
                  />

                  {/* Bonus options listed below Amount input */}
                  <div className={s.bonusOptions}>
                    <label
                      style={{
                        fontWeight: 500,
                        marginBottom: 4,
                        display: "block",
                      }}
                    >
                      Select Deposit Bonus:
                    </label>
                    {bonusOptions
                      .filter(
                        (opt) =>
                          !usedBonuses.some((bonusId) => bonusId === opt._id)
                      ) // Filter by ID
                      .map((opt, idx) => (
                        <label key={idx} className={s.bonusRadioLabel}>
                          <input
                            type="radio"
                            name="bonus"
                            value={opt._id} // Now using _id instead of percent
                            checked={selectedBonus?._id === opt._id}
                            onChange={() => {
                              setSelectedBonus({
                                _id: opt._id,
                                percent: opt.percent,
                              });
                              setAmount(String(opt.min));
                              setAmountLocked(true);
                            }}
                            disabled={isDemo || !isVerified}
                          />
                          Deposit: <b>${opt.min}</b> – Bonus:{" "}
                          <b>{opt.percent}%</b>
                        </label>
                      ))}
                    {/* Optionally show a message if all bonuses are used */}
                    {bonusOptions.filter(
                      (opt) => !usedBonuses.includes(opt.percent)
                    ).length === 0 && (
                      <div
                        style={{
                          color: "#888",
                          fontSize: "0.95em",
                        }}
                      >
                        You have already used all available deposit bonuses.
                      </div>
                    )}
                  </div>

                  <button type="submit" disabled={isDemo || !isVerified}>
                    Continue
                  </button>

                  {message && <p className={s.message}>{message}</p>}
                  {isDemo && (
                    <p className={s.errorMessage}>
                      You cannot deposit with a demo account. Please switch to a
                      Live account.
                    </p>
                  )}
                  {!isVerified && (
                    <p className={s.errorMessage}>
                      Please verify your account to make deposits.
                    </p>
                  )}
                </form>
                {amountLocked && (
                  <p
                    className={s.note}
                    style={{ color: "#888", fontSize: "0.95em" }}
                  >
                    Amount is set by your bonus selection. Edit amount to remove
                    bonus.
                  </p>
                )}
              </>
            ) : (
              <>
                <div className={s.instructions}>
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
                          <strong>Send to Wallet ({wallet.label}):</strong>
                        </p>
                        <div className={s.walletRow}>
                          <code className={s.walletCode}>{wallet.address}</code>
                          <button
                            type="button"
                            className={s.copyButton}
                            onClick={() => {
                              navigator.clipboard.writeText(wallet.address);
                              toast.success("Wallet address copied!");
                            }}
                          >
                            Copy
                          </button>
                        </div>
                      </>
                    );
                  })()}
                  <p>
                    After sending, click <b>Submit</b> to finish your deposit
                    request.
                  </p>
                </div>
                <button
                  className={s.submitButton}
                  onClick={async () => {
                    try {
                      const res = await axios.post(
                        `${import.meta.env.VITE_BACKEND_URL}/api/users/deposit`,
                        {
                          email,
                          amount,
                          txId: "",
                          fromAddress: "",
                          bonusPercent: selectedBonus?.percent,
                          bonusId: selectedBonus?._id,
                        }
                      );
                      setMessage(res.data.message);
                      setAmount("");
                      setShowModal(false);
                      setShowContinue(false);
                      toast.success("Deposit request submitted successfully!");
                    } catch (err) {
                      setMessage("Deposit failed. Try again.");
                      toast.error("Deposit failed. Please try again.");
                    }
                  }}
                  disabled={isDemo || !isVerified}
                >
                  Submit
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {showBonusPopup && (
        <div className={s.bonusModalOverlay}>
          <div className={s.bonusModal}>
            <h3>Deposit Bonus Structure</h3>
            <ul className={s.bonusList}>
              {bonusOptions
                .filter(
                  (opt) => !usedBonuses.some((bonusId) => bonusId === opt._id)
                )
                .map((opt, idx) => (
                  <li key={idx} className={s.bonusListItem}>
                    <label>
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
                      Deposit: <b>${opt.min}</b> – Bonus: <b>{opt.percent}%</b>
                    </label>
                  </li>
                ))}
            </ul>
            <button
              className={s.closeBonusBtn}
              onClick={() => setShowBonusPopup(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
      <ToastContainer position="top-center" autoClose={2000} />
    </div>
  );
};

export default DepositPage;
