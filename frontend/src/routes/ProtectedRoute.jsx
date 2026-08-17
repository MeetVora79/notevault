import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import AppLoadingScreen from "@/components/AppLoadingScreen";

export default function ProtectedRoute({ children }) {
  const { user, isAuthChecked } = useSelector((state) => state.auth);

  if (!isAuthChecked) {
    return <AppLoadingScreen />;
  }

  if (!user) return <Navigate to="/login" replace />;

  return children;
}