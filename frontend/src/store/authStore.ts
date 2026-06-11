import { create } from "zustand";
import type { User } from "../types";
import { authService } from "../services/authService";
import { setAuthFailureHandler, tokenStore } from "../services/api";

interface AuthState {
  user: User | null;
  status: "idle" | "loading" | "authenticated" | "unauthenticated";
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  googleLogin: (idToken: string) => Promise<void>;
  logout: () => void;
  bootstrap: () => Promise<void>;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: "idle",

  login: async (email, password) => {
    const data = await authService.login(email, password);
    tokenStore.set(data.access_token, data.refresh_token);
    set({ user: data.user, status: "authenticated" });
  },

  register: async (email, username, password) => {
    const data = await authService.register(email, username, password);
    tokenStore.set(data.access_token, data.refresh_token);
    set({ user: data.user, status: "authenticated" });
  },

  googleLogin: async (idToken) => {
    const data = await authService.googleLogin(idToken);
    tokenStore.set(data.access_token, data.refresh_token);
    set({ user: data.user, status: "authenticated" });
  },

  logout: () => {
    tokenStore.clear();
    set({ user: null, status: "unauthenticated" });
  },

  bootstrap: async () => {
    if (!tokenStore.getAccess()) {
      set({ status: "unauthenticated" });
      return;
    }
    set({ status: "loading" });
    try {
      const user = await authService.me();
      set({ user, status: "authenticated" });
    } catch {
      tokenStore.clear();
      set({ user: null, status: "unauthenticated" });
    }
  },

  setUser: (user) => set({ user }),
}));

// When token refresh fails, force a logout.
setAuthFailureHandler(() => useAuthStore.getState().logout());
