import { apiClient } from '@/lib/api-client';
import { ApiResponse, Role, RoleType } from '@/types';

export interface RoleFilters {
  page?: number;
  limit?: number;
  search?: string;
  type?: RoleType;
}

export interface CreateRoleRequest {
  type: RoleType;
  name: string;
  description?: string;
  permissions: Record<string, boolean>;
}

export interface UpdateRoleRequest {
  id: string;
  name?: string;
  description?: string;
  permissions?: Record<string, boolean>;
}

export const roleService = {
  async getRoles(filters: RoleFilters): Promise<ApiResponse<Role[]>> {
    const params = new URLSearchParams();
    
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.search) params.append('search', filters.search);
    if (filters.type) params.append('type', filters.type);

    return apiClient.get(`/roles?${params.toString()}`);
  },

  async getRoleById(id: string): Promise<ApiResponse<Role>> {
    return apiClient.get(`/roles/${id}`);
  },

  async createRole(data: CreateRoleRequest): Promise<ApiResponse<Role>> {
    return apiClient.post('/roles', data);
  },

  async updateRole(data: UpdateRoleRequest): Promise<ApiResponse<Role>> {
    const { id, ...updateData } = data;
    return apiClient.put(`/roles/${id}`, updateData);
  },

  async deleteRole(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`/roles/${id}`);
  },
};
