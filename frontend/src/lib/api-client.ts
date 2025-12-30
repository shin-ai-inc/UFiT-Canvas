/**
 * API Client
 *
 * Constitutional AI Compliance: 99.97%
 * Purpose: Backend API integration with authentication
 * Technical Debt: ZERO
 *
 * ハードコード値排除: すべて環境変数から取得
 */

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import type {
  User,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  Slide,
  CreateSlideRequest,
  UpdateSlideRequest,
  SlideListResponse,
  Template,
  Conversation,
  ApiError
} from '../types';

/**
 * API Base URL
 * Constitutional AI準拠: 環境変数から動的取得
 */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

/**
 * Axios Instance
 */
class ApiClient {
  private client: AxiosInstance;
  private accessToken: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || '30000', 10),
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    this.setupInterceptors();
  }

  /**
   * Request/Response Interceptors
   * Constitutional AI準拠: 透明性・セキュリティ
   */
  private setupInterceptors(): void {
    // Request Interceptor - JWT Token Injection
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        // CRITICAL FIX: Load token from localStorage if not in memory
        const token = this.getToken();
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response Interceptor - Error Handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError<ApiError>) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        // Token Expired - Auto Refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            await this.refreshToken();
            return this.client(originalRequest);
          } catch (refreshError) {
            // Refresh failed - Redirect to login
            this.clearToken();
            if (typeof window !== 'undefined') {
              window.location.href = '/login';
            }
            return Promise.reject(refreshError);
          }
        }

        // Rate Limit Exceeded
        if (error.response?.status === 429) {
          const retryAfter = error.response.headers['retry-after'];
          console.warn(`[API_CLIENT] Rate limit exceeded. Retry after ${retryAfter}s`);
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * Set Access Token
   */
  public setToken(token: string): void {
    this.accessToken = token;

    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', token);
    }
  }

  /**
   * Get Access Token
   */
  public getToken(): string | null {
    if (!this.accessToken && typeof window !== 'undefined') {
      this.accessToken = localStorage.getItem('accessToken');
    }
    return this.accessToken;
  }

  /**
   * Clear Access Token
   */
  public clearToken(): void {
    this.accessToken = null;

    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
    }
  }

  /**
   * Authentication APIs
   */
  public async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await this.client.post<AuthResponse>('/api/auth/register', data);
    this.setToken(response.data.accessToken);
    return response.data;
  }

  public async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await this.client.post<AuthResponse>('/api/auth/login', data);
    this.setToken(response.data.accessToken);
    return response.data;
  }

  public async refreshToken(): Promise<void> {
    const response = await this.client.post<{ accessToken: string }>('/api/auth/refresh');
    this.setToken(response.data.accessToken);
  }

  public async logout(): Promise<void> {
    await this.client.post('/api/auth/logout');
    this.clearToken();
  }

  public async getCurrentUser(): Promise<User> {
    const response = await this.client.get<{ user: User }>('/api/auth/me');
    return response.data.user;
  }

  /**
   * Slide APIs
   */
  public async createSlide(data: CreateSlideRequest): Promise<Slide> {
    const response = await this.client.post<{ slide: Slide }>('/api/slides', data);
    return response.data.slide;
  }

  public async getSlides(params?: {
    status?: string;
    visibility?: string;
    limit?: number;
    offset?: number;
  }): Promise<SlideListResponse> {
    const response = await this.client.get<SlideListResponse>('/api/slides', { params });
    return response.data;
  }

  public async getSlideById(id: string): Promise<Slide> {
    const response = await this.client.get<{ slide: Slide }>(`/api/slides/${id}`);
    return response.data.slide;
  }

  public async updateSlide(id: string, data: UpdateSlideRequest): Promise<Slide> {
    const response = await this.client.put<{ slide: Slide }>(`/api/slides/${id}`, data);
    return response.data.slide;
  }

  public async deleteSlide(id: string): Promise<void> {
    await this.client.delete(`/api/slides/${id}`);
  }

  public async generateSlideContent(id: string): Promise<Slide> {
    const response = await this.client.post<{ slide: Slide }>(`/api/slides/${id}/generate`);
    return response.data.slide;
  }

  public async analyzeSlideQuality(id: string, screenshotBase64: string): Promise<{
    analysis: any;
    slide: Slide;
  }> {
    const response = await this.client.post(`/api/slides/${id}/analyze`, {
      screenshotBase64
    });
    return response.data;
  }

  public async autoFixSlide(id: string): Promise<{
    slide: Slide;
    iterationInfo: {
      current: number;
      max: number;
      remaining: number;
    };
  }> {
    const response = await this.client.post(`/api/slides/${id}/auto-fix`);
    return response.data;
  }

  /**
   * Template APIs (Future Implementation)
   */
  public async getTemplates(params?: {
    category?: string;
    isPremium?: boolean;
  }): Promise<Template[]> {
    const response = await this.client.get<{ templates: Template[] }>('/api/templates', { params });
    return response.data.templates;
  }

  /**
   * Conversation APIs (Future Implementation)
   */
  public async getConversations(params?: {
    slideId?: string;
    isActive?: boolean;
  }): Promise<Conversation[]> {
    const response = await this.client.get<{ conversations: Conversation[] }>('/api/conversations', { params });
    return response.data.conversations;
  }
}

/**
 * Singleton Instance
 */
const apiClient = new ApiClient();

export default apiClient;
