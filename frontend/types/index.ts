export enum RoleType {
  ADMIN = "ADMIN",
  WAREHOUSE = "WAREHOUSE",
}

export enum WebhookStatus {
  NOT_UPDATED = "NOT_UPDATED",
  UPDATED = "UPDATED",
}

export enum InventoryType {
  SNOW = "SNOW",
  SXS = "SXS",
  APPAREL = "APPAREL",
}

export enum ProductType {
  OBSOLETE = "OBSOLETE",
  QUIET = "QUIET",
  TRAIL = "TRAIL",
  MOUNTAIN = "MOUNTAIN",
  SXS_QUIET = "SXS_QUIET",
  SXS_TIPS = "SXS_TIPS",
  APPAREL = "APPAREL",
  SXS_DUAL = "SXS_DUAL",
  SXS_OTHER = "SXS_OTHER",
  SXS_SPORT = "SXS_SPORT",
  SXS_TRAIL = "SXS_TRAIL",
  SXS_SPORT_PRO = "SXS_SPORT_PRO",
}

export enum LogType {
  LOGIN = "LOGIN",
  LOGOUT = "LOGOUT",
  CREATE = "CREATE",
  UPDATE = "UPDATE",
  DELETE = "DELETE",
  ERROR = "ERROR",
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  userRoles?: UserRole[];
}

export interface Role {
  id: string;
  type: RoleType;
  name: string;
  description?: string;
  permissions: Record<string, boolean>;
  createdAt: string;
  updatedAt: string;
}

export interface UserRole {
  id: string;
  userId: string;
  roleId: string;
  user?: User;
  role?: Role;
  createdAt: string;
  updatedAt: string;
}

export interface LoginSession {
  id: string;
  userId: string;
  token: string;
  ipAddress?: string;
  userAgent?: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface Log {
  id: string;
  userId?: string;
  type: LogType;
  action: string;
  note?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  user?: User;
}

export interface WebhookTrigger {
  id: string;
  orderId: string;
  status: WebhookStatus;
  attempts: number;
  lastAttemptAt?: string;
  responseData?: Record<string, any>;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  inventoryType: InventoryType;
  productType: ProductType;
  sku: string;
  ggbNumber?: number;
  dealerNumber?: number;
  inventoryCount: number;
  wipCount: number;
  buildCount: number;
  shopifyProductId?: string;
  shopifyOrderId?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
  updater?: User;
}

export interface ProductionPlanningItem extends Product {
  requiredQty: number;
}

export interface PaginationMeta {
  page: number;
  totalPages: number;
  total: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  pagination?: PaginationMeta;
}
