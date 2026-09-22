import { apiClient } from "@/lib/api-client";
import { ApiResponse } from "@/types";

export interface DashboardStats {
  totalProducts: number;
  totalUsers: number;
  activeUsers: number;
  pendingWebhooks: number;
  totalInventoryCount: number;
  lowStockCount: number;
  recentLogsCount: number;
}

export interface InventoryStats {
  snowProducts: number;
  sxsProducts: number;
  totalInventory: number;
  wipCount: number;
}

export interface ActivityLog {
  date: string;
  count: number;
}

export const dashboardService = {
  async getStats(): Promise<ApiResponse<DashboardStats>> {
    return apiClient.get("/dashboard/stats");
  },

  async getInventoryStats(): Promise<ApiResponse<InventoryStats>> {
    return apiClient.get("/dashboard/inventory-stats");
  },

  async getRecentActivity(
    days: number = 7
  ): Promise<ApiResponse<ActivityLog[]>> {
    return apiClient.get(`/dashboard/activity?days=${days}`);
  },
};
