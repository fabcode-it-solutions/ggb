import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from "axios";
import Cookies from "js-cookie";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        "Content-Type": "application/json",
      },
      withCredentials: true,
    });

    // Request interceptor to add auth token and CSRF token
    this.client.interceptors.request.use(
      (config) => {
        const token = Cookies.get("auth_token");
        const csrfToken = Cookies.get("csrf_token_ggb_wa");

        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        if (
          csrfToken &&
          ["post", "put", "patch", "delete"].includes(config.method || "")
        ) {
          config.headers["X-CSRF-Token"] = csrfToken;
        }

        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle errors
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        const status = error.response?.status;
        const isLoginRequest = error.config?.url?.includes('/auth/login');

        if (status === 401 && !isLoginRequest) {
          Cookies.remove("auth_token");
          Cookies.remove("csrf_token_ggb_wa");
          if (typeof window !== "undefined") {
            window.location.href = "/login";
          }
        }

        if (status === 403) {
          const data = error.response?.data as any;
          const isCsrfError =
            data?.message?.toLowerCase().includes("csrf") ||
            data?.error?.toLowerCase().includes("csrf");

          if (isCsrfError) {
            Cookies.remove("auth_token");
            Cookies.remove("csrf_token_ggb_wa");
            if (typeof window !== "undefined") {
              window.location.href = "/login";
            }
          }
        }

        return Promise.reject(error);
      }
    );
  }

  async get<T>(url: string, config?: AxiosRequestConfig) {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig) {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig) {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig) {
    const response = await this.client.patch<T>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig) {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }
}

export const apiClient = new ApiClient();
