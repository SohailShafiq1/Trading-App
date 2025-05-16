import { AiFillTrophy } from "react-icons/ai";
import { AiOutlinePlus } from "react-icons/ai";
import { CgMoreAlt } from "react-icons/cg";
import { CgProfile } from "react-icons/cg";
import { IoMdImage } from "react-icons/io";
import axios from "axios";
import { MdUndo } from "react-icons/md";
import React, { useState, useEffect } from "react";
import styles from "./BinaryLayout.module.css";
import { Navigate, NavLink, Outlet, useNavigate } from "react-router-dom";
const s = styles;
import logo from "../../../assets/WealthXLogo.png";
import { useAuth } from "../../Context/AuthContext";
import { useUserAssets } from "../../Context/UserAssetsContext";

const BinaryLayout = () => {
  const { user } = useAuth();
  const { userAssets } = useUserAssets(); // Access context

  const navigate = useNavigate();
  return (
    <>
      <div className={s.container}>
        <div className={s.logo}>
          <img src={logo} alt="" />
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
          <NavLink className={s.btn} to="/binarychart/affiliateprogram">
            <CgMoreAlt className={s.icons} />
            More
          </NavLink>
        </div>
        <div className={s.asset}>
          <NavLink className={s.liveAcc}>
            <p>
              Live account
              <br /> {userAssets}$
            </p>
          </NavLink>
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
          <NavLink className={s.footBtn} to="/binarychart/affiliateprogram">
            <CgMoreAlt className={s.icons} />
          </NavLink>
        </div>
      </div>
    </>
  );
};

export default BinaryLayout;
