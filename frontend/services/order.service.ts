// services/order.service.ts
import { apiClient } from "@/lib/api-client";
import type { ApiResponse, PaginationMeta } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────

export type OrderStatus = "PENDING" | "PROCESSING" | "FULFILLED" | "CANCELLED";

export interface ShippingAddress {
  address1: string;
  address2?: string;
  city: string;
  province: string;
  zip: string;
  country: string;
}

export interface Order {
  id: string;
  orderNo: string;
  sku: string;
  quantity: number;
  lineItems: OrderLineItem[];
  customerName: string;
  customerEmail: string;
  shippingAddress: ShippingAddress;
  orderTags: string[];
  shopifyOrderId: string | null;
  shopifyOrderName: string | null;
  shopifySyncError: string | null;
  notes: string | null;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

export interface OrderStats {
  total: number;
  pending: number;
  released: number;
  unreleased: number;
  syncError: number;
}

export type ReleasedFilter = "released" | "unreleased" | "error" | "";

export interface OrderFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: OrderStatus | "all" | "";
  sku?: string;
  startDate?: string;
  endDate?: string;
  released?: ReleasedFilter;
}

export interface OrderLineItem {
  sku: string;
  quantity: number;
  price?: string;
  ggbNumber?: number | null;
  dealerNumber?: number | null;
  wipCount?: number | null;
  buildCount?: number | null;
  inventoryCount?: number | null;
}

export interface CreateOrderPayload {
  orderNo: string;
  lineItems: OrderLineItem[];
  customerName: string;
  customerEmail: string;
  shippingAddress: ShippingAddress;
  orderTags: string[];
  notes?: string;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const orderService = {
  async createOrder(
    payload: CreateOrderPayload,
  ): Promise<ApiResponse<Order>> {
    return apiClient.post(`/orders`, payload);
  },

  async getOrders(
    filters: OrderFilters,
  ): Promise<ApiResponse<{ data: Order[]; pagination: PaginationMeta }>> {
    const params = new URLSearchParams();
    if (filters.page) params.append("page", String(filters.page));
    if (filters.limit) params.append("limit", String(filters.limit));
    if (filters.search) params.append("search", filters.search);
    if (filters.status && filters.status !== "all")
      params.append("status", filters.status);
    if (filters.sku) params.append("sku", filters.sku);
    if (filters.startDate) params.append("startDate", filters.startDate);
    if (filters.endDate) params.append("endDate", filters.endDate);
    if (filters.released) params.append("released", filters.released);

    return apiClient.get(`/orders?${params.toString()}`);
  },

  async getOrderById(id: string): Promise<ApiResponse<Order>> {
    return apiClient.get(`/orders/${id}`);
  },

  async getOrderStats(): Promise<ApiResponse<OrderStats>> {
    return apiClient.get("/orders/stats");
  },

  async updateOrderStatus(
    id: string,
    status: OrderStatus,
  ): Promise<ApiResponse<Order>> {
    return apiClient.patch(`/orders/${id}/status`, { status });
  },

  async deleteOrder(id: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.delete(`/orders/${id}`);
  },

  async releaseOrder(
    id: string,
  ): Promise<ApiResponse<{ shopifyOrderId?: string; shopifyOrderName?: string; alreadyReleased?: boolean }>> {
    return apiClient.post(`/orders/${id}/release`);
  },

  async bulkRelease(
    ids: string[],
  ): Promise<ApiResponse<{ released: number; failed: number }>> {
    return apiClient.post(`/orders/bulk-release`, { ids });
  },
};
