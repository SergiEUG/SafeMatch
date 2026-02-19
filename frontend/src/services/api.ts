import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios';
import type { 
  ApiResponse, 
  AuthResponse, 
  DiscoverResponse, 
  Match, 
  MatchResponse, 
  User, 
  Message,
  LikeReceived
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
const TOKEN_KEY = 'safematch_token';
const REFRESH_TOKEN_KEY = 'safematch_refresh_token'; // Add REFRESH_TOKEN_KEY

// Para updates permitimos objetos anidados parciales (ubicacion/configuracion/contacto)
// sin exigir que vengan completos.
type UpdateProfilePayload = Partial<Omit<User, 'ubicacion' | 'configuracion' | 'contacto'>> & {
  ubicacion?: Partial<User['ubicacion']>;
  configuracion?: Partial<User['configuracion']>;
  contacto?: Partial<User['contacto']>;
};

let isRefreshing = false; // Flag to prevent multiple refresh requests
let failedQueue: Array<{ resolve: (value?: any) => void; reject: (reason?: any) => void; config: AxiosRequestConfig }> = []; // Queue for failed requests

class ApiClient {
  private axiosInstance: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.axiosInstance.interceptors.request.use((config) => {
      const token = this.token || localStorage.getItem(TOKEN_KEY);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Add response interceptor for automatic token refresh
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
          if (isRefreshing) {
            return new Promise((resolve, reject) => {
              failedQueue.push({ resolve, reject, config: originalRequest });
            })
              .then((token) => {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                return this.axiosInstance(originalRequest);
              })
              .catch((err) => Promise.reject(err));
          }

          originalRequest._retry = true;
          isRefreshing = true;

          const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
          if (!refreshToken) {
            // No refresh token, force logout
            this.setToken(null);
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(REFRESH_TOKEN_KEY);
            // Optionally, dispatch a logout action here if using a store
            failedQueue.forEach(prom => prom.reject(error));
            failedQueue = [];
            return Promise.reject(error);
          }

          try {
            const res = await this.refreshToken(refreshToken);
            const newAccessToken = res.data?.accessToken;

            if (newAccessToken) {
              this.setToken(newAccessToken);
              localStorage.setItem(TOKEN_KEY, newAccessToken);

              originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
              failedQueue.forEach(prom => prom.resolve(newAccessToken));
              failedQueue = [];
              return this.axiosInstance(originalRequest);
            } else {
              throw new Error('Refresh token did not return a new access token');
            }
          } catch (refreshError) {
            this.setToken(null);
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(REFRESH_TOKEN_KEY);
            failedQueue.forEach(prom => prom.reject(refreshError));
            failedQueue = [];
            // Optionally, dispatch a logout action here if using a store
            return Promise.reject(refreshError);
          } finally {
            isRefreshing = false;
          }
        }
        return Promise.reject(error);
      }
    );
  }

  setToken(token: string | null) {
    this.token = token;
  }

  // New method to handle token refresh
  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    try {
      const response = await this.axiosInstance.post<any>(`/auth/refresh-token`, { refreshToken });
      const rawData = response.data;
      const adaptedResponse: any = {
        success: rawData.exito ?? true,
        message: rawData.mensaje,
        data: rawData.datos ?? rawData
      };
      return adaptedResponse as AuthResponse;
    } catch (error: any) {
      console.error('Refresh Token API Error:', error.response?.data || error.message);
      const message = error.response?.data?.mensaje || error.response?.data?.message || 'Error al refrescar token';
      throw new Error(message);
    }
  }


  private async request<T>(config: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.axiosInstance.request<any>(config);
      const rawData = response.data;
      
      // Adaptar el formato de respuesta del backend (exito -> success)
      const adaptedResponse: any = {
        success: rawData.exito ?? true,
        message: rawData.mensaje,
        data: rawData.datos ?? rawData
      };
      return adaptedResponse as T;
    } catch (error: any) {
      console.error('API Error:', error.response?.data || error.message);
      const message = error.response?.data?.mensaje || error.response?.data?.message || 'Ha ocurrido un error';
      throw new Error(message);
    }
  }

  // Auth endpoints
  async login(email: string, password: string): Promise<AuthResponse> {
    const res = await this.request<AuthResponse>({
      url: '/auth/login',
      method: 'POST',
      data: { email, password },
    });
    if (res.success && res.data.accessToken) {
      this.setToken(res.data.accessToken);
    }
    return res;
  }

  async register(data: any): Promise<AuthResponse> {
    return this.request<AuthResponse>({
      url: '/auth/register',
      method: 'POST',
      data,
    });
  }

  async logout(): Promise<ApiResponse<void>> {
    const res = await this.request<ApiResponse<void>>({
      url: '/auth/logout',
      method: 'POST',
    });
    this.setToken(null);
    return res;
  }

  async getCurrentUser(): Promise<ApiResponse<{usuario: User}>> {
    return this.request<ApiResponse<{usuario: User}>>({ url: '/auth/me' });
  }

  // User endpoints
  async discoverUsers(page = 1): Promise<DiscoverResponse> {
    return this.request<DiscoverResponse>({ url: `/users/discover?pagina=${page}` });
  }

  async getUserProfile(id: string): Promise<ApiResponse<{usuario: User}>> {
    return this.request<ApiResponse<{usuario: User}>>({ url: `/users/${id}` });
  }

  async updateProfile(
    data: UpdateProfilePayload
  ): Promise<ApiResponse<{usuario: User}>> {
    return this.request<ApiResponse<{usuario: User}>>({
      url: '/users/profile',
      method: 'PUT',
      data,
    });
  }

  async shareContact(matchId: string): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>({
      url: '/users/share-contact',
      method: 'POST',
      data: { matchId },
    });
  }

  // Match endpoints
  async likeUser(userId: string): Promise<MatchResponse> {
    return this.request<MatchResponse>({
      url: `/matches/like/${userId}`,
      method: 'POST',
    });
  }

  async dislikeUser(userId: string): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>({
      url: `/matches/dislike/${userId}`,
      method: 'POST',
    });
  }

  async getMatches(): Promise<ApiResponse<{matches: Match[]}>> {
    return this.request<ApiResponse<{matches: Match[]}>>({ url: '/matches' });
  }

  async getMatch(matchId: string): Promise<ApiResponse<{match: Match}>> {
    return this.request<ApiResponse<{match: Match}>>({ url: `/matches/${matchId}` });
  }

  async getReceivedLikes(): Promise<ApiResponse<LikeReceived[]>> {
    return this.request<ApiResponse<LikeReceived[]>>({ url: '/matches/received-likes' });
  }

  // Message endpoints
  async getConversations(): Promise<ApiResponse<any[]>> {
    return this.request<ApiResponse<any[]>>({ url: '/messages' });
  }

  async getMessages(matchId: string, before?: string): Promise<ApiResponse<{mensajes: Message[], hayMas: boolean}>> {
    const url = before
      ? `/messages/${matchId}?antes=${before}`
      : `/messages/${matchId}`;
    return this.request<ApiResponse<{mensajes: Message[], hayMas: boolean}>>({ url });
  }

  async sendMessage(matchId: string, contenido: string, tipo = 'texto'): Promise<ApiResponse<{mensaje: Message}>> {
    return this.request<ApiResponse<{mensaje: Message}>>({
      url: `/messages/${matchId}`,
      method: 'POST',
      data: { contenido, tipo }
    });
  }

  // Call Permission endpoints
  async getCallPermissions(matchId: string): Promise<ApiResponse<{ callPermissions: any[] }>> {
    return this.request<ApiResponse<{ callPermissions: any[] }>>({
      url: `/matches/${matchId}/permissions/call`,
      method: 'GET',
    });
  }

  async updateCallPermission(matchId: string, status: 'ACCEPTED' | 'DECLINED'): Promise<ApiResponse<{ callPermissions: any[] }>> {
    return this.request<ApiResponse<{ callPermissions: any[] }>>({
      url: `/matches/${matchId}/permissions/call`,
      method: 'PUT',
      data: { status },
    });
  }
}

export const api = new ApiClient();
export default api;
