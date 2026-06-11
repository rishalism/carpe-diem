import { api } from "./api";
import type { AuthResponse, User } from "../types";

export const authService = {
  async register(email: string, username: string, password: string) {
    const { data } = await api.post<AuthResponse>("/auth/register", {
      email,
      username,
      password,
    });
    return data;
  },

  async login(email: string, password: string) {
    const { data } = await api.post<AuthResponse>("/auth/login", {
      email,
      password,
    });
    return data;
  },

  async googleLogin(idToken: string) {
    const { data } = await api.post<AuthResponse>("/auth/google", {
      id_token: idToken,
    });
    return data;
  },

  async forgotPassword(email: string) {
    const { data } = await api.post<{ detail: string; reset_token: string | null }>(
      "/auth/forgot-password",
      { email }
    );
    return data;
  },

  async resetPassword(token: string, newPassword: string) {
    const { data } = await api.post<{ detail: string }>("/auth/reset-password", {
      token,
      new_password: newPassword,
    });
    return data;
  },

  async changePassword(currentPassword: string, newPassword: string) {
    await api.post("/users/me/password", {
      current_password: currentPassword,
      new_password: newPassword,
    });
  },

  async exportData() {
    const { data } = await api.get("/users/me/export");
    return data;
  },

  async deleteAccount() {
    await api.delete("/users/me");
  },

  async me() {
    const { data } = await api.get<User>("/users/me");
    return data;
  },

  async updateProfile(
    payload: Partial<
      Pick<User, "username" | "bio" | "avatar_url" | "dark_mode" | "notification_prefs">
    >
  ) {
    const { data } = await api.patch<User>("/users/me", payload);
    return data;
  },
};
