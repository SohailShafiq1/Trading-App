import { GiPodiumWinner } from "react-icons/gi";
import { AiOutlineBank } from "react-icons/ai";
import { RiArrowDropDownLine } from "react-icons/ri";
import {
  AiFillTrophy,
  AiOutlineArrowDown,
  AiOutlinePlus,
  AiFillCrown,
  AiOutlineEdit,
  AiOutlineClose,
} from "react-icons/ai";
import { CgMoreAlt, CgProfile } from "react-icons/cg";
import { IoMdImage } from "react-icons/io";
import { MdUndo, MdRefresh } from "react-icons/md";
import React, { useState, useRef, useEffect } from "react";
import styles from "./BinaryLayout.module.css";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import logo from "../../../assets/logo.png";
import blacklogo from "../../../assets/WealthXLogoBlack.png";
import { useAuth } from "../../Context/AuthContext";
import { useUserAssets } from "../../Context/UserAssetsContext";
import { useAccountType } from "../../Context/AccountTypeContext";
import { useAffiliateAuth } from "../../Context/AffiliateAuthContext";
import LeaderboardPopup from "./LeaderboardPopup";
import axios from "axios";
import { useTheme } from "../../Context/ThemeContext";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const s = styles;

const BinaryLayout = () => {
  const { theme } = useTheme();
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showSwitchPopup, setShowSwitchPopup] = useState(false);
  const [switchPopupMsg, setSwitchPopupMsg] = useState("");
  const { user, logout } = useAuth();
  const { logoutAffiliate } = useAffiliateAuth();
  const { userAssets } = useUserAssets();
  const { isDemo, setIsDemo, demo_assets, setDemo_assets } = useAccountType();
  const assets = typeof userAssets === "number" ? userAssets : 0;
  const totalBalance = (assets + (user?.totalBonus || 0)).toFixed(2);
  const tip1 = user?.tips?.find((tip) => tip.text === "tip1")?.status;
  const navigate = useNavigate();

  // Function to refresh demo assets
  const refreshDemoAssets = () => {
    setDemo_assets(10000);
    localStorage.setItem("demoAssets", 10000);
    setSwitchPopupMsg("Demo balance reset to $10,000");
  };

  // Tutorial state
  const [showTutorial, setShowTutorial] = useState(tip1);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [isMobileView, setIsMobileView] = useState(false);
  const buttonRefs = useRef([]);
  const mobileButtonRefs = useRef([]);

  // Tips data for desktop
  const desktopTips = [
    {
      id: "back-btn",
      text: "This button shows the leaderboard and top traders",
    },
    {
      id: "trade-btn",
      text: "Click here to access the trading interface",
    },
    {
      id: "profile-btn",
      text: "View and edit your profile information here",
    },
    {
      id: "more-btn",
      text: "Additional options including support and leaderboard",
    },
    {
      id: "account-btn",
      text: "Switch between live and demo accounts, manage funds",
    },
    {
      id: "withdraw-btn",
      text: "Quick access to withdraw funds from your account",
    },
    {
      id: "deposit-btn",
      text: "Quick access to deposit funds into your account",
    },
  ];

  // Tips data for mobile (footer buttons)
  const mobileTips = [
    {
      id: "mobile-back-btn",
      text: "This button takes you back to the previous page",
    },
    {
      id: "mobile-trade-btn",
      text: "Click here to access the trading interface",
    },
    {
      id: "mobile-profile-btn",
      text: "View and edit your profile information here",
    },
    {
      id: "mobile-account-btn",
      text: "See Banking options like deposits and withdrawals",
    },
    {
      id: "mobile-more-btn",
      text: "Additional options including support and leaderboard",
    },
  ];

  const tips = isMobileView ? mobileTips : desktopTips;

  const [popupVisible, setPopupVisible] = useState(false);
  const popupRef = useRef();

  const [accountPopupVisible, setAccountPopupVisible] = useState(false);
  const accountRef = useRef();

  const [mobileMorePopup, setMobileMorePopup] = useState(false);
  const [mobileAccountPopup, setMobileAccountPopup] = useState(false);
  const [mobileAccountPopupVisible, setMobileAccountPopupVisible] =
    useState(false);

  // Check for mobile view
  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth <= 768);
    };

    handleResize(); // Check initial size
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (tip1) {
      setShowTutorial(true);
      buttonRefs.current = buttonRefs.current.slice(0, desktopTips.length);
      mobileButtonRefs.current = mobileButtonRefs.current.slice(
        0,
        mobileTips.length
      );
    }
  }, [tip1]);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        setPopupVisible(false);
      }
      if (accountRef.current && !accountRef.current.contains(e.target)) {
        setAccountPopupVisible(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  const handleNextTip = () => {
    if (currentTipIndex < tips.length - 1) {
      setCurrentTipIndex(currentTipIndex + 1);
    }
  };

  const handlePrevTip = () => {
    if (currentTipIndex > 0) {
      setCurrentTipIndex(currentTipIndex - 1);
    }
  };

  const handleCloseTutorial = async () => {
    setShowTutorial(false);
    try {
      await axios.put(`${BACKEND_URL}/api/users/update-tip/${user._id}`, {
        tipName: "tip1",
      });
    } catch (error) {
      console.error("Failed to update tip status:", error);
    }
  };

  const getButtonPosition = (index) => {
    const refs = isMobileView ? mobileButtonRefs : buttonRefs;

    if (refs.current[index]) {
      const rect = refs.current[index].getBoundingClientRect();
      return {
        top: rect.bottom + window.scrollY + 10,
        left: rect.left + window.scrollX + rect.width / 2,
        buttonWidth: rect.width,
      };
    }
    return { top: 0, left: 0, buttonWidth: 0 };
  };

  const position = getButtonPosition(currentTipIndex);

  const tipIdToIndex = tips.reduce((acc, tip, idx) => {
    acc[tip.id] = idx;
    return acc;
  }, {});

  // Helper: Scroll to and highlight the current tip's button
  useEffect(() => {
    const refs = isMobileView ? mobileButtonRefs : buttonRefs;
    const currentRef = refs.current[currentTipIndex];
    if (currentRef) {
      currentRef.classList.add(s.tutorialHighlight);
      // Remove highlight from all other buttons
      refs.current.forEach((btn, idx) => {
        if (btn && idx !== currentTipIndex) {
          btn.classList.remove(s.tutorialHighlight);
        }
      });
    }
  }, [currentTipIndex, isMobileView]);

  // Calculate tutorial popup position
  let tutorialPopupStyle;
  if (isMobileView) {
    // Try to get the current button's bounding rect for horizontal position
    const refs = mobileButtonRefs.current;
    const currentRef = refs[currentTipIndex];
    let left = "50vw";
    if (currentRef) {
      const rect = currentRef.getBoundingClientRect();
      left = `${rect.left + rect.width / 2}px`;
    }
    tutorialPopupStyle = {
      position: "fixed",
      zIndex: 2000,
      backgroundColor: "#2C2D35",
      color: "white",
      padding: "6px 6px",
      borderRadius: "5px",
      boxShadow: "0 4px 8px rgba(0,0,0,0.3)",
      maxWidth: "140px",
      minWidth: "90px",
      textAlign: "center",
      fontSize: "0.65rem",
      left,
      bottom: "54px",
      transform: "translateX(-50%)",
      pointerEvents: "auto",
    };
  } else {
    tutorialPopupStyle = {
      position: "absolute",
      zIndex: 2000,
      backgroundColor: "#2C2D35",
      color: "white",
      padding: "15px",
      borderRadius: "8px",
      boxShadow: "0 4px 8px rgba(0,0,0,0.3)",
      maxWidth: "300px",
      textAlign: "center",
      width: position.buttonWidth ? `${position.buttonWidth}px` : undefined,
      left: `${position.left}px`,
      top: `${position.top}px`,
      transform: "translateX(-50%)",
      pointerEvents: "auto",
    };
  }

  // Hide footer on mobile keyboard open
  useEffect(() => {
    const hideFooter = () => {
      document.querySelector("#footer")?.classList.add("footer--hidden");
    };
    const showFooter = () => {
      document.querySelector("#footer")?.classList.remove("footer--hidden");
    };
    const onFocusIn = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")
        hideFooter();
    };
    const onFocusOut = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")
        showFooter();
    };
    window.addEventListener("focusin", onFocusIn);
    window.addEventListener("focusout", onFocusOut);
    return () => {
      window.removeEventListener("focusin", onFocusIn);
      window.removeEventListener("focusout", onFocusOut);
    };
  }, []);

  return (
    <>
      <div
        className={s.superContainer}
        style={{
          background: theme.background,
          color: theme.textColor,
          "--theme-popup-bg": theme.popupBg || theme.box,
          "--theme-popup-text": theme.popupText || theme.textColor,
          "--theme-menu-bg": theme.menuBg || theme.box,
          "--theme-menu-item-text": theme.menuText || theme.textColor,
          "--theme-menu-hover-bg": theme.menuHoverBg || theme.hover,
          "--theme-menu-item-hover-bg": theme.menuHoverBg || theme.hover,
          "--theme-logout-color": theme.logoutColor || "#e74c3c",
        }}
      >
        <div
          className={s.container}
          style={{ background: theme.background, color: theme.textColor }}
        >
          <div className={s.logo}>
            <img
              src={theme.name === "Black" ? blacklogo : logo}
              onClick={() => navigate("/binarychart")}
              alt="WealthX Logo"
              style={{
                filter: theme.name === "Black" ? "brightness(2)" : "none",
              }}
            />
          </div>
          <div className={s.accountWrapper} ref={accountRef}>
            <div
              ref={(el) => (buttonRefs.current[4] = el)}
              className={s.liveAccMobile}
              onClick={() => setMobileAccountPopupVisible((v) => !v)}
              style={{
                cursor: "pointer",
                background: theme.box,
                color: theme.textColor,
                borderRadius: 8,
                boxShadow:
                  theme.name === "Black"
                    ? "0 2px 8px #1118"
                    : "0 2px 8px #ccc8",
                padding: 6,
                transition: "background 0.2s, color 0.2s",
              }}
            >
              {!isDemo ? (
                <div className={s.liveAccountFlexMobile}>
                  <div className={s.crownBoxMobile}>
                    <AiFillCrown
                      style={{
                        color: assets > 5000 ? "#FFA800" : "#404040",
                        fontSize: "1rem",
                        verticalAlign: "middle",
                      }}
                    />
                  </div>
                  <div className={s.liveInfoBoxMobile}>
                    <div className={s.liveRowMobile}>
                      <span className={s.liveLabelMobile}>LIVE ACCOUNT</span>
                      <RiArrowDropDownLine
                        style={{ fontSize: "1.5rem", marginLeft: 8 }}
                      />
                    </div>
                    <div className={s.liveBalanceMobile}>
                      $
                      {Number(totalBalance).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className={s.liveAccountFlexMobile}>
                  <div className={s.crownBoxMobile}>
                    <AiOutlineEdit
                      style={{
                        fontSize: "1rem",
                        verticalAlign: "middle",
                      }}
                    />
                  </div>
                  <div className={s.liveInfoBoxMobile}>
                    <div className={s.liveRowMobile}>
                      <span className={s.liveLabelMobile}>DEMO ACCOUNT</span>
                      <RiArrowDropDownLine
                        style={{ fontSize: "1.5rem", marginLeft: 8 }}
                      />
                    </div>
                    <div className={s.liveBalanceMobile}>
                      $
                      {demo_assets.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
            {mobileAccountPopupVisible && (
              <div
                className={s.accountPopupMobile}
                style={{
                  background: theme.box,
                  color: theme.textColor,
                  border: theme.name === "Black" ? "1px solid #333" : undefined,
                  borderRadius: 10,
                  boxShadow:
                    theme.name === "Black"
                      ? "0 4px 16px #1118"
                      : "0 4px 16px #ccc8",
                  padding: 12,
                  transition: "background 0.2s, color 0.2s",
                }}
              >
                <div
                  className={s.accountSectionMobile}
                  style={{ background: theme.box, color: theme.textColor }}
                >
                  <div
                    className={`${s.accountItemMobile} ${
                      !isDemo ? s.activeMobile : ""
                    }`}
                    style={{
                      background: !isDemo
                        ? theme.menuHoverBg || theme.hover
                        : theme.box,
                      color: !isDemo
                        ? theme.menuText || theme.textColor
                        : theme.textColor,
                      border:
                        !isDemo && theme.name === "Black"
                          ? "1px solid #333"
                          : !isDemo
                          ? "1px solid #000"
                          : undefined,
                    }}
                    onClick={() => {
                      setIsDemo(false);
                      setMobileAccountPopupVisible(false);
                      setSwitchPopupMsg("Switched to Live Account");
                      setShowSwitchPopup(true);
                      setTimeout(() => setShowSwitchPopup(false), 1800);
                    }}
                  >
                    <div className={s.radioCircleMobile}>
                      {!isDemo && <span className={s.radioCheckMobile}>✔</span>}
                    </div>
                    <div className={s.accountTextMobile}>
                      <p className={s.labelMobile}>LIVE ACCOUNT</p>
                      <p className={s.amountMobile}>${totalBalance}</p>
                    </div>
                  </div>

                  <div
                    className={`${s.accountItemMobile} ${
                      isDemo ? s.activeMobile : ""
                    }`}
                    style={{
                      background: isDemo
                        ? theme.menuHoverBg || theme.hover
                        : theme.box,
                      color: isDemo
                        ? theme.menuText || theme.textColor
                        : theme.textColor,
                      border:
                        isDemo && theme.name === "Black"
                          ? "1px solid #333"
                          : isDemo
                          ? "1px solid #000"
                          : undefined,
                    }}
                    onClick={() => {
                      setIsDemo(true);
                      setMobileAccountPopupVisible(false);
                      setSwitchPopupMsg("Switched to Demo Account");
                      setShowSwitchPopup(true);
                      setTimeout(() => setShowSwitchPopup(false), 1800);
                    }}
                  >
                    <div className={s.radioCircleMobile}>
                      {isDemo && <span className={s.radioCheckMobile}>✔</span>}
                    </div>
                    <div className={s.accountTextMobile}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <p className={s.labelMobile} style={{ margin: 0 }}>
                          DEMO ACCOUNT
                        </p>
                        <MdRefresh
                          style={{
                            fontSize: "1rem",
                            cursor: "pointer",
                            color: theme.textColor,
                            transition: "transform 0.2s",
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            refreshDemoAssets();
                          }}
                          onMouseEnter={(e) =>
                            (e.target.style.transform = "rotate(180deg)")
                          }
                          onMouseLeave={(e) =>
                            (e.target.style.transform = "rotate(0deg)")
                          }
                          title="Reset demo balance to $10,000"
                        />
                      </div>
                      <p className={s.amountMobile}>
                        ${demo_assets.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className={s.navBar}>
            <div ref={(el) => (buttonRefs.current[1] = el)}>
              <NavLink
                id="trade-btn"
                to="/binarychart"
                className={s.btn}
                style={{ background: theme.box, color: theme.textColor }}
              >
                <IoMdImage className={s.icons} />
                Trade
              </NavLink>
            </div>
            <div ref={(el) => (buttonRefs.current[0] = el)}>
              <div
                className={s.btn}
                id="back-btn"
                style={{ background: theme.box, color: theme.textColor }}
                onClick={() => {
                  setShowLeaderboard(true);
                  setPopupVisible(false);
                }}
              >
                <GiPodiumWinner className={s.icons} />
                Top
              </div>
            </div>
            <div ref={(el) => (buttonRefs.current[2] = el)}>
              <NavLink
                id="profile-btn"
                className={s.btn}
                to="/binarychart/profile"
                style={{ background: theme.box, color: theme.textColor }}
              >
                <CgProfile className={s.icons} />
                Profile
              </NavLink>
            </div>

            <div className={s.moreWrapper} ref={popupRef}>
              <div ref={(el) => (buttonRefs.current[3] = el)}>
                <NavLink
                  id="more-btn"
                  className={s.btn}
                  onClick={() => setPopupVisible((v) => !v)}
                  style={{ background: theme.box, color: theme.textColor }}
                >
                  <CgMoreAlt className={s.icons} />
                  More
                </NavLink>
              </div>

              {popupVisible && (
                <div className={s.popup}>
                  <div
                    className={s.popupItem}
                    onClick={() => {
                      navigate("/binarychart/support");
                      setPopupVisible(false);
                    }}
                  >
                    Support
                  </div>
                  <div
                    className={s.popupItem}
                    onClick={() => {
                      navigate("/binarychart/bankinglayout/deposit");
                      setPopupVisible(false);
                    }}
                  >
                    Deposit
                  </div>
                  <div
                    className={s.popupItem}
                    onClick={() => {
                      navigate("/binarychart/bankinglayout/withdraw");
                      setPopupVisible(false);
                    }}
                  >
                    Withdraw
                  </div>
                  <div
                    className={s.popupItem}
                    onClick={() => {
                      navigate("/binarychart/profile");
                      setPopupVisible(false);
                    }}
                  >
                    Account
                  </div>
                  <div
                    className={s.popupItem}
                    style={{
                      background: "var(--theme-menu-hover-bg, #64B243)",
                      color: "#fff",
                    }}
                    onClick={() => {
                      navigate("/affiliate/login");
                      setPopupVisible(false);
                    }}
                  >
                    Affiliate Program
                  </div>
                </div>
              )}
            </div>

            {/* Account Switch Popup */}
            <div className={s.accountWrapper} ref={accountRef}>
              <div
                ref={(el) => (buttonRefs.current[4] = el)}
                className={s.liveAcc}
                onClick={() => setAccountPopupVisible((v) => !v)}
                style={{
                  cursor: "pointer",
                  background: theme.box,
                  color: theme.textColor,
                }}
              >
                {!isDemo ? (
                  <div className={s.liveAccountFlex}>
                    <div className={s.liveRow}>
                      <div className={s.crownBox}>
                        <AiFillCrown
                          style={{
                            color: assets > 5000 ? "#FFA800" : "#404040",
                            fontSize: "1.5em",
                            verticalAlign: "middle",
                          }}
                        />
                      </div>
                      <span className={s.liveLabel}>LIVE ACCOUNT</span>
                      <div className={s.liveInfoBox}>
                        <RiArrowDropDownLine style={{ fontSize: "1.5em" }} />
                      </div>
                    </div>
                    <div className={s.liveBalance}>
                      $
                      {Number(totalBalance).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </div>
                  </div>
                ) : (
                  <div className={s.liveAccountFlex}>
                    <div className={s.liveRow}>
                      <div className={s.crownBox}>
                        <AiOutlineEdit
                          style={{
                            color: "#666",
                            fontSize: "1.5em",
                            verticalAlign: "middle",
                          }}
                        />
                      </div>
                      <span className={s.liveLabel}>DEMO ACCOUNT</span>
                      <div className={s.liveInfoBox}>
                        <RiArrowDropDownLine
                          style={{ fontSize: "1.5em", marginLeft: 8 }}
                        />
                      </div>
                    </div>
                    <div
                      className={s.liveBalance}
                      style={{ textAlign: "center" }}
                    >
                      $
                      {demo_assets.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </div>
                  </div>
                )}
              </div>

              {accountPopupVisible && (
                <div
                  className={s.accountPopup}
                  style={{ background: theme.box, color: theme.textColor }}
                >
                  <div
                    className={s.accountSection}
                    style={{ background: theme.box, color: theme.textColor }}
                  >
                    <div
                      className={`${s.accountItem} ${!isDemo ? s.active : ""}`}
                      style={{ background: theme.box, color: theme.textColor }}
                      onClick={() => {
                        setIsDemo(false);
                        setAccountPopupVisible(false);
                        setSwitchPopupMsg("Switched to Live Account");
                        setShowSwitchPopup(true);
                        setTimeout(() => setShowSwitchPopup(false), 1800);
                      }}
                    >
                      <div className={s.radioCircle}>
                        {!isDemo && <span className={s.radioCheck}>✔</span>}
                      </div>
                      <div className={s.accountText}>
                        <p className={s.label}>LIVE ACCOUNT</p>
                        <p className={s.amount}>${totalBalance}</p>
                      </div>
                    </div>

                    <div
                      style={{ background: theme.box, color: theme.textColor }}
                      className={`${s.accountItem} ${isDemo ? s.active : ""}`}
                      onClick={() => {
                        setIsDemo(true);
                        setAccountPopupVisible(false);
                        setSwitchPopupMsg("Switched to Demo Account");
                        setShowSwitchPopup(true);
                        setTimeout(() => setShowSwitchPopup(false), 1800);
                      }}
                    >
                      <div className={s.radioCircle}>
                        {isDemo && <span className={s.radioCheck}>✔</span>}
                      </div>
                      <div className={s.accountText}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <p className={s.label} style={{ margin: 0 }}>
                            DEMO ACCOUNT
                          </p>
                          <MdRefresh
                            style={{
                              fontSize: "1rem",
                              cursor: "pointer",
                              color: theme.textColor,
                              transition: "transform 0.2s",
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              refreshDemoAssets();
                            }}
                            onMouseEnter={(e) =>
                              (e.target.style.transform = "rotate(180deg)")
                            }
                            onMouseLeave={(e) =>
                              (e.target.style.transform = "rotate(0deg)")
                            }
                            title="Reset demo balance to $10,000"
                          />
                        </div>
                        <p className={s.amount}>
                          ${demo_assets.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div
                    className={s.menuSection}
                    style={{ background: theme.box, color: theme.textColor }}
                  >
                    <div
                      onClick={() =>
                        navigate("/binarychart/bankinglayout/deposit")
                      }
                      className={s.menuItem}
                    >
                      Deposit
                    </div>
                    <div
                      onClick={() =>
                        navigate("/binarychart/bankinglayout/withdraw")
                      }
                      className={s.menuItem}
                    >
                      Withdrawal
                    </div>
                    <div
                      onClick={() =>
                        navigate("/binarychart/bankinglayout/transactions")
                      }
                      className={s.menuItem}
                    >
                      Transactions
                    </div>
                    <div
                      onClick={() => navigate("/binarychart/profile")}
                      className={s.menuItem}
                    >
                      Account
                    </div>
                    <div
                      onClick={() => {
                        logout();
                        logoutAffiliate();
                      }}
                      className={`${s.menuItem} ${s.logout}`}
                    >
                      Logout
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className={s.asset}>
            <div className={s.bankbtns}>
              <div ref={(el) => (buttonRefs.current[5] = el)}>
                <NavLink
                  id="withdraw-btn"
                  className={s.withdraw}
                  to={"/binarychart/bankinglayout/withdraw"}
                  style={{ background: theme.box, color: theme.textColor }}
                >
                  Withdraw
                </NavLink>
              </div>
              <div ref={(el) => (buttonRefs.current[6] = el)}>
                <NavLink
                  id="deposit-btn"
                  className={s.deposit}
                  style={{ color: "white" }}
                  to={"/binarychart/bankinglayout/deposit"}
                >
                  Deposit
                  <AiOutlinePlus />
                </NavLink>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div>
        <Outlet />
      </div>

      {/* Tutorial Popup */}
      {showTutorial && currentTipIndex < tips.length && (
        <div className={s.tutorialPopup} style={tutorialPopupStyle}>
          <div className={s.tutorialContent}>
            <p>{tips[currentTipIndex].text}</p>
            <div className={s.tutorialControls}>
              {currentTipIndex > 0 && (
                <button onClick={handlePrevTip} className={s.tutorialButton}>
                  Previous
                </button>
              )}
              {currentTipIndex < tips.length - 1 ? (
                <button onClick={handleNextTip} className={s.tutorialButton}>
                  Next
                </button>
              ) : (
                <button
                  onClick={handleCloseTutorial}
                  className={s.tutorialButton}
                >
                  <AiOutlineClose style={{ marginRight: "5px" }} />
                  Close
                </button>
              )}
            </div>
          </div>
          <div className={s.tutorialProgress}>
            {`${currentTipIndex + 1} of ${tips.length}`}
          </div>
        </div>
      )}

      {/* Mobile Footer */}
      <div
        id="footer"
        className={
          s.footer +
          (theme.name ? ` ${s[theme.name.toLowerCase() + "Footer"]}` : "")
        }
        style={{
          background: theme.footerBg || theme.background || undefined,
          color: theme.footerText || theme.textColor || undefined,
          borderTop: theme.footerBorder || undefined,
        }}
        ref={(el) => isMobileView && (mobileButtonRefs.current[0] = el)}
      >
        <div className={s.footBar}>
          <div ref={(el) => isMobileView && (mobileButtonRefs.current[0] = el)}>
            <NavLink
              id="mobile-back-btn"
              className={s.footBtn}
              onClick={() => navigate(-1)}
              style={{ color: theme.footerText || theme.textColor }}
            >
              <MdUndo className={s.icons} />
            </NavLink>
          </div>
          <div ref={(el) => isMobileView && (mobileButtonRefs.current[1] = el)}>
            <NavLink
              id="mobile-trade-btn"
              to="/binarychart"
              className={s.footBtn}
              style={{ color: theme.footerText || theme.textColor }}
            >
              <IoMdImage className={s.icons} />
            </NavLink>
          </div>
          <div ref={(el) => isMobileView && (mobileButtonRefs.current[2] = el)}>
            <NavLink
              id="mobile-profile-btn"
              className={s.footBtn}
              to="/binarychart/profile"
              style={{ color: theme.footerText || theme.textColor }}
            >
              <CgProfile className={s.icons} />
            </NavLink>
          </div>
          <div ref={(el) => isMobileView && (mobileButtonRefs.current[3] = el)}>
            <NavLink
              className={s.footBtn}
              onClick={() => setMobileAccountPopup(true)}
              style={{ color: theme.footerText || theme.textColor }}
            >
              <AiOutlineBank className={s.icons} />
            </NavLink>
          </div>
          <div ref={(el) => isMobileView && (mobileButtonRefs.current[4] = el)}>
            <NavLink
              className={s.footBtn}
              onClick={() => setMobileMorePopup(true)}
              style={{ color: theme.footerText || theme.textColor }}
            >
              <CgMoreAlt className={s.icons} />
            </NavLink>
          </div>
        </div>
      </div>

      {/* Mobile More Popup */}
      {mobileMorePopup && (
        <div className={s.mobilePopup2}>
          <div
            className={s.mobilePopupContent}
            style={{
              background: theme.box,
              color: theme.textColor,
              border: theme.name === "Black" ? "1px solid #333" : undefined,
            }}
          >
            <div className={s.mobilePopupHeader}>
              <h3
                style={{
                  color: theme.menuText || theme.textColor,
                  margin: 0,
                }}
              >
                More Options
              </h3>
              <button
                className={s.mobilePopupClose}
                style={{
                  color: theme.menuText || theme.textColor,
                  background: theme.box,
                  border: theme.name === "Black" ? "1px solid #333" : undefined,
                  borderRadius: 6,
                  fontWeight: 700,
                  fontSize: 22,
                  transition: "background 0.2s, color 0.2s",
                }}
                onClick={() => setMobileMorePopup(false)}
              >
                ×
              </button>
            </div>
            <div
              className={s.mobilePopupItems}
              style={{ color: theme.menuText || theme.textColor }}
            >
              <div
                className={s.mobilePopupItem}
                style={{ color: theme.menuText || theme.textColor }}
                onClick={() => {
                  navigate("/binarychart/support");
                  setMobileMorePopup(false);
                }}
              >
                Support
              </div>
              <div
                className={s.mobilePopupItem}
                style={{ color: theme.menuText || theme.textColor }}
                onClick={() => {
                  setShowLeaderboard(true);
                  setMobileMorePopup(false);
                }}
              >
                Leaderboard
              </div>
              <div
                className={s.mobilePopupItem}
                style={{ color: theme.menuText || theme.textColor }}
                onClick={() => {
                  navigate("/affiliate/login");
                  setMobileMorePopup(false);
                }}
              >
                Affiliate Program
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Account Popup */}
      {mobileAccountPopup && (
        <div className={s.mobilePopup}>
          <div
            className={s.mobilePopupContent}
            style={{
              background: theme.box,
              color: theme.textColor,
              border: theme.name === "Black" ? "1px solid #333" : undefined,
            }}
          >
            <div
              className={s.mobilePopupHeader}
              style={{
                background: theme.menuHoverBg || theme.hover,
                color: theme.menuText || theme.textColor,
                borderBottom: `1px solid ${
                  theme.menuText || theme.textColor
                }22`,
                fontWeight: 600,
                letterSpacing: 0.2,
              }}
            >
              <h3
                style={{ color: theme.menuText || theme.textColor, margin: 0 }}
              >
                Settings
              </h3>
              <button
                className={s.mobilePopupClose}
                style={{
                  color: theme.menuText || theme.textColor,
                  background: theme.box,
                  border: theme.name === "Black" ? "1px solid #333" : undefined,
                  borderRadius: 6,
                  fontWeight: 700,
                  fontSize: 22,
                  transition: "background 0.2s, color 0.2s",
                }}
                onClick={() => setMobileAccountPopup(false)}
              >
                ×
              </button>
            </div>
            <div
              className={s.mobileMenuSection}
              style={{ background: theme.box, color: theme.textColor }}
            >
              <div
                onClick={() => {
                  navigate("/binarychart/bankinglayout/deposit");
                  setMobileAccountPopup(false);
                }}
                className={s.mobileMenuItem}
                style={{ color: theme.menuText || theme.textColor }}
              >
                Deposit
              </div>
              <div
                onClick={() => {
                  navigate("/binarychart/bankinglayout/withdraw");
                  setMobileAccountPopup(false);
                }}
                className={s.mobileMenuItem}
                style={{ color: theme.menuText || theme.textColor }}
              >
                Withdrawal
              </div>
              <div
                onClick={() => {
                  navigate("/binarychart/bankinglayout/transactions");
                  setMobileAccountPopup(false);
                }}
                className={s.mobileMenuItem}
                style={{ color: theme.menuText || theme.textColor }}
              >
                Transactions
              </div>
              <div
                onClick={() => {
                  navigate("/binarychart/profile");
                  setMobileAccountPopup(false);
                }}
                className={s.mobileMenuItem}
                style={{ color: theme.menuText || theme.textColor }}
              >
                Account
              </div>
              <div
                onClick={() => {
                  logout();
                  logoutAffiliate();
                  setMobileAccountPopup(false);
                }}
                className={`${s.mobileMenuItem} ${s.mobileLogout}`}
                style={{ color: theme.logoutColor || "#e74c3c" }}
              >
                Logout
              </div>
            </div>
          </div>
        </div>
      )}

      {showLeaderboard && (
        <LeaderboardPopup onClose={() => setShowLeaderboard(false)} />
      )}

      {showSwitchPopup && (
        <div className={s.switchPopupOverlay}>
          <div className={s.switchPopupBox}>{switchPopupMsg}</div>
        </div>
      )}
    </>
  );
};

export default BinaryLayout;
