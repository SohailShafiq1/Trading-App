import React, { useState } from "react";
import styles from "./DepositPage.module.css";
import { BsCurrencyBitcoin } from "react-icons/bs";
import { AiFillBank } from "react-icons/ai";
import axios from "axios";

import bitcoin from "../../../assets/bitcoin.png";
import ethereum from "../../../assets/ethereum.png";
import ltc from "../../../assets/ltc.png";
import solana from "../../../assets/solana.png";
import ripple from "../../../assets/ripple.png";
import dogecoin from "../../../assets/dogecoin.png";
import uniswap from "../../../assets/uniswap.png";
import polygon from "../../../assets/polygon.png";
import TRC20 from "../../../assets/TRC20.png";
import BEP20 from "../../../assets/BEP20.png";
import ERC20 from "../../../assets/ERC20.png";
import USDpolygon from "../../../assets/USDPolygon.png";

const s = styles;
const ADMIN_WALLET = "TLvdaYm3miaXKspdFrResJpp7tHH2QojGB"; 

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
  const [selected, setSelected] = useState("USD Tether(TRC-20)");
  const [showModal, setShowModal] = useState(false);
  const [amount, setAmount] = useState("");
  const [txId, setTxId] = useState("");
  const [email, setEmail] = useState("");
  const [fromAddress, setFromAddress] = useState("");
  const [message, setMessage] = useState("");

  const handleCoinClick = (coin) => {
    setSelected(coin.name);
    if (supportedCoins.includes(coin.name)) {
      setShowModal(true);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !amount || !fromAddress) {
      setMessage("Email, amount, and TRC20 wallet address are required.");
      return;
    }

    try {
      const res = await axios.post("http://localhost:5000/api/users/deposit", {
        email,
        amount,
        txId,
        fromAddress,
      });
      setMessage(res.data.message);
      setAmount("");
      setTxId("");
      setFromAddress("");
    } catch (err) {
      setMessage("Deposit failed. Try again.");
    }
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
                <img src={currency.icon} alt={currency.name} className={s.image} />
              </div>
              <p>{currency.name}</p>
            </div>
          ))}
        </div>

        <div className={s.constraint}>
          <AiFillBank className={s.icon} />
          <span className={s.text}>Minimum deposit amount:</span>
          <span className={s.span}> $10 </span>
        </div>
      </div>

      {showModal && (
        <div className={s.modalOverlay}>
          <div className={s.modal}>
            <button className={s.closeButton} onClick={() => setShowModal(false)}>
              ✕
            </button>
            <h2>{selected} Deposit</h2>

            <div className={s.instructions}>
              <p><strong>📌 Instructions:</strong></p>
              <ol>
                <li>Go to your crypto wallet (Trust Wallet, Binance, etc.)</li>
                <li>Select <strong>USDT (TRC-20)</strong></li>
                <li>Send the amount to the wallet address below</li>
                <li>After sending, fill and submit this form</li>
              </ol>
            </div>

            <p><strong>Send to Wallet:</strong></p>
            <code>{ADMIN_WALLET}</code>

            <form onSubmit={handleSubmit} className={s.form}>
              <input
                type="email"
                placeholder="Your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <input
                type="text"
                placeholder="Your TRC20 Wallet Address"
                value={fromAddress}
                onChange={(e) => setFromAddress(e.target.value)}
                required
              />
              <input
                type="number"
                placeholder="Amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
              <input
                type="text"
                placeholder="Transaction ID (optional)"
                value={txId}
                onChange={(e) => setTxId(e.target.value)}
              />
              <button type="submit">Submit Deposit</button>
              {message && <p className={s.message}>{message}</p>}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepositPage;
