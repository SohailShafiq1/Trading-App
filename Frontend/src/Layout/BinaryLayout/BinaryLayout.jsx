import { AiFillTrophy } from "react-icons/ai";
import { AiOutlinePlus } from "react-icons/ai";
import { CgMoreAlt } from "react-icons/cg";
import { CgProfile } from "react-icons/cg";
import { IoMdImage } from "react-icons/io";
import { MdUndo } from "react-icons/md";
import React, { useState, useRef, useEffect } from "react";
import styles from "./BinaryLayout.module.css";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import logo from "../../../assets/WealthXLogo.png";
import { useAuth } from "../../Context/AuthContext";
import { useUserAssets } from "../../Context/UserAssetsContext";

const s = styles;

const BinaryLayout = () => {
  const { user } = useAuth();
  const { userAssets } = useUserAssets();
  const assets =
    typeof userAssets === "number" ? userAssets.toFixed(2) : "0.00";
  const navigate = useNavigate();

  const [popupVisible, setPopupVisible] = useState(false);
  const popupRef = useRef();

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        setPopupVisible(false);
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
          <img src={logo} alt="WealthX Logo" />
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

          {/* Click-Based Popup More Menu */}
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
                    navigate("/leaderboard");
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

          <NavLink className={s.liveAcc}>
            <p>
              Live account
              <br /> {assets}$
            </p>
          </NavLink>
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
    </>
  );
};

export default BinaryLayout;
