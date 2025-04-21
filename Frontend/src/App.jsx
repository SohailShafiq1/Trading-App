import React, { useState, useEffect } from "react";
import styles from "./App.module.css";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import HomePage from "./Pages/HomePage/HomePage";
import RegisterLayout from "./Layout/RegisterLayout/RegisterLayout";
import RegisterPage from "./Pages/RegisterPage/RegisterPage";
import LoginPage from "./Pages/LoginPage/LoginPage";
import { AuthProvider } from "./Context/AuthContext";
const s = styles;
const App = () => {
  return (
    <>
      <AuthProvider>
        <div className={s.container}>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<RegisterLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/login" element={<LoginPage />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </div>
      </AuthProvider>
    </>
  );
};

export default App;
