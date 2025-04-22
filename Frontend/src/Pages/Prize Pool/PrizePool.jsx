import React, { useState, useEffect } from "react";
import styles from "./PrizePool.module.css";
const s = styles;

const PrizeArray = [
  {
    id: 1,
    prize: "100$",
  },
  {
    id: 2,
    prize: "300$",
  },
  {
    id: 3,
    prize: "500$",
  },
  {
    id: 4,
    prize: "1000$",
  },
  {
    id: 5,
    prize: "5000$",
  },
  {
    id: 6,
    prize: "15,000$",
  },
  {
    id: 7,
    prize: "30,000$",
  },
  {
    id: 8,
    prize: "50,000$",
  },
  {
    id: 9,
    prize: "80,000$",
  },
  {
    id: 10,
    prize: "10,000$",
  },
];

const PrizePool = () => {
  return (
    <>
      <div className={s.container}>
        <div className={s.prizePool}>
          <div className={s.box}>
            <h1>Prize Pool</h1>
            <p>
              Hit all three targets to claim your reward. You can choose to take
              the prize or recieve a cash alternative.
            </p>
            <div className={s.prizes}>
              {PrizeArray.map((item) => (
                <div key={item.id} className={s.prize}>
                  <h2 className={s.id}>{item.id}</h2>
                  <h2 className={s.name}>{item.prize}</h2>
                  <button className={s.button}>Claim</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PrizePool;
