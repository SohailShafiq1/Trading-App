import React, { useState, Suspense, lazy } from "react";
import styles from "./App.module.css";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./Context/AuthContext";
import BinaryChart from "./Pages/BinaryChart/BinaryChart";
import BinaryLayout from "./Layout/BinaryLayout/BinaryLayout";
import ForexTradingChart from "./Pages/BinaryChart/ForexTradingChart";
import LiveCandleChart from "./Pages/BinaryChart/LiveCandleChart";
import ProtectedRoute from "./Route/ProtectedRoute/ProtectedRoute";
import { UserAssetsProvider } from "./Context/UserAssetsContext";
import AffiliateProtectedRoute from "./Route/ProtectedRoute/AffiliateProtectedRoute";
import { AffiliateAuthProvider } from "./Context/AffiliateAuthContext";
import { AccountTypeProvider } from "./Context/AccountTypeContext";
import AdminProtectedRoute from "./Route/ProtectedRoute/AdminProtectedRoute";
import { ThemeProvider } from "./Context/ThemeContext";
import LoadingSpinner from "./components/LoadingSpinner/LoadingSpinner";

// Lazy load components
const HomePage = lazy(() => import("./Pages/HomePage/HomePage"));
const RegisterLayout = lazy(() => import("./Layout/RegisterLayout/RegisterLayout"));
const RegisterPage = lazy(() => import("./Pages/RegisterPage/RegisterPage"));
const LoginPage = lazy(() => import("./Pages/LoginPage/LoginPage"));
const Profile = lazy(() => import("./Pages/BinaryChart/components/Profile/Profile"));
const BankingLayout = lazy(() => import("./Layout/BankingLayout/BankingLayout"));
const DepositPage = lazy(() => import("./Pages/DepositPage/DepositPage"));
const WithdrawPage = lazy(() => import("./Pages/WithdrawPage/WithdrawPage"));
const TransactionsPage = lazy(() => import("./Pages/TransactionPage/TransactionPage"));
const AffiliateProgram = lazy(() => import("./Pages/AffiliateProgram/AffiliateProgram"));
const PrizePool = lazy(() => import("./Pages/Prize Pool/PrizePool"));
const WithdrawAffiliate = lazy(() => import("./Pages/AffiliateProgram/components/WithdrawPage/WithdrawPage"));
const AdminLayout = lazy(() => import("./Admin/AdminLayout"));
const Coins = lazy(() => import("./Admin/components/Coins/Coins"));
const User = lazy(() => import("./Admin/components/User/User"));
const Withdraw = lazy(() => import("./Admin/components/Withdraw/Withdraw"));
const Deposit = lazy(() => import("./Admin/components/Deposits/Deposit"));
const AffiliateLayout = lazy(() => import("./Layout/AffiliateLayout/AffiliateLayout"));
const AffiliateLogin = lazy(() => import("./Pages/AffiliateLogin/AffiliateLogin"));
const AffiliateRegister = lazy(() => import("./Pages/AffiliateRegister/AffiliateRegister"));
const Bonuses = lazy(() => import("./Admin/components/Bonuses/Bonuses"));
const AdminHome = lazy(() => import("./Admin/components/Home/AdminHome"));
const Affiliate = lazy(() => import("./Admin/components/Affiliate/Affiliate"));
const Trades = lazy(() => import("./Admin/components/Trades/Trades"));
const News = lazy(() => import("./Admin/components/News/News"));
const SupportCentre = lazy(() => import("./Admin/components/SupportCentre/SupportCentre"));
const UserTrade = lazy(() => import("./Admin/components/UserTrade/UserTrade"));
const Support = lazy(() => import("./Pages/Support/Support"));
const Leaderboard = lazy(() => import("./Admin/components/LeaderPage/LeaderPage"));
const Content = lazy(() => import("./Admin/components/Contents/Content"));
const Amount = lazy(() => import("./Admin/AdminPaymentInfo"));
const Admin = lazy(() => import("./Admin/components/Admins/Admins"));
const ForgotPasswordPage = lazy(() => import("./Pages/ForgotPasswordPage/ForgotPasswordPage"));

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
                  <Suspense fallback={<LoadingSpinner />}>
                    <Routes>
                      <Route path="/" element={<RegisterLayout />}>
                        <Route index element={<HomePage />} />
                        <Route path="/register" element={<RegisterPage />} />
                        <Route path="/login" element={<LoginPage />} />
                        <Route
                          path="/forgot-password"
                          element={<ForgotPasswordPage />}
                        />
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
                            <Suspense fallback={<LoadingSpinner />}>
                              <Profile />
                            </Suspense>
                          }
                        />
                        <Route
                          path="/binarychart/support"
                          element={
                            <Suspense fallback={<LoadingSpinner />}>
                              <Support />
                            </Suspense>
                          }
                        />
                        <Route
                          path="/binarychart/bankinglayout"
                          element={
                            <Suspense fallback={<LoadingSpinner />}>
                              <BankingLayout />
                            </Suspense>
                          }
                        >
                          <Route
                            path="/binarychart/bankinglayout/deposit"
                            element={
                              <Suspense fallback={<LoadingSpinner />}>
                                <DepositPage />
                              </Suspense>
                            }
                          />
                          <Route
                            path="/binarychart/bankinglayout/withdraw"
                            element={
                              <Suspense fallback={<LoadingSpinner />}>
                                <WithdrawPage />
                              </Suspense>
                            }
                          />
                          <Route
                            path="/binarychart/bankinglayout/transactions"
                            element={
                              <Suspense fallback={<LoadingSpinner />}>
                                <TransactionsPage />
                              </Suspense>
                            }
                          />
                        </Route>
                      </Route>

                      <Route
                        path="/admin"
                        element={
                          <AdminProtectedRoute>
                            <Suspense fallback={<LoadingSpinner />}>
                              <AdminLayout />
                            </Suspense>
                          </AdminProtectedRoute>
                        }
                      >
                        <Route 
                          index 
                          element={
                            <Suspense fallback={<LoadingSpinner />}>
                              <AdminHome />
                            </Suspense>
                          } 
                        />
                        <Route 
                          path="/admin/coins" 
                          element={
                            <Suspense fallback={<LoadingSpinner />}>
                              <Coins />
                            </Suspense>
                          } 
                        />
                        <Route 
                          path="/admin/user" 
                          element={
                            <Suspense fallback={<LoadingSpinner />}>
                              <User />
                            </Suspense>
                          } 
                        />
                        <Route 
                          path="/admin/deposits" 
                          element={
                            <Suspense fallback={<LoadingSpinner />}>
                              <Deposit />
                            </Suspense>
                          } 
                        />
                        <Route 
                          path="/admin/withdraw" 
                          element={
                            <Suspense fallback={<LoadingSpinner />}>
                              <Withdraw />
                            </Suspense>
                          } 
                        />
                        <Route 
                          path="/admin/bonuses" 
                          element={
                            <Suspense fallback={<LoadingSpinner />}>
                              <Bonuses />
                            </Suspense>
                          } 
                        />
                        <Route 
                          path="/admin/affiliate" 
                          element={
                            <Suspense fallback={<LoadingSpinner />}>
                              <Affiliate />
                            </Suspense>
                          } 
                        />
                        <Route 
                          path="/admin/trades" 
                          element={
                            <Suspense fallback={<LoadingSpinner />}>
                              <Trades />
                            </Suspense>
                          } 
                        />
                        <Route 
                          path="/admin/news" 
                          element={
                            <Suspense fallback={<LoadingSpinner />}>
                              <News />
                            </Suspense>
                          } 
                        />
                        <Route
                          path="/admin/support"
                          element={
                            <Suspense fallback={<LoadingSpinner />}>
                              <SupportCentre />
                            </Suspense>
                          }
                        />
                        <Route 
                          path="/admin/usertrade" 
                          element={
                            <Suspense fallback={<LoadingSpinner />}>
                              <UserTrade />
                            </Suspense>
                          } 
                        />
                        <Route
                          path="/admin/leaderboard"
                          element={
                            <Suspense fallback={<LoadingSpinner />}>
                              <Leaderboard />
                            </Suspense>
                          }
                        />
                        <Route 
                          path="/admin/content" 
                          element={
                            <Suspense fallback={<LoadingSpinner />}>
                              <Content />
                            </Suspense>
                          } 
                        />
                        <Route 
                          path="/admin/amount" 
                          element={
                            <Suspense fallback={<LoadingSpinner />}>
                              <Amount />
                            </Suspense>
                          } 
                        />
                        <Route 
                          path="/admin/admins" 
                          element={
                            <Suspense fallback={<LoadingSpinner />}>
                              <Admin />
                            </Suspense>
                          } 
                        />
                      </Route>

                      <Route
                        path="/affiliate"
                        element={
                          <ProtectedRoute>
                            <Suspense fallback={<LoadingSpinner />}>
                              <AffiliateLayout />
                            </Suspense>
                          </ProtectedRoute>
                        }
                      >
                        <Route 
                          path="login" 
                          element={
                            <Suspense fallback={<LoadingSpinner />}>
                              <AffiliateLogin />
                            </Suspense>
                          } 
                        />
                        <Route 
                          path="register" 
                          element={
                            <Suspense fallback={<LoadingSpinner />}>
                              <AffiliateRegister />
                            </Suspense>
                          } 
                        />
                        <Route
                          index
                          element={
                            <AffiliateProtectedRoute>
                              <Suspense fallback={<LoadingSpinner />}>
                                <AffiliateProgram />
                              </Suspense>
                            </AffiliateProtectedRoute>
                          }
                        />
                        <Route
                          path="prizepool"
                          element={
                            <AffiliateProtectedRoute>
                              <Suspense fallback={<LoadingSpinner />}>
                                <PrizePool />
                              </Suspense>
                            </AffiliateProtectedRoute>
                          }
                        />
                        <Route
                          path="withdraw"
                          element={
                            <AffiliateProtectedRoute>
                              <Suspense fallback={<LoadingSpinner />}>
                                <WithdrawAffiliate />
                              </Suspense>
                            </AffiliateProtectedRoute>
                          }
                        />
                      </Route>
                    </Routes>
                  </Suspense>
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
