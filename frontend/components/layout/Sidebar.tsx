"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Users,
  FileText,
  Webhook,
  User,
  LogOut,
  Boxes,
  Shirt,
  Warehouse,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Inventory (SNOW)",
    href: "/inventory/snow",
    icon: Package,
  },
  {
    title: "Inventory (SXS)",
    href: "/inventory/sxs",
    icon: Package,
  },
  {
    title: "Inventory (Apparel)", // ← NEW
    href: "/inventory/apparel",
    icon: Shirt,
  },
  {
    title: "Pre-Season/Pre-Order ",
    href: "/orders",
    icon: Boxes,
  },
  {
    title: "Warehouse",
    href: "/inventory/production",
    icon: Warehouse,
  },
  {
    title: "Roles & Users",
    href: "/roles-users",
    icon: Users,
    adminOnly: true,
  },
  {
    title: "Logs",
    href: "/logs",
    icon: FileText,
    adminOnly: true,
  },
  {
    title: "Webhooks",
    href: "/webhooks",
    icon: Webhook,
    adminOnly: true,
  },
];

export interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const isAdmin = user?.userRoles?.some((ur) => ur?.role?.type === "ADMIN");

  const filteredNavItems = navItems.filter(
    (item) => !item.adminOnly || isAdmin,
  );

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex h-full w-64 flex-col border-r border-border bg-white transition-transform duration-300 ease-in-out md:relative md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center border-b border-border px-6">
          <h1 className="text-xl font-bold">Admin Portal</h1>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.title == "Warehouse" &&
                pathname == "/inventory/production/edit");

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => onClose?.()}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-black text-white"
                    : "text-foreground hover:bg-muted",
                )}
              >
                <Icon className="h-5 w-5" />
                {item.title}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border p-4 space-y-1">
          <Link
            href="/profile"
            onClick={() => onClose?.()}
            className={cn(
              "flex items-center gap-3 px-3 py-2 text-sm font-medium transition-colors",
              pathname === "/profile"
                ? "bg-black text-white"
                : "text-foreground hover:bg-muted",
            )}
          >
            <User className="h-5 w-5" />
            Profile
          </Link>
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            <LogOut className="h-5 w-5" />
            Logout
          </button>
        </div>
      </div>
    </>
  );
}
