import React, { useState, useEffect } from "react";
import styles from "./HomePage.module.css";
import HomeContent from "../../../assets/HomeContect.png";
import { NavLink } from "react-router-dom";
const s = styles;
const HomePage = () => {
  return (
    <>
      <div className={s.homeContainer}>
        <p className={s.homeDescription}>
          Smart and Innovative <br />
          Platform for Investments
        </p>
        <div className={s.homeParagraph}>
          Sign up and get 10,000 USD to your demo account to learn how to trade
        </div>
        <div className={s.homeButton}>
          <NavLink to={"/register"}>Create New Account</NavLink>
        </div>
        <div className={s.homeImage}>
          <img className={s.Image} src={HomeContent} alt="homeImage" />
        </div>
      </div>
    </>
  );
};

export default HomePage;
