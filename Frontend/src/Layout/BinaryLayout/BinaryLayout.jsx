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
          <div style={{ backgroundColor: "#10A055" }}>
            <MdUndo className={s.icons} />
           <NavLink to="/binarychart" className={s.navlink}>
              Back
            </NavLink>
          </div>
          <div>
            <IoMdImage className={s.icons} />
            Trade
          </div>
          <div>
            <CgProfile className={s.icons} />
            <NavLink to="/binarychart/profile" className={s.navlink}>
              Profile
            </NavLink>
          </div>
          <div>
            <CgMoreAlt className={s.icons} />
            More
          </div>
          <div>
            <p>Live account</p>
          </div>
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
