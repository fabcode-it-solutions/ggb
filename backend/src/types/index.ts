export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface CreateUserDto {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  roleIds: string[];
}

export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  email?: string;
  isActive?: boolean;
  roleIds?: string[];
}

export interface CreateRoleDto {
  type: "ADMIN" | "WAREHOUSE";
  name: string;
  description?: string;
  permissions: {
    roles?: boolean;
    inventory?: boolean;
    dashboard?: boolean;
    analytics?: boolean;
    users?: boolean;
    logs?: boolean;
  };
}

export interface UpdateRoleDto {
  name?: string;
  description?: string;
  permissions?: {
    roles?: boolean;
    inventory?: boolean;
    dashboard?: boolean;
    analytics?: boolean;
    users?: boolean;
    logs?: boolean;
  };
}

export type InventoryType = "SNOW" | "SXS" | "APPAREL";

export type ProductType =
  | "OBSOLETE"
  | "QUIET"
  | "TRAIL"
  | "MOUNTAIN"
  | "SXS_QUIET"
  | "SXS_TIPS"
  | "SXS_DUAL"
  | "SXS_OTHER"
  | "SXS_SPORT"
  | "SXS_SPORT_PRO"
  | "SXS_TRAIL"
  | "APPAREL"
  | "all";

export interface ProductionPlanningItem {
  id: string;
  inventoryType: Extract<InventoryType, "SNOW" | "SXS">;
  productType: Exclude<ProductType, "all">;
  sku: string;
  ggbNumber: number | null;
  dealerNumber: number | null;
  inventoryCount: number;
  wipCount: number;
  buildCount: number;
  requiredQty: number;
  shopifyProductId?: string | null;
  shopifyOrderId?: string | null;
  updatedBy?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
