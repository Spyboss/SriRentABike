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
  // True once the initial session restore has finished (with or without a
  // stored token). Guards must wait for it, otherwise they see user === null
  // for the first few milliseconds and bounce a valid session to /login.
  isHydrated: boolean;
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
  isHydrated: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await authAPI.login(email, password);
      const { token, user } = response.data;
      
      localStorage.setItem('auth_token', token);
      set({ user, token, isLoading: false, isHydrated: true });
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
    set({ user: null, token: null, error: null, isHydrated: true });
  },

  checkAuth: async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      set({ user: null, token: null, isHydrated: true });
      return;
    }

    set({ isLoading: true });
    
    try {
      const response = await authAPI.getCurrentUser();
      const { user } = response.data;
      set({ user, token, isLoading: false, isHydrated: true });
    } catch {
      localStorage.removeItem('auth_token');
      set({ user: null, token: null, isLoading: false, isHydrated: true });
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));
