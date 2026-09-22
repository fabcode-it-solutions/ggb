import { apiClient } from "@/lib/api-client";
import { ApiResponse, Log, LogType, PaginationMeta } from "@/types";

export interface LogFilters {
  page?: number;
  limit?: number;
  search?: string;
  type?: LogType;
  userId?: string;
  startDate?: string;
  endDate?: string;
}

export const logService = {
  async getLogs(
    filters: LogFilters
  ): Promise<ApiResponse<{ data: Log[]; pagination: PaginationMeta }>> {
    const params = new URLSearchParams();

    if (filters.page) params.append("page", filters.page.toString());
    if (filters.limit) params.append("limit", filters.limit.toString());
    if (filters.search) params.append("search", filters.search);
    if (filters.type) params.append("type", filters.type);
    if (filters.userId) params.append("userId", filters.userId);
    if (filters.startDate) params.append("startDate", filters.startDate);
    if (filters.endDate) params.append("endDate", filters.endDate);

    return apiClient.get(`/logs?${params.toString()}`);
  },

  async getLogById(id: string): Promise<ApiResponse<Log>> {
    return apiClient.get(`/logs/${id}`);
  },

  async exportLogs(filters: LogFilters): Promise<Blob> {
    const params = new URLSearchParams();

    if (filters.type) params.append("type", filters.type);
    if (filters.userId) params.append("userId", filters.userId);
    if (filters.startDate) params.append("startDate", filters.startDate);
    if (filters.endDate) params.append("endDate", filters.endDate);

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/logs/export?${params.toString()}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${
            document.cookie.split("auth_token=")[1]?.split(";")[0]
          }`,
        },
      }
    );

    return response.blob();
  },
};
