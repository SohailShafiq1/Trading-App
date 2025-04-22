import { AiOutlinePlus } from "react-icons/ai";
import { CgMoreAlt } from "react-icons/cg";
import { CgProfile } from "react-icons/cg";
import { IoMdImage } from "react-icons/io";
import { MdUndo } from "react-icons/md";
import React, { useState, useEffect } from "react";
import styles from "./BinaryLayout.module.css";
import { NavLink, Outlet } from "react-router-dom";
const s = styles;
import logo from "../../../assets/WealthXLogo.png";
const BinaryLayout = () => {
  return (
    <>
      <div className={s.container}>
        <div className={s.logo}>
          <img src={logo} alt="" />
        </div>
        <div className={s.navBar}>
          <NavLink style={{ backgroundColor: "#10A055" }} className={s.btn} >
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
          <NavLink className={s.btn}>
            <CgMoreAlt className={s.icons} />
            More
          </NavLink>
          <NavLink className={s.btn}>
            <p>Live account</p>
          </NavLink>
        </div>
        <div className={s.asset}>
          <div className={s.withdraw}>Withdrawal</div>
          <div className={s.deposit}>
            <p> Deposit</p>
            <AiOutlinePlus />
          </div>
        </div>
      </div>
      <Outlet />
    </>
  );
};

export default BinaryLayout;
