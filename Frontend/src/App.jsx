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
import Coins from "./Admin/components/Coins/Coins"; // adjust path accordingly
import User from "./Admin/components/User/User";
import Withdraw from "./Admin/components/Withdraw/Withdraw";
import Deposit from "./Admin/components/Deposits/Deposit";
import AffiliateLayout from "./Layout/AffiliateLayout/AffiliateLayout";
import AffiliateLogin from "./Pages/AffiliateLogin/AffiliateLogin";
import AffiliateRegister from "./Pages/AffiliateRegister/AffiliateRegister";
import AffiliateProtectedRoute from "./Route/ProtectedRoute/AffiliateProtectedRoute";
import { AffiliateAuthProvider } from "./Context/AffiliateAuthContext";

const s = styles;

const App = () => {
  return (
    <AuthProvider>
      <AffiliateAuthProvider>
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
                <Route
                  path="/coins"
                  element={
                    <ProtectedRoute>
                      <Coins /> {/* Add the new Coins component here */}
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/user"
                  element={
                    <ProtectedRoute>
                      <User />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/deposits"
                  element={
                    <ProtectedRoute>
                      <Deposit />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/withdraw"
                  element={
                    <ProtectedRoute>
                      <Withdraw /> {/* Add the new Withdraw component here */}
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/affiliate"
                  element={
                    <ProtectedRoute>
                      <AffiliateLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route
                    path="/affiliate/login"
                    element={
                      <ProtectedRoute>
                        <AffiliateLogin />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/affiliate/register"
                    element={
                      <ProtectedRoute>
                        <AffiliateRegister />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    index
                    element={
                      <ProtectedRoute>
                        <AffiliateProtectedRoute>
                          <AffiliateProgram />
                        </AffiliateProtectedRoute>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/affiliate/prizepool"
                    element={
                      <ProtectedRoute>
                        <AffiliateProtectedRoute>
                          <PrizePool />
                        </AffiliateProtectedRoute>
                      </ProtectedRoute>
                    }
                  />
                </Route>
              </Routes>
            </BrowserRouter>
          </div>
        </UserAssetsProvider>
      </AffiliateAuthProvider>
    </AuthProvider>
  );
};

export default App;
