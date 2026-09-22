"use client";

import { useAuth } from "@/hooks/useAuth";
import { User, Menu } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user } = useAuth();

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-white px-4 md:px-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden max-lg:bg-muted"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-lg font-semibold">
            Welcome, {user?.firstName || "User"}
          </h2>
          <p className="text-sm text-muted-foreground hidden sm:block">
            {user?.email}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center border border-border bg-muted">
          <User className="h-5 w-5" />
        </div>
      </div>
    </header>
  );
}
