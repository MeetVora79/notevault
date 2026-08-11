import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  useSetPasswordMutation,
  useChangePasswordMutation,
  useUpdateProfileMutation,
} from "@/features/auth/authApi";
import { setCredentials } from "@/features/auth/authSlice";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Check } from "lucide-react";

const AVATAR_COLORS = [
  "#4F46E5",
  "#0F766E",
  "#B45309",
  "#B91C1C",
  "#0369A1",
  "#7C3AED",
  "#059669",
  "#DC2626",
  "#D97706",
  "#2563EB",
  "#9333EA",
  "#DB2777",
];

const setPasswordSchema = z
  .object({
    password: z.string().min(6, "At least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Required"),
    newPassword: z.string().min(6, "At least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

const profileSchema = z.object({
  name: z.string().trim().min(2, "At least 2 characters"),
});

export default function SettingsDialog({ open, onOpenChange }) {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);

  const [selectedColor, setSelectedColor] = useState(user?.avatarColor);
  const [successMessage, setSuccessMessage] = useState("");
  const [serverError, setServerError] = useState("");

  const [setPassword, { isLoading: isSettingPassword }] =
    useSetPasswordMutation();
  const [changePassword, { isLoading: isChangingPassword }] =
    useChangePasswordMutation();
  const [updateProfile, { isLoading: isUpdatingProfile }] =
    useUpdateProfileMutation();

  const profileForm = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name || "" },
  });

  const passwordForm = useForm({
    resolver: zodResolver(
      user?.hasPassword ? changePasswordSchema : setPasswordSchema,
    ),
  });

  const showSuccess = (msg) => {
    setSuccessMessage(msg);
    setServerError("");
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  const handleProfileSubmit = async (data) => {
    try {
      const result = await updateProfile({
        name: data.name,
        avatarColor: selectedColor,
      }).unwrap();
      dispatch(setCredentials({ user: result.user }));
      showSuccess("Profile updated successfully");
    } catch (err) {
      setServerError(err?.data?.message || "Failed to update profile");
    }
  };

  const handlePasswordSubmit = async (data) => {
    try {
      if (user?.hasPassword) {
        await changePassword({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        }).unwrap();
      } else {
        await setPassword({ password: data.password }).unwrap();
      }
      passwordForm.reset();
      showSuccess(
        user?.hasPassword
          ? "Password changed successfully"
          : "Password set — you can now log in with email too",
      );
    } catch (err) {
      setServerError(err?.data?.message || "Failed to update password");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[85vh] flex flex-col overflow-hidden p-0">
        <DialogHeader className="px-6 py-3 border-b border-border shrink-0">
          <DialogTitle className="font-display text-lg">
            Profile & Account
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto px-6 pb-4">
          <div className="space-y-6 py-2">
            {/* Success / Error */}
            {successMessage && (
              <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 dark:bg-green-950/30 dark:text-green-400 border border-green-200 dark:border-green-800 rounded-lg px-4 py-3">
                <Check size={14} />
                {successMessage}
              </div>
            )}
            {serverError && (
              <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3">
                {serverError}
              </div>
            )}

            {/* Profile section */}
            <section className="space-y-4">
              <h3 className="text-sm font-medium font-display">Profile</h3>

              {/* Avatar */}
              <div className="flex items-center gap-4">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-semibold text-ai shrink-0"
                  style={{ backgroundColor: selectedColor }}
                >
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-2">
                    Avatar color
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {AVATAR_COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className="w-5 h-5 rounded-full transition-transform cursor-pointer hover:scale-110 relative shrink-0"
                        style={{ backgroundColor: color }}
                      >
                        {selectedColor === color && (
                          <Check
                            size={10}
                            className="absolute inset-0 m-auto text-white"
                            strokeWidth={3}
                          />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <form
                onSubmit={profileForm.handleSubmit(handleProfileSubmit)}
                className="space-y-3"
              >
                <div className="space-y-1.5">
                  <Label htmlFor="name">Display name</Label>
                  <Input id="name" {...profileForm.register("name")} />
                  {profileForm.formState.errors.name && (
                    <p className="text-xs text-destructive">
                      {profileForm.formState.errors.name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input value={user?.email} disabled className="opacity-60" />
                  <p className="text-xs text-muted-foreground">
                    Email cannot be changed
                  </p>
                </div>

                <Button
                  className="cursor-pointer"
                  type="submit"
                  size="sm"
                  disabled={isUpdatingProfile}
                >
                  {isUpdatingProfile ? "Saving..." : "Save profile"}
                </Button>
              </form>
            </section>

            <Separator />

            {/* Password section */}
            <section className="space-y-3">
              <div>
                <h3 className="text-sm font-medium font-display">
                  {user?.hasPassword ? "Change Password" : "Set Password"}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {user?.hasPassword
                    ? "Update your existing password"
                    : "Add a password to also log in with email"}
                </p>
              </div>

              <form
                onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)}
                className="space-y-3"
              >
                {user?.hasPassword && (
                  <div className="space-y-1.5">
                    <Label htmlFor="currentPassword">Current password</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      {...passwordForm.register("currentPassword")}
                    />
                    {passwordForm.formState.errors.currentPassword && (
                      <p className="text-xs text-destructive">
                        {passwordForm.formState.errors.currentPassword.message}
                      </p>
                    )}
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="password">
                    {user?.hasPassword ? "New password" : "Password"}
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="At least 8 characters"
                    {...passwordForm.register(
                      user?.hasPassword ? "newPassword" : "password",
                    )}
                  />
                  {(passwordForm.formState.errors.newPassword ||
                    passwordForm.formState.errors.password) && (
                    <p className="text-xs text-destructive">
                      {
                        (
                          passwordForm.formState.errors.newPassword ||
                          passwordForm.formState.errors.password
                        )?.message
                      }
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword">Confirm password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    {...passwordForm.register("confirmPassword")}
                  />
                  {passwordForm.formState.errors.confirmPassword && (
                    <p className="text-xs text-destructive">
                      {passwordForm.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                <Button
                  className="cursor-pointer"
                  type="submit"
                  size="sm"
                  disabled={isSettingPassword || isChangingPassword}
                >
                  {isSettingPassword || isChangingPassword
                    ? "Saving..."
                    : user?.hasPassword
                      ? "Change password"
                      : "Set password"}
                </Button>
              </form>
            </section>

            <Separator />

            {/* Account info */}
            <section className="space-y-2">
              <h3 className="text-sm font-medium font-display">Account</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between py-1.5">
                  <span className="text-muted-foreground">Login method</span>
                  <span className="font-medium">
                    {user?.googleId ? "Google" : "Email"}
                    {user?.googleId && user?.hasPassword ? " + Email" : ""}
                  </span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-muted-foreground">Date Joined</span>
                  <span className="font-medium">
                    {new Date(user?.createdAt).toLocaleDateString("en-US", {
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>
            </section>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
