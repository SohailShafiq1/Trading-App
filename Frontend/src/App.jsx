import React, { useState } from "react";
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
import AffiliateProgram from "./Pages/AffiliateProgram/AffiliateProgram";
import PrizePool from "./Pages/Prize Pool/PrizePool";
import WithdrawAffiliate from "./Pages/AffiliateProgram/components/WithdrawPage/WithdrawPage";
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
import { AccountTypeProvider } from "./Context/AccountTypeContext";
import Bonuses from "./Admin/components/Bonuses/Bonuses";
import AdminProtectedRoute from "./Route/ProtectedRoute/AdminProtectedRoute";
import AdminHome from "./Admin/components/Home/AdminHome";
import Affiliate from "./Admin/components/Affiliate/Affiliate";
import Trades from "./Admin/components/Trades/Trades";
import News from "./Admin/components/News/News";
import SupportCentre from "./Admin/components/SupportCentre/SupportCentre";
import UserTrade from "./Admin/components/UserTrade/UserTrade";
import Support from "./Pages/Support/Support";
import Leaderboard from "./Admin/components/LeaderPage/LeaderPage";
import Content from "./Admin/components/Contents/Content";
import Amount from "./Admin/AdminPaymentInfo";
import Admin from "./Admin/components/Admins/Admins";
import ForgotPasswordPage from "./Pages/ForgotPasswordPage/ForgotPasswordPage";
import { ThemeProvider } from "./Context/ThemeContext";
const s = styles;

const App = () => {
  return (
    <AuthProvider>
      <AffiliateAuthProvider>
        <UserAssetsProvider>
          <AccountTypeProvider>
            <ThemeProvider>
              <div className={s.container}>
                <BrowserRouter>
                  <Routes>
                    <Route path="/" element={<RegisterLayout />}>
                      <Route index element={<HomePage />} />
                      <Route path="/register" element={<RegisterPage />} />
                      <Route path="/login" element={<LoginPage />} />
                      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
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
                        element={<Profile />}
                      />
                      <Route
                        path="/binarychart/support"
                        element={<Support />}
                      />
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

                    <Route
                      path="/admin"
                      element={
                        <AdminProtectedRoute>
                          <AdminLayout />
                        </AdminProtectedRoute>
                      }
                    >
                      <Route index element={<AdminHome />} />
                      <Route path="/admin/coins" element={<Coins />} />
                      <Route path="/admin/user" element={<User />} />
                      <Route path="/admin/deposits" element={<Deposit />} />
                      <Route path="/admin/withdraw" element={<Withdraw />} />
                      <Route path="/admin/withdraw" element={<Withdraw />} />
                      <Route path="/admin/bonuses" element={<Bonuses />} />
                      <Route path="/admin/affiliate" element={<Affiliate />} />
                      <Route path="/admin/trades" element={<Trades />} />
                      <Route path="/admin/news" element={<News />} />
                      <Route
                        path="/admin/support"
                        element={<SupportCentre />}
                      />
                      <Route path="/admin/usertrade" element={<UserTrade />} />
                      <Route
                        path="/admin/leaderboard"
                        element={<Leaderboard />}
                      />
                      <Route path="/admin/content" element={<Content />} />
                      <Route path="/admin/amount" element={<Amount />} />
                      <Route path="/admin/admins" element={<Admin />} />
                    </Route>

                    <Route
                      path="/affiliate"
                      element={
                        <ProtectedRoute>
                          <AffiliateLayout />
                        </ProtectedRoute>
                      }
                    >
                      <Route
                        path="login"
                        element={<AffiliateLogin />}
                      />
                      <Route
                        path="register"
                        element={<AffiliateRegister />}
                      />
                      <Route
                        index
                        element={
                          <AffiliateProtectedRoute>
                            <AffiliateProgram />
                          </AffiliateProtectedRoute>
                        }
                      />
                      <Route
                        path="prizepool"
                        element={
                          <AffiliateProtectedRoute>
                            <PrizePool />
                          </AffiliateProtectedRoute>
                        }
                      />
                      <Route
                        path="withdraw"
                        element={
                          <AffiliateProtectedRoute>
                            <WithdrawAffiliate />
                          </AffiliateProtectedRoute>
                        }
                      />
                    </Route>
                  </Routes>
                </BrowserRouter>
              </div>
            </ThemeProvider>
          </AccountTypeProvider>
        </UserAssetsProvider>
      </AffiliateAuthProvider>
    </AuthProvider>
  );
};

export default App;
