import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Routes, Route } from "react-router-dom";
import { useRefreshMutation } from "@/features/auth/authApi";
import { useLazyGetMeQuery } from "@/features/auth/authApi";
import {
  setAccessToken,
  setCredentials,
  logoutLocal,
} from "@/features/auth/authSlice";
import ProtectedRoute from "@/routes/ProtectedRoute";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Dashboard from "@/pages/Dashboard";
import AuthCallback from "@/pages/AuthCallback";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";

function App() {
  const dispatch = useDispatch();
  const { mode } = useSelector((state) => state.theme);
  const [refresh] = useRefreshMutation();
  const [getMe] = useLazyGetMeQuery();

  const hasBootstrapped = useRef(false);

  // Sync dark mode class onto <html>
  useEffect(() => {
    document.documentElement.classList.toggle("dark", mode === "dark");
  }, [mode]);

  // On app load: restore the full session (token + user) as ONE sequence,
  // before any protected route is allowed to render.
  useEffect(() => {
    if (hasBootstrapped.current) return;
    hasBootstrapped.current = true;
    const bootstrap = async () => {
      try {
        const refreshResult = await refresh().unwrap();
        dispatch(setAccessToken(refreshResult.accessToken)); // token available for getMe's header now
        const meResult = await getMe().unwrap();
        dispatch(
          setCredentials({
            user: meResult.user,
            accessToken: refreshResult.accessToken,
          }),
        ); // marks isAuthChecked true, only once, only when complete
      } catch {
        dispatch(logoutLocal());
      }
    };
    bootstrap();
  }, []);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
