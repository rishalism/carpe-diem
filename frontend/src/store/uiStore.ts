import { create } from "zustand";

const DARK_KEY = "cd_dark_mode";

function applyTheme(dark: boolean) {
  document.documentElement.classList.toggle("dark", dark);
}

function initialDark(): boolean {
  const stored = localStorage.getItem(DARK_KEY);
  if (stored !== null) return stored === "true";
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
}

interface UIState {
  darkMode: boolean;
  toggleDark: () => void;
  setDark: (dark: boolean) => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  darkMode: initialDark(),

  toggleDark: () => {
    const next = !get().darkMode;
    localStorage.setItem(DARK_KEY, String(next));
    applyTheme(next);
    set({ darkMode: next });
  },

  setDark: (dark) => {
    localStorage.setItem(DARK_KEY, String(dark));
    applyTheme(dark);
    set({ darkMode: dark });
  },
}));

// Apply the persisted theme immediately on load.
applyTheme(useUIStore.getState().darkMode);
