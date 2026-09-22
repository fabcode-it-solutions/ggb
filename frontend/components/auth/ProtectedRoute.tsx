"use client";

import { useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Loading } from "@/components/ui/Loading";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: "ADMIN" | "WAREHOUSE";
}

export function ProtectedRoute({
  children,
  requiredRole,
}: ProtectedRouteProps) {
  const router = useRouter();
  const { user, isLoading, isAuthenticated } = useAuth();
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (requiredRole && user) {
      const hasRole = user.userRoles?.some(
        (ur) => ur?.role?.type === requiredRole
      );
      if (!hasRole) {
        router.push("/dashboard");
      }
    }
  }, [user, requiredRole, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loading />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (requiredRole && user) {
    const hasRole = user.userRoles?.some(
      (ur) => ur?.role?.type === requiredRole
    );
    if (!hasRole) {
      return null;
    }
  }

  return <>{children}</>;
}
