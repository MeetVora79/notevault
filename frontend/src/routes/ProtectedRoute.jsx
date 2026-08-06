import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const { user, isAuthChecked } = useSelector((state) => state.auth);

  if (!isAuthChecked) return null; // still checking session on load, render nothing/spinner
  if (!user) return <Navigate to="/login" replace />;

  return children;
}