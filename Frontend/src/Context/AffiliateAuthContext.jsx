import { createContext, useContext, useEffect, useState } from "react";

const AffiliateAuthContext = createContext();

export const AffiliateAuthProvider = ({ children }) => {
  const [affiliate, setAffiliate] = useState(null);

  useEffect(() => {
    const storedAffiliate = localStorage.getItem("affiliate");
    if (storedAffiliate) {
      setAffiliate(JSON.parse(storedAffiliate));
    }
  }, []);

  const login = (data) => {
    localStorage.setItem("affiliate", JSON.stringify(data));
    setAffiliate(data);
  };

  const logout = () => {
    localStorage.removeItem("affiliate");
    setAffiliate(null);
  };

  return (
    <AffiliateAuthContext.Provider value={{ affiliate, login, logout }}>
      {children}
    </AffiliateAuthContext.Provider>
  );
};
export const useAffiliateAuth = () => useContext(AffiliateAuthContext);
