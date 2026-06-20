import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

interface User {
  id: string;
  phone: string;
  full_name?: string;
  preferred_name?: string;
  verification_status: 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED';
  role_flags: string[];
  reliability_score: number;
  account_status: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isLoaded: boolean;
  setAuth: (token: string, user: User) => Promise<void>;
  updateUser: (user: Partial<User>) => void;
  logout: () => Promise<void>;
  loadFromStorage: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isLoaded: false,

  setAuth: async (token, user) => {
    await SecureStore.setItemAsync('wemove_token', token);
    await SecureStore.setItemAsync('wemove_user', JSON.stringify(user));
    set({ token, user });
  },

  updateUser: (partial) =>
    set((s) => ({ user: s.user ? { ...s.user, ...partial } : null })),

  logout: async () => {
    await SecureStore.deleteItemAsync('wemove_token');
    await SecureStore.deleteItemAsync('wemove_user');
    set({ token: null, user: null });
  },

  loadFromStorage: async () => {
    try {
      const token = await SecureStore.getItemAsync('wemove_token');
      const raw = await SecureStore.getItemAsync('wemove_user');
      const user = raw ? JSON.parse(raw) : null;
      set({ token, user, isLoaded: true });
    } catch {
      set({ isLoaded: true });
    }
  },
}));
