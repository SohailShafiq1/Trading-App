import { BiRightArrowCircle } from "react-icons/bi";
import React from "react";
import styles from "./WithdrawPage.module.css";
import { useUserAssets } from "../../Context/UserAssetsContext"; // Import useUserAssets
const s = styles;

const WithdrawPage = () => {
  const { userAssets } = useUserAssets(); // Access userAssets from context

  return (
    <div className={s.container}>
      <div className={s.Box}>
        <div className={s.account}>
          <h3 className={s.sectionTitle}>Account:</h3>
          <div className={s.accountInfo}>
            <p>In the account:</p>
            <p className={s.amount}>{userAssets} $</p>{" "}
           
          </div>
          <hr className={s.divider} />
          <div className={s.accountInfo}>
            <p>Available for withdrawal:</p>
            <p className={s.amount}>{userAssets} $</p>{" "}
    
          </div>
        </div>

        <div className={s.form}>
          <h3 className={s.sectionTitle}>Withdrawal:</h3>

          <div className={s.row}>
            <div className={s.inputGroup}>
              <label>Amount</label>
              <div className={s.inputWithSuffix}>
                <input type="number" placeholder="10" />
                <span className={s.suffix}>USD</span>
              </div>
            </div>

            <div className={s.inputGroup}>
              <label>Payment Method</label>
              <select>
                <option>USD Tether</option>
              </select>
            </div>
          </div>

          <div className={s.inputGroup}>
            <label>Purse</label>
            <input type="text" />
          </div>

          <div className={s.inputGroup}>
            <label>Network</label>
            <select>
              <option>Select Network</option>
            </select>
          </div>

          <button className={s.confirmBtn}>
            Confirm <BiRightArrowCircle className={s.icon} />
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
    </div>
  );
};

export default WithdrawPage;
