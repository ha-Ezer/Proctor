import { create } from 'zustand';
import { AdminUser } from '@/lib/adminApi';

interface AdminState {
  admin: AdminUser | null;
  token: string | null;
  setAdmin: (admin: AdminUser, token: string) => void;
  clearAdmin: () => void;
  isAuthenticated: () => boolean;
}

const STORAGE_KEY = 'proctor_admin_token';
const ADMIN_KEY = 'proctor_admin_user';

export const useAdminStore = create<AdminState>((set, get) => ({
  admin: (() => {
    const stored = localStorage.getItem(ADMIN_KEY);
    return stored ? JSON.parse(stored) : null;
  })(),
  token: localStorage.getItem(STORAGE_KEY),

  setAdmin: (admin, token) => {
    localStorage.setItem(ADMIN_KEY, JSON.stringify(admin));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(token));
    set({ admin, token });
  },

  clearAdmin: () => {
    localStorage.removeItem(ADMIN_KEY);
    localStorage.removeItem(STORAGE_KEY);
    set({ admin: null, token: null });
  },

  isAuthenticated: () => {
    const state = get();
    return !!(state.admin && state.token);
  },
}));
