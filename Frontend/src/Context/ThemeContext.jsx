import React, { createContext, useContext, useState, useEffect } from "react";

export const ThemeContext = createContext();

export const THEMES = {
  BLACK: {
    name: "Black",
    background: "black",
    textColor: "white",
    inputBackground: "#181818",
    accent: "#222",
    box: "#1F1F1F",
    settingButton: "#1F1F1F",
    popup: "#1F1F1F",
    tradePopup: "#1F1F1F",
    tabHover: "#181818",
    tabBtnHover: "#222",
    tabBtnHoverColor: "#10A055",
    settingBtnHover: "#222",
    settingBtnHoverColor: "#10A055",
    activeTabBtnHover: "#333",
    activeTabBtnHoverColor: "#10A055",
  },
  WHITE: {
    name: "White",
    background: "#ffffff",
    textColor: "black",
    inputBackground: "#fff",
    accent: "#f5f5f5",
    box: "#f7f7f7",
    settingButton: "#f7f7f7",
    popup: "#e0e0e0",
    tradePopup: "#ffffff",
    tabHover: "#f0f0f0",
    tabBtnHover: "#e0e0e0",
    tabBtnHoverColor: "#10A055",
    settingBtnHover: "#dcdcdc",
    settingBtnHoverColor: "#10A055",
    activeTabBtnHover: "#333",
    activeTabBtnHoverColor: "#10A055",
  },
  GREY: {
    name: "Grey",
    background: "#666666",
    textColor: "black",
    inputBackground: "#888888",
    accent: "#bdbdbd",
    box: "#979797",
    settingButton: "#979797",
    popup: "#979797",
    tradePopup: "#979797",
    tabHover: "#888888",
    tabBtnHover: "#888888",
    tabBtnHoverColor: "#fff",
    settingBtnHover: "#888888",
    settingBtnHoverColor: "#fff",
    activeTabBtnHover: "#333",
    activeTabBtnHoverColor: "#fff",
  },
};

export const ThemeProvider = ({ children }) => {
  // Load theme from localStorage if available
  const getInitialTheme = () => {
    const saved = localStorage.getItem("selectedTheme");
    if (saved && THEMES[saved]) return THEMES[saved];
    return THEMES.WHITE;
  };
  const [theme, setThemeState] = useState(getInitialTheme());

  // Set CSS variables for global theming
  useEffect(() => {
    if (theme) {
      document.body.style.setProperty("--background", theme.background);
      document.body.style.setProperty("--text-color", theme.textColor);
    }
  }, [theme]);

  // Save theme to localStorage on change
  const setTheme = (newTheme) => {
    setThemeState(newTheme);
    if (newTheme && newTheme.name) {
      localStorage.setItem("selectedTheme", newTheme.name.toUpperCase());
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
