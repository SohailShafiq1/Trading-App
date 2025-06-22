import React, { useState, useEffect } from "react";
import styles from "./RegisterLayout.module.css";
import WealthXLogo from "./logo.png";
import RegisterLayoutBG from "../../../assets/RegisterLayoutBG.jpeg";
import { NavLink } from "react-router-dom";
import { Outlet } from "react-router-dom";
const s = styles;

const RegisterLayout = () => {
  // Add this to prevent horizontal scroll on the whole app
  // You can also add this to your global CSS, but here is a React-safe way
  useEffect(() => {
    const originalOverflow = document.body.style.overflowX;
    document.body.style.overflowX = "hidden";
    return () => {
      document.body.style.overflowX = originalOverflow;
    };
  }, []);

  return (
    <>
      <div className={s.container}>
        {/* Background image visually for reference */}
        <img
          src={RegisterLayoutBG}
          alt="Register Layout Background"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            objectFit: "cover",
            zIndex: -2,
            opacity: 1,
            pointerEvents: "none",
          }}
        />
        {/* White blur overlay */}
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(255,255,255,0.9)",
            backdropFilter: "blur(5px)",
            zIndex: -1,
            pointerEvents: "none",
          }}
        />
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
