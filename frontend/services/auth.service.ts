import { apiClient } from "@/lib/api-client";
import { ApiResponse, User } from "@/types";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
  csrfToken: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

export const authService = {
  async login(data: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    return apiClient.post("/auth/login", data);
  },

  async logout(): Promise<ApiResponse<void>> {
    return apiClient.post("/auth/logout");
  },

  async forgotPassword(
    data: ForgotPasswordRequest
  ): Promise<ApiResponse<void>> {
    return apiClient.post("/auth/forgot-password", data);
  },

  async resetPassword(data: ResetPasswordRequest): Promise<ApiResponse<void>> {
    return apiClient.post("/auth/reset-password", data);
  },

  async getProfile(): Promise<ApiResponse<User>> {
    return apiClient.get("/auth/profile");
  },

  async updateProfile(
    data: Partial<User>
  ): Promise<ApiResponse<{ data: User }>> {
    return apiClient.put("/auth/profile", data);
  },

  async changePassword(data: {
    currentPassword: string;
    newPassword: string;
  }): Promise<ApiResponse<void>> {
    return apiClient.post("/auth/change-password", data);
  },
};
