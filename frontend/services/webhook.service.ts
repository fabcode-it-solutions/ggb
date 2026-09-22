import { apiClient } from "@/lib/api-client";
import {
  ApiResponse,
  WebhookTrigger,
  WebhookStatus,
  PaginationMeta,
} from "@/types";

export interface WebhookFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: WebhookStatus;
  orderId?: string;
}

export interface RetriggerWebhookRequest {
  id: string;
}

export const webhookService = {
  async getWebhooks(
    filters: WebhookFilters
  ): Promise<
    ApiResponse<{ data: WebhookTrigger[]; pagination: PaginationMeta }>
  > {
    const params = new URLSearchParams();

    if (filters.page) params.append("page", filters.page.toString());
    if (filters.limit) params.append("limit", filters.limit.toString());
    if (filters.search) params.append("search", filters.search);
    if (filters.status) params.append("status", filters.status);
    if (filters.orderId) params.append("orderId", filters.orderId);

    return apiClient.get(`/webhooks?${params.toString()}`);
  },

  async getWebhookById(
    id: string
  ): Promise<ApiResponse<{ data: WebhookTrigger }>> {
    return apiClient.get(`/webhooks/${id}`);
  },

  async retriggerWebhook(id: string): Promise<ApiResponse<WebhookTrigger>> {
    return apiClient.post(`/webhooks/${id}/retrigger`);
  },

  async retriggerMultipleWebhooks(ids: string[]): Promise<ApiResponse<void>> {
    return apiClient.post("/webhooks/retrigger-multiple", { ids });
  },

  async deleteWebhook(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`/webhooks/${id}`);
  },
};
