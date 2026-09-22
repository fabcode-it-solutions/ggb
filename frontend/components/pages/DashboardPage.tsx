"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Loading } from "@/components/ui/Loading";
import {
  dashboardService,
  type DashboardStats,
  type InventoryStats,
} from "@/services/dashboard.service";
import { Package, Users, AlertCircle, FileText } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [inventoryStats, setInventoryStats] = useState<InventoryStats | null>(
    null
  );
    const { user } = useAuth();
  
    const isAdmin = user?.userRoles?.some((ur) => ur?.role?.type === "ADMIN");
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsResponse, inventoryResponse] = await Promise.all([
        dashboardService.getStats(),
        dashboardService.getInventoryStats(),
      ]);

      if (statsResponse.success && statsResponse.data) {
        setStats(statsResponse.data);
      }

      if (inventoryResponse.success && inventoryResponse.data) {
        setInventoryStats(inventoryResponse.data);
      }
    } catch (error: any) {
      showToast("Error", "Failed to load dashboard data", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
              Overview of your inventory and system
            </p>
          </div>

          {isLoading ? (
            <Loading />
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Products
                    </CardTitle>
                    <Package className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {stats?.totalProducts || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {inventoryStats?.totalInventory || 0} in stock
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Users
                    </CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {stats?.totalUsers || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {stats?.activeUsers || 0} active
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">
                      Pending Webhooks
                    </CardTitle>
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {stats?.pendingWebhooks || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Require attention
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">
                      Recent Logs
                    </CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {stats?.recentLogsCount || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Last 24 hours
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Inventory Overview</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">SNOW Products</span>
                      <span className="text-2xl font-bold">
                        {inventoryStats?.snowProducts || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">SXS Products</span>
                      <span className="text-2xl font-bold">
                        {inventoryStats?.sxsProducts || 0}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Link
                      href="/inventory/snow"
                      className="flex items-center justify-between border border-border p-3 hover:bg-muted transition-colors"
                    >
                      <span className="text-sm font-medium">
                        View SNOW Inventory
                      </span>
                      <Package className="h-4 w-4" />
                    </Link>
                    <Link
                      href="/inventory/sxs"
                      className="flex items-center justify-between border border-border p-3 hover:bg-muted transition-colors"
                    >
                      <span className="text-sm font-medium">
                        View SXS Inventory
                      </span>
                      <Package className="h-4 w-4" />
                    </Link>
                    {isAdmin && 
                    <Link
                      href="/logs"
                      className="flex items-center justify-between border border-border p-3 hover:bg-muted transition-colors"
                    >
                      <span className="text-sm font-medium">
                        View System Logs
                      </span>
                      <FileText className="h-4 w-4" />
                    </Link>}
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
