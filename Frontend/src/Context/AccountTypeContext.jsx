// src/Context/AccountTypeContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";

const AccountTypeContext = createContext();

export const AccountTypeProvider = ({ children }) => {
  const [isDemo, setIsDemo] = useState(false); // default to Live
  const [demo_assets, setDemo_assets] = useState(10000);

  // On mount: read from localStorage
  useEffect(() => {
    const storedMode = localStorage.getItem("isDemo");
    if (storedMode === "true") {
      setIsDemo(true);
    }
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    localStorage.setItem("isDemo", isDemo.toString());
  }, [isDemo]);

  return (
    <AccountTypeContext.Provider
      value={{ isDemo, setIsDemo, demo_assets, setDemo_assets }}
    >
      {children}
    </AccountTypeContext.Provider>
  );
};

export const useAccountType = () => useContext(AccountTypeContext);
