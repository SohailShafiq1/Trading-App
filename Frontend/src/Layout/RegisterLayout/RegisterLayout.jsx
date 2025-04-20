import React, { useState, useEffect } from "react";
import styles from "./RegisterLayout.module.css";
import WealthXLogo from "../../../assets/WealthXLogo.png";
import { NavLink } from "react-router-dom";
import { Outlet } from "react-router-dom";
const s = styles;

const RegisterLayout = () => {
  return (
    <>
      <div className={s.container}>
        <div className={s.Page}>
          <div className={s.navBar}>
            <div className={s.logoHolder}>
              <NavLink to={"/"}>
                <img src={WealthXLogo} alt="Logo" className={s.logo} />
              </NavLink>
            </div>
            <div className={s.navItems}>
              <div className={s.loginButton}>
                <NavLink to={"/login"}>Login</NavLink>
              </div>
              <div className={s.registerButton}>
                <NavLink to={"/register"}>Register</NavLink>
              </div>
            </div>
          </div>
          <Outlet />
        </div>
      </div>
    </>
  );
};

export default RegisterLayout;
