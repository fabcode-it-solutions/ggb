"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { authService } from "@/services/auth.service";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/hooks/useToast";
import {
  resetPasswordSchema,
  type ResetPasswordInput,
} from "@/lib/validations/auth.schema";
import { Lock, CheckCircle, AlertCircle } from "lucide-react";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const token = searchParams.get("token");

  const [formData, setFormData] = useState<ResetPasswordInput>({
    token: token || "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof ResetPasswordInput, string>>
  >({});
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [tokenError, setTokenError] = useState("");

  // Check if token exists
  useEffect(() => {
    if (!token) {
      setTokenError("Invalid or missing reset token");
    }
  }, [token]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof ResetPasswordInput]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      setTokenError("Invalid or missing reset token");
      return;
    }

    setErrors({});
    setIsLoading(true);

    // Validate with Zod
    const validation = resetPasswordSchema.safeParse(formData);

    if (!validation.success) {
      const fieldErrors: Partial<Record<keyof ResetPasswordInput, string>> = {};
      validation.error.issues.forEach((error) => {
        const field = error.path[0] as keyof ResetPasswordInput;
        fieldErrors[field] = error.message;
      });
      console.log(fieldErrors);
      setErrors(fieldErrors);
      setIsLoading(false);
      return;
    }

    try {
      await authService.resetPassword({ token, password: formData.password });
      setSuccess(true);
      showToast(
        "Success",
        "Your password has been reset successfully",
        "success"
      );

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.error ||
        "Failed to reset password. The link may have expired.";
      showToast("Error", errorMessage, "error");
      setErrors({ password: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  // Success state
  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="w-full max-w-md space-y-8 px-4 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center border border-border bg-black">
            <CheckCircle className="h-6 w-6 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-bold">Password Reset Successful</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Your password has been successfully reset. You will be redirected to
            the login page in a few seconds.
          </p>
          <Button onClick={() => router.push("/login")} className="w-full">
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  // Invalid token state
  if (!token || tokenError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="w-full max-w-md space-y-8 px-4 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center border border-border bg-black">
            <AlertCircle className="h-6 w-6 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-bold">Invalid Reset Link</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            This password reset link is invalid or has expired. Please request a
            new password reset link.
          </p>
          <div className="space-y-3">
            <Button
              onClick={() => router.push("/forgot-password")}
              className="w-full"
            >
              Request New Link
            </Button>
            <Link href="/login">
              <Button variant="ghost" className="w-full">
                Back to Login
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Reset password form
  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="w-full max-w-md space-y-8 px-4">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center border border-border bg-black">
            <Lock className="h-6 w-6 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-bold">Reset Your Password</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter your new password below
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <Input
            label="New Password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            error={errors.password}
            placeholder="Enter new password"
            required
            disabled={isLoading}
          />
          <p className="text-xs text-muted-foreground -mt-4">
            Must be at least 8 characters
          </p>

          <Input
            label="Confirm Password"
            name="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={handleChange}
            error={errors.confirmPassword}
            placeholder="Confirm new password"
            required
            disabled={isLoading}
          />

          <div className="space-y-3">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Resetting Password..." : "Reset Password"}
            </Button>

            <Link href="/login">
              <Button variant="ghost" className="w-full">
                Back to Login
              </Button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-black">Loading...</div>
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
