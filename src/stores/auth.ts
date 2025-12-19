import { create } from 'zustand';
import { authAPI } from '../services/api';

interface User {
  id: string;
  email: string;
  role: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await authAPI.login(email, password);
      const { token, user } = response.data;
      
      localStorage.setItem('auth_token', token);
      set({ user, token, isLoading: false });
    } catch (error: unknown) {
      const errorMessage =
        (error as { response?: { data?: { error?: string } } }).response?.data?.error ||
        'Login failed';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('auth_token');
    set({ user: null, token: null, error: null });
  },

  checkAuth: async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      set({ user: null, token: null });
      return;
    }

    set({ isLoading: true });
    
    try {
      const response = await authAPI.getCurrentUser();
      const { user } = response.data;
      set({ user, token, isLoading: false });
    } catch {
      localStorage.removeItem('auth_token');
      set({ user: null, token: null, isLoading: false });
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));
