import { Navigate } from "react-router-dom";
import { useAffiliateAuth } from "../../Context/AffiliateAuthContext";
import { useAuth } from "../../Context/AuthContext";

const AffiliateProtectedRoute = ({ children }) => {
  const { affiliate } = useAffiliateAuth();
  const { user, loading } = useAuth();
  if (loading) return null;
  // Check if the user is logged in
  if (!user) {
    return <Navigate to="/login" />;
  }
  if (!affiliate) {
    return <Navigate to="/affiliate/login" />;
  }

  return children;
};

export default AffiliateProtectedRoute;
