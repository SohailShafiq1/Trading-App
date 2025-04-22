import React, { useState, useEffect } from 'react';
import styles from './TransactionPage.module.css';
const s= styles;

const TransactionPage = () => {
  return (
    <>
      <div className={s.container} style={{ color: "white" }}>
        Transaction
      </div>
    </>
  );
};

export default TransactionPage;