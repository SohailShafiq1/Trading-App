import React, { useState, useEffect } from 'react';
import styles from './AffiliateProgram.module.css';
const s = styles
import {NavLink} from 'react-router-dom'
const AffiliateProgram = () => {
  return (
<>
    <div className={s.container}>
        <div className={s.top}>
            <div className={s.balance}>
                <p>Your Balance</p>
                <h1>$0.00</h1>
                <Navlink to="/withdrawl">
                    Go to Withdrawal  
                </Navlink>
                <div className={s.earning}></div>
            </div>
            <div className={s.partnerLink}></div>

        </div>
        <div className={s.line}>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
        </div>
    </div>
</>
  );
};

export default AffiliateProgram;