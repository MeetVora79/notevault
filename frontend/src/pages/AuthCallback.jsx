import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setAccessToken, setCredentials } from "@/features/auth/authSlice";
import { useLazyGetMeQuery } from "@/features/auth/authApi";
import { toast } from "sonner";

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [getMe] = useLazyGetMeQuery();

  useEffect(() => {
    const token = searchParams.get("token");
    const wasLinked = searchParams.get("linked") === "true";

    if (!token) {
      navigate("/login?error=google_auth_failed");
      return;
    }

    const finishLogin = async () => {
      try {
        // Store access token first
        dispatch(setAccessToken(token));

        // Fetch user profile
        const meResult = await getMe().unwrap();
        dispatch(setCredentials({ user: meResult.user, accessToken: token }));

        // Show notification if Google account was linked to existing account
        if (wasLinked) {
          toast.success(
            "Welcome back! We've linked your Google account to your existing account. You can now sign in using either method."
          );
        }

        navigate("/");
      } catch {
        navigate("/login?error=google_auth_failed");
      }
    };

    finishLogin();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex items-center gap-3 text-muted-foreground">
        <div className="w-5 h-5 border-2 border-brand/30 border-t-brand rounded-full animate-spin" />
        <span className="text-sm">Signing you in...</span>
      </div>
    </div>
  );
}