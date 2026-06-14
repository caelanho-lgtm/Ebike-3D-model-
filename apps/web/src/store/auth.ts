import { create } from 'zustand';
import type { AuthUser } from '@fitwerx/shared';
import { api, getToken, setToken } from '../api/client';

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  initialized: boolean;
  init: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  signup: (input: {
    tenantName: string;
    tenantSlug: string;
    email: string;
    password: string;
    name: string;
  }) => Promise<void>;
  logout: () => void;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  loading: false,
  initialized: false,
  init: async () => {
    if (!getToken()) {
      set({ initialized: true });
      return;
    }
    try {
      const user = await api.me();
      set({ user, initialized: true });
    } catch {
      setToken(null);
      set({ user: null, initialized: true });
    }
  },
  login: async (email, password) => {
    set({ loading: true });
    try {
      const res = await api.login({ email, password });
      setToken(res.token);
      set({ user: res.user });
    } finally {
      set({ loading: false });
    }
  },
  signup: async (input) => {
    set({ loading: true });
    try {
      const res = await api.signup(input);
      setToken(res.token);
      set({ user: res.user });
    } finally {
      set({ loading: false });
    }
  },
  logout: () => {
    setToken(null);
    set({ user: null });
  },
}));
