"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
} from "@/components/ui/Modal";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { authService } from "@/services/auth.service";
import {
  updateProfileSchema,
  changePasswordSchema,
  type UpdateProfileInput,
  type ChangePasswordInput,
} from "@/lib/validations/auth.schema";
import { User, Lock } from "lucide-react";

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [profileData, setProfileData] = useState<UpdateProfileInput>({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
  });
  const [profileErrors, setProfileErrors] = useState<
    Partial<Record<keyof UpdateProfileInput, string>>
  >({});

  const [passwordData, setPasswordData] = useState<ChangePasswordInput>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordErrors, setPasswordErrors] = useState<
    Partial<Record<keyof ChangePasswordInput, string>>
  >({});

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
    if (profileErrors[name as keyof UpdateProfileInput]) {
      setProfileErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
    if (passwordErrors[name as keyof ChangePasswordInput]) {
      setPasswordErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileErrors({});
    setIsLoading(true);

    const validation = updateProfileSchema.safeParse(profileData);

    if (!validation.success) {
      const fieldErrors: Partial<Record<keyof UpdateProfileInput, string>> = {};
      validation.error.issues.forEach((error) => {
        const field = error.path[0] as keyof UpdateProfileInput;
        fieldErrors[field] = error.message;
      });
      setProfileErrors(fieldErrors);
      setIsLoading(false);
      return;
    }

    try {
      const response = await authService.updateProfile(profileData);
      if (response.success && response.data) {
        updateUser(response.data.data);
        showToast("Success", "Profile updated successfully", "success");
        setIsEditingProfile(false);
      }
    } catch (error: any) {
      if (error.response.data.error) {
        showToast(
          "Error",
          error.response.data.error || "Failed to create product",
          "error"
        );
      } else {
        showToast(
          "Error",
          error.message || "Failed to update profile",
          "error"
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordErrors({});
    setIsLoading(true);

    const validation = changePasswordSchema.safeParse(passwordData);

    if (!validation.success) {
      const fieldErrors: Partial<Record<keyof ChangePasswordInput, string>> =
        {};
      validation.error.issues.forEach((error) => {
        const field = error.path[0] as keyof ChangePasswordInput;
        fieldErrors[field] = error.message;
      });
      setPasswordErrors(fieldErrors);
      setIsLoading(false);
      return;
    }

    try {
      const data = await authService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      console.log(data);
      showToast("Success", "Password changed successfully", "success");
      setIsChangingPassword(false);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error: any) {
      if (error.response.data.error) {
        showToast(
          "Error",
          error.response.data.error || "Failed to create product",
          "error"
        );
      } else {
        showToast(
          "Error",
          error.message || "Failed to create product",
          "error"
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Profile</h1>
            <p className="text-muted-foreground">
              Manage your account settings
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium">First Name</p>
                  <p className="text-sm text-muted-foreground">
                    {user?.firstName}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Last Name</p>
                  <p className="text-sm text-muted-foreground">
                    {user?.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Status</p>
                  <p className="text-sm text-muted-foreground">
                    {user?.isActive ? "Active" : "Inactive"}
                  </p>
                </div>
                <Button
                  onClick={() => setIsEditingProfile(true)}
                  className="w-full"
                >
                  Edit Profile
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Security
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium">Password</p>
                  <p className="text-sm text-muted-foreground">••••••••</p>
                </div>
                <Button
                  onClick={() => setIsChangingPassword(true)}
                  variant="outline"
                  className="w-full"
                >
                  Change Password
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Edit Profile Modal */}
        <Modal open={isEditingProfile} onOpenChange={setIsEditingProfile}>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>Edit Profile</ModalTitle>
              <ModalDescription>
                Update your personal information
              </ModalDescription>
            </ModalHeader>
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <Input
                label="First Name"
                name="firstName"
                value={profileData.firstName}
                onChange={handleProfileChange}
                error={profileErrors.firstName}
                required
              />
              <Input
                label="Last Name"
                name="lastName"
                value={profileData.lastName}
                onChange={handleProfileChange}
                error={profileErrors.lastName}
                required
              />
              <ModalFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditingProfile(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Saving..." : "Save Changes"}
                </Button>
              </ModalFooter>
            </form>
          </ModalContent>
        </Modal>

        {/* Change Password Modal */}
        <Modal open={isChangingPassword} onOpenChange={setIsChangingPassword}>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>Change Password</ModalTitle>
              <ModalDescription>
                Enter your current password and choose a new one
              </ModalDescription>
            </ModalHeader>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <Input
                label="Current Password"
                name="currentPassword"
                type="password"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                error={passwordErrors.currentPassword}
                required
              />
              <Input
                label="New Password"
                name="newPassword"
                type="password"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                error={passwordErrors.newPassword}
                required
              />
              <Input
                label="Confirm New Password"
                name="confirmPassword"
                type="password"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                error={passwordErrors.confirmPassword}
                required
              />
              <ModalFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsChangingPassword(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Changing..." : "Change Password"}
                </Button>
              </ModalFooter>
            </form>
          </ModalContent>
        </Modal>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
