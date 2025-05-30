import { Navigate } from "react-router-dom";
import { useAuth } from "../../Context/AuthContext";

const AdminProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (!user) return <Navigate to="/login" replace />;
  if (user.isAdmin === false) return <Navigate to="/binarychart" replace />;

  return children;
};

export default AdminProtectedRoute;
