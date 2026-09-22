"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/useToast";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { authService } from "@/services/auth.service";
import {
  forgotPasswordSchema,
  type ForgotPasswordInput,
} from "@/lib/validations/auth.schema";
import { Mail, ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [formData, setFormData] = useState<ForgotPasswordInput>({
    email: "",
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof ForgotPasswordInput, string>>
  >({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof ForgotPasswordInput]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    const validation = forgotPasswordSchema.safeParse(formData);

    if (!validation.success) {
      const fieldErrors: Partial<Record<keyof ForgotPasswordInput, string>> =
        {};
      validation.error.issues.forEach((error) => {
        const field = error.path[0] as keyof ForgotPasswordInput;
        fieldErrors[field] = error.message;
      });
      setErrors(fieldErrors);
      setIsLoading(false);
      return;
    }

    try {
      await authService.forgotPassword(formData);
      setIsSubmitted(true);
      showToast(
        "Email sent",
        "Check your email for password reset instructions",
        "success"
      );
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
          error.message || "Failed to send reset email. Please try again.",
          "error"
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="w-full max-w-md space-y-8 px-4 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center border border-border bg-black">
            <Mail className="h-6 w-6 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-bold">Check your email</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            We've sent password reset instructions to{" "}
            <strong>{formData.email}</strong>
          </p>
          <Button
            onClick={() => router.push("/login")}
            variant="outline"
            className="w-full"
          >
            Back to login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="w-full max-w-md space-y-8 px-4">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center border border-border bg-black">
            <Mail className="h-6 w-6 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-bold">Forgot password?</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter your email and we'll send you reset instructions
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <Input
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
            placeholder="Enter your email"
            required
            autoComplete="email"
          />

          <div className="space-y-3">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Sending..." : "Send reset instructions"}
            </Button>

            <Link href="/login">
              <Button variant="ghost" className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to login
              </Button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
