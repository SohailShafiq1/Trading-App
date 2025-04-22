import { BsCurrencyBitcoin } from "react-icons/bs";
import { AiFillBank } from "react-icons/ai";
import { BsCreditCardFill } from "react-icons/bs";
import { BsCreditCard2BackFill } from "react-icons/bs";
import React, { useState, useEffect } from "react";
import styles from "./DepositPage.module.css";
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

const CurrencyArray = [
  {
    name: "Bitcoin(BTC)",
    icon: bitcoin,
  },
  {
    name: "Ethereum(ETH)",
    icon: ethereum,
  },
  {
    name: "USD Tether(TRC-20)",
    icon: TRC20,
  },
  {
    name: "Litecoin(LTC)",
    icon: ltc,
  },
  {
    name: "USD Tether(ERC-20)",
    icon: ERC20,
  },
  {
    name: "Solana",
    icon: solana,
  },
  {
    name: "USD Tether(BEP-20)",
    icon: BEP20,
  },
  {
    name: "Ripple",
    icon: ripple,
  },
  {
    name: "DogeCoin",
    icon: dogecoin,
  },
  {
    name: "USD Coin(Polygon)",
    icon: USDpolygon,
  },
  {
    name: "Uniswap(UNI)",
    icon: uniswap,
  },
  {
    name: "Polygon(MATIC)",
    icon: polygon,
  },
];

const DepositPage = () => {
  return (
    <>
      <div className={s.container}>
        <div className={s.rightSide}>
          <div className={s.title}>
            <span>
              <BsCurrencyBitcoin className={s.iconTitle} />
            </span>
            <span className={s.text}>Cryptocurrencies</span>
          </div>
          <div className={s.box}>
            {CurrencyArray.map((currency, index) => {
              return (
                <div className={s.currency} key={index}>
                  <div className={s.imageBox}>
                    <img
                      src={currency.icon}
                      alt={currency.name}
                      className={s.image}
                    />
                  </div>
                  <p>{currency.name}</p>
                </div>
              );
            })}
          </div>
          <div className={s.constraint}>
            <AiFillBank className={s.icon} />
            <span className={s.text}>Minimum deposit amount:</span>
            <span className={s.span}> $10 </span>
          </div>
        </div>
      </div>
    </>
  );
};

export default DepositPage;
