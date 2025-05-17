import { Navigate } from "react-router-dom";
import { useAffiliateAuth } from "../../Context/AffiliateAuthContext";

const AffiliateProtectedRoute = ({ children }) => {
  const { affiliate } = useAffiliateAuth();

  if (!affiliate) {
    return <Navigate to="/affiliate/login" />;
  }

  return children;
};

export default AffiliateProtectedRoute;
