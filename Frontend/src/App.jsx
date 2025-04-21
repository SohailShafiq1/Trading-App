import React, { useState, useEffect } from "react";
import styles from "./App.module.css";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import HomePage from "./Pages/HomePage/HomePage";
import RegisterLayout from "./Layout/RegisterLayout/RegisterLayout";
import RegisterPage from "./Pages/RegisterPage/RegisterPage";
import LoginPage from "./Pages/LoginPage/LoginPage";
import BinaryChart from "./Pages/BinaryChart/BinaryChart";
import BinaryLayout from "./Layout/BinaryLayout/BinaryLayout";
import Profile from "./Pages/BinaryChart/components/Profile/Profile";
const s = styles;
const App = () => {
  return (
    <>
      <div className={s.container}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<RegisterLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/login" element={<LoginPage />} />
            </Route>
            <Route path="/binarychart" element={<BinaryLayout />}>
              <Route index element={<BinaryChart />} />
              <Route path="profile" element={<Profile />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </div>
    </>
  );
};

export default App;
