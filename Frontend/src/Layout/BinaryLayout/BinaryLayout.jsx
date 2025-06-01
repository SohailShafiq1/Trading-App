import { RiArrowDropDownLine } from "react-icons/ri";
import {
  AiFillTrophy,
  AiOutlineArrowDown,
  AiOutlinePlus,
  AiFillCrown,
  AiOutlineEdit,
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
  const [showSwitchPopup, setShowSwitchPopup] = useState(false);
  const [switchPopupMsg, setSwitchPopupMsg] = useState("");
  const { user, logout } = useAuth();
  const { logoutAffiliate } = useAffiliateAuth();
  const { userAssets } = useUserAssets();
  const { isDemo, setIsDemo, demo_assets, setDemo_assets } = useAccountType();
  const assets = typeof userAssets === "number" ? userAssets : 0;
  const bonus = typeof user?.totalBonus === "number" ? user.totalBonus : 0;
  const totalBalance = (assets + bonus).toFixed(2);

  const navigate = useNavigate();

  const [popupVisible, setPopupVisible] = useState(false);
  const popupRef = useRef();

  const [accountPopupVisible, setAccountPopupVisible] = useState(false);
  const accountRef = useRef();

  const [mobileMorePopup, setMobileMorePopup] = useState(false);
  const [mobileAccountPopup, setMobileAccountPopup] = useState(false);

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
            <div>
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
              {!isDemo ? (
                <div className={s.liveAccountFlex}>
                  <div className={s.crownBox}>
                    <AiFillCrown
                      style={{
                        color: assets > 5000 ? "#FFA800" : "#404040", // Gold or Silver
                        fontSize: "2em",
                        verticalAlign: "middle",
                      }}
                    />
                  </div>
                  <div className={s.liveInfoBox}>
                    <div className={s.liveRow}>
                      <span className={s.liveLabel}>LIVE ACCOUNT</span>
                      <RiArrowDropDownLine
                        style={{ fontSize: "1.5em", marginLeft: 8 }}
                      />
                    </div>
                    <div className={s.liveBalance}>
                      $
                      {Number(totalBalance).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className={s.liveAccountFlex}>
                  <div className={s.crownBox}>
                    <AiOutlineEdit
                      style={{
                        color: "#666",
                        fontSize: "2em",
                        verticalAlign: "middle",
                      }}
                    />
                  </div>
                  <div className={s.liveInfoBox}>
                    <div className={s.liveRow}>
                      <span className={s.liveLabel}>DEMO ACCOUNT</span>
                      <RiArrowDropDownLine
                        style={{ fontSize: "1.5em", marginLeft: 8 }}
                      />
                    </div>
                    <div className={s.liveBalance}>
                      $
                      {demo_assets.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {accountPopupVisible && (
              <div className={s.accountPopup}>
                <div className={s.accountSection}>
                  <div
                    className={`${s.accountItem} ${!isDemo ? s.active : ""}`}
                    onClick={() => {
                      setIsDemo(false);
                      setAccountPopupVisible(false);
                      setSwitchPopupMsg("Switched to Live Account");
                      setShowSwitchPopup(true);
                      setTimeout(() => setShowSwitchPopup(false), 1800);
                    }}
                  >
                    <div className={s.radioCircle}>
                      {!isDemo && <span className={s.radioCheck}>✔</span>}
                    </div>
                    <div className={s.accountText}>
                      <p className={s.label}>LIVE ACCOUNT</p>
                      <p className={s.amount}>${totalBalance}</p>
                    </div>
                  </div>

                  <div
                    className={`${s.accountItem} ${isDemo ? s.active : ""}`}
                    onClick={() => {
                      setIsDemo(true);
                      setAccountPopupVisible(false);
                      setSwitchPopupMsg("Switched to Demo Account");
                      setShowSwitchPopup(true);
                      setTimeout(() => setShowSwitchPopup(false), 1800);
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
            <div>
              <NavLink
                className={s.withdraw}
                to={"/binarychart/bankinglayout/withdraw"}
              >
                Withdraw
              </NavLink>
            </div>
            <div>
              <NavLink
                className={s.deposit}
                style={{ color: "white" }}
                to={"/binarychart/bankinglayout/deposit"}
              >
                Deposit
                <AiOutlinePlus />
              </NavLink>
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: "5rem" }}>
        <Outlet />
      </div>

      {/* Mobile Footer */}
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
          <div
            className={s.footBtn}
            onClick={() => setMobileAccountPopup(true)}
          >
            {isDemo ? (
              <div className={s.demoAccount}>
                <p>
                  Demo{" "}
                  <AiOutlineArrowDown
                    style={{ position: "relative", top: "4px" }}
                  />{" "}
                </p>
              </div>
            ) : (
              <div className={s.liveAccount}>
                <p>
                  <AiFillCrown
                    style={{
                      color: "#FFA800",
                      fontSize: "1.3em",
                      verticalAlign: "middle",
                      marginRight: 4,
                    }}
                  />
                  Live{" "}
                  <AiOutlineArrowDown
                    style={{ position: "relative", top: "4px" }}
                  />{" "}
                </p>
              </div>
            )}
          </div>
          <div className={s.footBtn} onClick={() => setMobileMorePopup(true)}>
            <CgMoreAlt className={s.icons} />
          </div>
        </div>
      </div>

      {/* Mobile More Popup */}
      {mobileMorePopup && (
        <div className={s.mobilePopup}>
          <div className={s.mobilePopupContent}>
            <div className={s.mobilePopupHeader}>
              <h3>More Options</h3>
              <button
                className={s.mobilePopupClose}
                onClick={() => setMobileMorePopup(false)}
              >
                ×
              </button>
            </div>
            <div className={s.mobilePopupItems}>
              <div
                className={s.mobilePopupItem}
                onClick={() => {
                  navigate("/support");
                  setMobileMorePopup(false);
                }}
              >
                Support
              </div>
              <div
                className={s.mobilePopupItem}
                onClick={() => {
                  setShowLeaderboard(true);
                  setMobileMorePopup(false);
                }}
              >
                Leaderboard
              </div>
              <div
                className={s.mobilePopupItem}
                onClick={() => {
                  navigate("/affiliate");
                  setMobileMorePopup(false);
                }}
              >
                Affiliate Program
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Account Popup */}
      {mobileAccountPopup && (
        <div className={s.mobilePopup}>
          <div className={s.mobilePopupContent}>
            <div className={s.mobilePopupHeader}>
              <h3>Account</h3>
              <button
                className={s.mobilePopupClose}
                onClick={() => setMobileAccountPopup(false)}
              >
                ×
              </button>
            </div>
            <div className={s.mobileAccountSection}>
              <div
                className={`${s.mobileAccountItem} ${
                  !isDemo ? s.mobileActive : ""
                }`}
                onClick={() => {
                  setIsDemo(false);
                  setMobileAccountPopup(false);
                  setSwitchPopupMsg("Switched to Live Account");
                  setShowSwitchPopup(true);
                  setTimeout(() => setShowSwitchPopup(false), 1800);
                }}
              >
                <div className={s.mobileRadioCircle}>
                  {!isDemo && <span className={s.mobileRadioCheck}>✔</span>}
                </div>
                <div className={s.mobileAccountText}>
                  <p className={s.mobileLabel}>LIVE ACCOUNT</p>
                  <p className={s.mobileAmount}>${assets}</p>
                </div>
              </div>

              <div
                className={`${s.mobileAccountItem} ${
                  isDemo ? s.mobileActive : ""
                }`}
                onClick={() => {
                  setIsDemo(true);
                  setMobileAccountPopup(false);
                  setSwitchPopupMsg("Switched to Demo Account");
                  setShowSwitchPopup(true);
                  setTimeout(() => setShowSwitchPopup(false), 1800);
                }}
              >
                <div className={s.mobileRadioCircle}>
                  {isDemo && <span className={s.mobileRadioCheck}>✔</span>}
                </div>
                <div className={s.mobileAccountText}>
                  <p className={s.mobileLabel}>DEMO ACCOUNT</p>
                  <p className={s.mobileAmount}>
                    ${demo_assets.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
            <div className={s.mobileMenuSection}>
              <div
                onClick={() => {
                  navigate("/binarychart/bankinglayout/deposit");
                  setMobileAccountPopup(false);
                }}
                className={s.mobileMenuItem}
              >
                Deposit
              </div>
              <div
                onClick={() => {
                  navigate("/binarychart/bankinglayout/withdraw");
                  setMobileAccountPopup(false);
                }}
                className={s.mobileMenuItem}
              >
                Withdrawal
              </div>
              <div
                onClick={() => {
                  navigate("/binarychart/bankinglayout/transactions");
                  setMobileAccountPopup(false);
                }}
                className={s.mobileMenuItem}
              >
                Transactions
              </div>
              <div
                onClick={() => {
                  navigate("/binarychart/profile");
                  setMobileAccountPopup(false);
                }}
                className={s.mobileMenuItem}
              >
                Account
              </div>
              <div
                onClick={() => {
                  logout();
                  logoutAffiliate();
                  setMobileAccountPopup(false);
                }}
                className={`${s.mobileMenuItem} ${s.mobileLogout}`}
              >
                Logout
              </div>
            </div>
          </div>
        </div>
      )}

      {showLeaderboard && (
        <LeaderboardPopup onClose={() => setShowLeaderboard(false)} />
      )}

      {showSwitchPopup && (
        <div className={s.switchPopupOverlay}>
          <div className={s.switchPopupBox}>{switchPopupMsg}</div>
        </div>
      )}
    </>
  );
};

export default BinaryLayout;
