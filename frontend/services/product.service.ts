import { apiClient } from "@/lib/api-client";
import {
  ApiResponse,
  Product,
  InventoryType,
  ProductType,
  PaginationMeta,
  ProductionPlanningItem,
} from "@/types";

export interface ProductFilters {
  page?: number;
  limit?: number;
  search?: string;
  inventoryType?: InventoryType;
  productType?: ProductType | "all";
}

export interface CreateProductRequest {
  inventoryType: InventoryType;
  productType: ProductType | "all";
  sku: string;
  ggbNumber?: number;
  dealerNumber?: number;
  inventoryCount: number;
  wipCount: number;
  buildCount?: number;
  shopifyProductId?: string;
  shopifyOrderId?: string;
}

export interface UpdateProductRequest extends Partial<CreateProductRequest> {
  id: string;
}

export interface ProductionPlanningFilters {
  page?: number;
  limit?: number;
  search?: string;
  inventoryType?: InventoryType | "all";
}

export interface BulkProductionUpdateRequest {
  updates: Array<{
    id: string;
    ggbNumber?: number;
    dealerNumber?: number;
    wipCount?: number;
    buildCount?: number;
  }>;
}

export const productService = {
  async getProducts(
    filters: ProductFilters
  ): Promise<ApiResponse<{ data: Product[]; pagination: PaginationMeta }>> {
    const params = new URLSearchParams();

    if (filters.page) params.append("page", filters.page.toString());
    if (filters.limit) params.append("limit", filters.limit.toString());
    if (filters.search) params.append("search", filters.search);
    if (filters.inventoryType)
      params.append("inventoryType", filters.inventoryType);
    if (filters.productType) params.append("productType", filters.productType);

    return apiClient.get(`/products?${params.toString()}`);
  },

  async getProductById(id: string): Promise<ApiResponse<Product>> {
    return apiClient.get(`/products/${id}`);
  },

  async getProductionPlanning(
    filters: ProductionPlanningFilters,
  ): Promise<
    ApiResponse<{ data: ProductionPlanningItem[]; pagination: PaginationMeta }>
  > {
    const params = new URLSearchParams();

    if (filters.page) params.append("page", filters.page.toString());
    if (filters.limit) params.append("limit", filters.limit.toString());
    if (filters.search) params.append("search", filters.search);
    if (filters.inventoryType) {
      params.append("inventoryType", filters.inventoryType);
    }

    return apiClient.get(`/products/production-planning?${params.toString()}`);
  },

  async createProduct(
    data: CreateProductRequest
  ): Promise<ApiResponse<Product>> {
    return apiClient.post("/products", data);
  },

  async updateProduct(
    data: UpdateProductRequest
  ): Promise<ApiResponse<Product>> {
    const { id, ...updateData } = data;
    return apiClient.put(`/products/${id}`, updateData);
  },

  async deleteProduct(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`/products/${id}`);
  },

  async bulkUpdateProducts(
    data: BulkProductionUpdateRequest,
  ): Promise<ApiResponse<{ updatedCount: number }>> {
    return apiClient.patch("/products/bulk-update", data);
  },

  async exportProducts(filters: ProductFilters): Promise<Blob> {
    const params = new URLSearchParams();

    if (filters.inventoryType)
      params.append("inventoryType", filters.inventoryType);
    if (filters.productType) params.append("productType", filters.productType);
    if (filters.search) params.append("search", filters.search);

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/products/export?${params.toString()}`,
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
