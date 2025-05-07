import React, { useState } from "react";
import styles from "./App.module.css";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import HomePage from "./Pages/HomePage/HomePage";
import RegisterLayout from "./Layout/RegisterLayout/RegisterLayout";
import RegisterPage from "./Pages/RegisterPage/RegisterPage";
import LoginPage from "./Pages/LoginPage/LoginPage";
import { AuthProvider } from "./context/AuthContext";
import BinaryChart from "./Pages/BinaryChart/BinaryChart";
import BinaryLayout from "./Layout/BinaryLayout/BinaryLayout";
import Profile from "./Pages/BinaryChart/components/Profile/Profile";
import BankingLayout from "./Layout/BankingLayout/BankingLayout";
import DepositPage from "./Pages/DepositPage/DepositPage";
import WithdrawPage from "./Pages/WithdrawPage/WithdrawPage";
import TransactionsPage from "./Pages/TransactionPage/TransactionPage";
import AffiliateProgram from "./Pages/AffiliateProgram/AffiliateProgram";
import PrizePool from "./Pages/Prize Pool/PrizePool";
import ProtectedRoute from "./Route/ProtectedRoute/ProtectedRoute";
import AdminLayout from "./Admin/AdminLayout";
import { UserAssetsProvider } from "./Context/UserAssetsContext";
const s = styles;

const App = () => {
  return (
    <AuthProvider>
      <UserAssetsProvider>
        <div className={s.container}>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<RegisterLayout />}>
                <Route index element={<HomePage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/login" element={<LoginPage />} />
              </Route>
              <Route
                path="/binarychart"
                element={
                  <ProtectedRoute>
                    <BinaryLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<BinaryChart />} />
                <Route
                  path="/binarychart/profile"
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/binarychart/affiliateprogram"
                  element={
                    <ProtectedRoute>
                      <AffiliateProgram cash="500" />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/binarychart/prizepool"
                  element={
                    <ProtectedRoute>
                      <PrizePool />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/binarychart/bankinglayout"
                  element={
                    <ProtectedRoute>
                      <BankingLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route
                    path="/binarychart/bankinglayout/deposit"
                    element={
                      <ProtectedRoute>
                        <DepositPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/binarychart/bankinglayout/withdraw"
                    element={
                      <ProtectedRoute>
                        <WithdrawPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/binarychart/bankinglayout/transactions"
                    element={
                      <ProtectedRoute>
                        <TransactionsPage />
                      </ProtectedRoute>
                    }
                  />
                </Route>
              </Route>

              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </BrowserRouter>
        </div>
      </UserAssetsProvider>
    </AuthProvider>
  );
};

export default App;
