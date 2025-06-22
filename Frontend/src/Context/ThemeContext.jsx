import React, { createContext, useContext, useState } from "react";

export const ThemeContext = createContext();

export const THEMES = {
  BLACK: {
    name: "Black",
    background: "#111",
    textColor: "#fff",
    accent: "#222",
  },
  WHITE: {
    name: "White",
    background: "#fff",
    textColor: "#222",
    accent: "#f5f5f5",
  },
  GREY: {
    name: "Grey",
    background: "#e5e5e5",
    textColor: "#222",
    accent: "#bdbdbd",
  },
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(THEMES.WHITE);
  return (
    <ThemeContext.Provider value={{ theme, setTheme, THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
