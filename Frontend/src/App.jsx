import React, { useState, useEffect } from "react";
import styles from "./App.module.css";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import HomePage from "./Pages/HomePage/HomePage";
import RegisterLayout from "./Layout/RegisterLayout/RegisterLayout";
import RegisterPage from "./Pages/RegisterPage/RegisterPage";
import LoginPage from "./Pages/LoginPage/LoginPage";
import { AuthProvider } from "./Context/AuthContext";
import BinaryChart from "./Pages/BinaryChart/BinaryChart";
import BinaryLayout from "./Layout/BinaryLayout/BinaryLayout";
import Profile from "./Pages/BinaryChart/components/Profile/Profile";
import BankingLayout from "./Layout/BankingLayout/BankingLayout";
import DepositPage from "./Pages/DepositPage/DepositPage";
import WithdrawPage from "./Pages/WithdrawPage/WithdrawPage";
import TransactionsPage from "./Pages/TransactionPage/TransactionPage";

const s = styles;

const App = () => {
  return (
    <>
      <div className={s.container}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<RegisterLayout />}>
              <Route index element={<HomePage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/login" element={<LoginPage />} />
            </Route>

            <Route path="/binarychart" element={<BinaryLayout />}>
              <Route index element={<BinaryChart />} />
              <Route path="/binarychart/profile" element={<Profile />} />
              <Route
                path="/binarychart/bankinglayout"
                element={<BankingLayout />}
              >
                <Route
                  path="/binarychart/bankinglayout/deposit"
                  element={<DepositPage />}
                />
                <Route
                  path="/binarychart/bankinglayout/withdraw"
                  element={<WithdrawPage />}
                />
                <Route
                  path="/binarychart/bankinglayout/transactions"
                  element={<TransactionsPage />}
                />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </div>
    </>
  );
};

export default App;
