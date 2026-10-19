import { useThemeStore } from "@/store/useThemeStore";
import { Sun, Moon } from "lucide-react";

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className = "" }: ThemeToggleProps) {
  const { theme, toggleTheme } = useThemeStore();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      title={isDark ? "Switch to light theme" : "Switch to dark theme"}
      className={`inline-flex items-center justify-center w-9 h-9 min-w-[36px] min-h-[36px] rounded-xl border border-[var(--border)] bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.08)] text-[var(--accent-gold)] transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] ${className}`}
    >
      {isDark ? (
        <Sun size={17} className="text-[var(--gold-300)]" aria-hidden="true" />
      ) : (
        <Moon size={17} className="text-[var(--accent-gold)]" aria-hidden="true" />
      )}
    </button>
  );
}
