import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Theme = "dark" | "light";

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: "dark",
      setTheme: (theme: Theme) => {
        if (typeof document !== "undefined") {
          const root = document.documentElement;
          root.classList.remove("light", "dark");
          root.classList.add(theme);
          root.setAttribute("data-theme", theme);
        }
        set({ theme });
      },
      toggleTheme: () => {
        set((state) => {
          const nextTheme = state.theme === "dark" ? "light" : "dark";
          if (typeof document !== "undefined") {
            const root = document.documentElement;
            root.classList.remove("light", "dark");
            root.classList.add(nextTheme);
            root.setAttribute("data-theme", nextTheme);
          }
          return { theme: nextTheme };
        });
      },
    }),
    {
      name: "gc-theme-preference",
      onRehydrateStorage: () => (state) => {
        if (state && typeof document !== "undefined") {
          const root = document.documentElement;
          root.classList.remove("light", "dark");
          root.classList.add(state.theme);
          root.setAttribute("data-theme", state.theme);
        }
      },
    },
  ),
);
