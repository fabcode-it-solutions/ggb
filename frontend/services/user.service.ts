import { apiClient } from "@/lib/api-client";
import { ApiResponse, PaginationMeta, User } from "@/types";

export interface UserFilters {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}

export interface CreateUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  roleIds: string[];
}

export interface UpdateUserRequest {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  isActive?: boolean;
  roleIds?: string[];
}

export const userService = {
  async getUsers(
    filters: UserFilters
  ): Promise<ApiResponse<{ data: User[]; pagination: PaginationMeta }>> {
    const params = new URLSearchParams();

    if (filters.page) params.append("page", filters.page.toString());
    if (filters.limit) params.append("limit", filters.limit.toString());
    if (filters.search) params.append("search", filters.search);
    if (filters.isActive !== undefined) params.append("isActive", filters.isActive.toString());


    return apiClient.get(`/users?${params.toString()}`);
  },

  async getUserById(id: string): Promise<ApiResponse<User>> {
    return apiClient.get(`/users/${id}`);
  },

  async createUser(data: CreateUserRequest): Promise<ApiResponse<User>> {
    return apiClient.post("/users", data);
  },

  async updateUser(data: UpdateUserRequest): Promise<ApiResponse<User>> {
    const { id, ...updateData } = data;
    return apiClient.put(`/users/${id}`, updateData);
  },

  async deleteUser(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`/users/${id}`);
  },

  async toggleUserStatus(
    id: string,
    isActive: boolean
  ): Promise<ApiResponse<User>> {
    return apiClient.patch(`/users/${id}/status`, { isActive });
  },
};
