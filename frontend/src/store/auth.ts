import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { api } from '../services/api';
import type { User } from '../types';

const TOKEN_KEY = 'safematch_token';
const REFRESH_TOKEN_KEY = 'safematch_refresh_token';
const USER_KEY = 'safematch_user';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const token = ref<string | null>(null);
  const isLoading = ref(true);

  const isAuthenticated = computed(() => !!token.value);

  function init() {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    const storedUser = localStorage.getItem(USER_KEY);

    if (storedToken) {
      token.value = storedToken;
      api.setToken(storedToken);
      if (storedUser) {
        try {
          user.value = JSON.parse(storedUser);
        } catch (e) {
          localStorage.removeItem(USER_KEY);
        }
      }
    }
    isLoading.value = false;
  }

  async function fetchCurrentUser() {
    try {
      const response = await api.getCurrentUser();
      if (response.success && response.data?.usuario) {
        user.value = response.data.usuario;
        localStorage.setItem(USER_KEY, JSON.stringify(user.value));
        return true;
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
    return false;
  }

  async function login(email: string, password: string) {
    const response = await api.login(email, password);
    if (response.success && response.data) {
      const { usuario, accessToken, refreshToken } = response.data;
      
      token.value = accessToken;
      user.value = usuario;
      api.setToken(accessToken);
      
      localStorage.setItem(TOKEN_KEY, accessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      localStorage.setItem(USER_KEY, JSON.stringify(usuario));
      return true;
    }
    return false;
  }

  async function logout() {
    try {
      await api.logout();
    } catch {
      // Ignore errors
    }
    token.value = null;
    user.value = null;
    api.setToken(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  // Nueva función para actualizar el usuario localmente tras un cambio
  function updateUser(newData: Partial<User>) {
    if (user.value) {
      user.value = { ...user.value, ...newData };
      localStorage.setItem(USER_KEY, JSON.stringify(user.value));
    }
  }

  return {
    user,
    token,
    isLoading,
    isAuthenticated,
    init,
    login,
    logout,
    fetchCurrentUser,
    updateUser
  };
});
