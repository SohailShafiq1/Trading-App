import { RiArrowDropDownLine } from "react-icons/ri";
import {
  AiFillTrophy,
  AiOutlineArrowDown,
  AiOutlinePlus,
} from "react-icons/ai";
import { CgMoreAlt, CgProfile } from "react-icons/cg";
import { IoMdImage } from "react-icons/io";
import { MdUndo } from "react-icons/md";
import React, { useState, useRef, useEffect } from "react";
import styles from "./BinaryLayout.module.css";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import logo from "../../../assets/WealthXLogo.png";
import { useAuth } from "../../Context/AuthContext";
import { useUserAssets } from "../../Context/UserAssetsContext";
import { useAccountType } from "../../Context/AccountTypeContext";
import { useAffiliateAuth } from "../../Context/AffiliateAuthContext";
import LeaderboardPopup from "./LeaderboardPopup";

const s = styles;

const BinaryLayout = () => {
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const { user, logout } = useAuth();
  const { logoutAffiliate } = useAffiliateAuth();
  const { userAssets } = useUserAssets();
  const { isDemo, setIsDemo, demo_assets, setDemo_assets } = useAccountType();
  const assets =
    typeof userAssets === "number" ? userAssets.toFixed(2) : "0.00";

  const navigate = useNavigate();

  const [popupVisible, setPopupVisible] = useState(false);
  const popupRef = useRef();

  const [accountPopupVisible, setAccountPopupVisible] = useState(false);
  const accountRef = useRef();

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        setPopupVisible(false);
      }
      if (accountRef.current && !accountRef.current.contains(e.target)) {
        setAccountPopupVisible(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  return (
    <>
      <div className={s.container}>
        <div className={s.logo}>
          <img
            src={logo}
            onClick={() => navigate("/binarychart")}
            alt="WealthX Logo"
          />
        </div>

        <div className={s.navBar}>
          <NavLink
            style={{
              background: `linear-gradient(90deg, #66b544, #1a391d)`,
              color: "white",
            }}
            className={s.btn}
            onClick={() => navigate(-1)}
          >
            <MdUndo className={s.icons} />
            Back
          </NavLink>

          <NavLink to="/binarychart" className={s.btn}>
            <IoMdImage className={s.icons} />
            Trade
          </NavLink>

          <NavLink className={s.btn} to="/binarychart/profile">
            <CgProfile className={s.icons} />
            Profile
          </NavLink>

          {/* More Button Popup */}
          <div className={s.moreWrapper} ref={popupRef}>
            <div className={s.btn}>
              <NavLink
                className={s.btn}
                onClick={() => setPopupVisible((v) => !v)}
              >
                <CgMoreAlt className={s.icons} />
                More
              </NavLink>
            </div>
            {popupVisible && (
              <div className={s.popup}>
                <div
                  className={s.popupItem}
                  style={{ background: "#2C2D35" }}
                  onClick={() => {
                    navigate("/support");
                    setPopupVisible(false);
                  }}
                >
                  Support
                </div>
                <div
                  className={s.popupItem}
                  style={{ background: "#3F474C" }}
                  onClick={() => {
                    setShowLeaderboard(true);
                    setPopupVisible(false);
                  }}
                >
                  Top
                </div>
                <div
                  className={s.popupItem}
                  style={{ background: "#64B243" }}
                  onClick={() => {
                    navigate("/affiliate");
                    setPopupVisible(false);
                  }}
                >
                  Affiliate Program
                </div>
              </div>
            )}
          </div>

          {/* Account Switch Popup */}
          <div className={s.accountWrapper} ref={accountRef}>
            <div
              className={s.liveAcc}
              onClick={() => setAccountPopupVisible((v) => !v)}
              style={{ cursor: "pointer" }}
            >
              <p>
                {isDemo ? "Demo Account" : "Live Account"}
                <br /> ${isDemo ? demo_assets.toLocaleString() : assets}
              </p>
              <div className={s.arrow}>
                <RiArrowDropDownLine style={{ fontSize: "2rem" }} />
              </div>
            </div>

            {accountPopupVisible && (
              <div className={s.accountPopup}>
                <div className={s.accountSection}>
                  <div
                    className={`${s.accountItem} ${!isDemo ? s.active : ""}`}
                    onClick={() => {
                      setIsDemo(false);
                      setAccountPopupVisible(false);
                    }}
                  >
                    <div className={s.radioCircle}>
                      {!isDemo && <span className={s.radioCheck}>✔</span>}
                    </div>
                    <div className={s.accountText}>
                      <p className={s.label}>LIVE ACCOUNT</p>
                      <p className={s.amount}>${assets}</p>
                    </div>
                  </div>

                  <div
                    className={`${s.accountItem} ${isDemo ? s.active : ""}`}
                    onClick={() => {
                      setIsDemo(true);
                      setAccountPopupVisible(false);
                    }}
                  >
                    <div className={s.radioCircle}>
                      {isDemo && <span className={s.radioCheck}>✔</span>}
                    </div>
                    <div className={s.accountText}>
                      <p className={s.label}>DEMO ACCOUNT</p>
                      <p className={s.amount}>
                        ${demo_assets.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className={s.menuSection}>
                  <div
                    onClick={() =>
                      navigate("/binarychart/bankinglayout/deposit")
                    }
                    className={s.menuItem}
                  >
                    Deposit
                  </div>
                  <div
                    onClick={() =>
                      navigate("/binarychart/bankinglayout/withdraw")
                    }
                    className={s.menuItem}
                  >
                    Withdrawal
                  </div>
                  <div
                    onClick={() =>
                      navigate("/binarychart/bankinglayout/transactions")
                    }
                    className={s.menuItem}
                  >
                    Transactions
                  </div>
                  <div
                    onClick={() => navigate("/binarychart/profile")}
                    className={s.menuItem}
                  >
                    Account
                  </div>
                  <div
                    onClick={() => {
                      logout();
                      logoutAffiliate();
                    }}
                    className={`${s.menuItem} ${s.logout}`}
                  >
                    Logout
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className={s.asset}>
          <div className={s.bankbtns}>
            <div className={s.withdraw}>
              <NavLink
                to={"/binarychart/bankinglayout/withdraw"}
                className={s.link}
              >
                Withdraw
              </NavLink>
            </div>
            <div className={s.deposit}>
              <NavLink
                to={"/binarychart/bankinglayout/deposit"}
                className={s.link}
              >
                Deposit
              </NavLink>
              <AiOutlinePlus />
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: "5rem" }}>
        <Outlet />
      </div>

      <div className={s.footer}>
        <div className={s.footBar}>
          <NavLink className={s.footBtn} onClick={() => navigate(-1)}>
            <MdUndo className={s.icons} />
          </NavLink>
          <NavLink to="/binarychart" className={s.footBtn}>
            <IoMdImage className={s.icons} />
          </NavLink>
          <NavLink className={s.footBtn} to="/binarychart/profile">
            <CgProfile className={s.icons} />
          </NavLink>
          <NavLink className={s.footBtn} to="/binarychart">
            <AiFillTrophy className={s.icons} />
          </NavLink>
          <NavLink className={s.footBtn} to="/affiliate">
            <CgMoreAlt className={s.icons} />
          </NavLink>
        </div>
      </div>

      {showLeaderboard && (
        <LeaderboardPopup onClose={() => setShowLeaderboard(false)} />
      )}
    </>
  );
};

export default BinaryLayout;
