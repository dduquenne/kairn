"use client";

import { Sun, Moon } from "lucide-react";
import { useState } from "react";

interface ArticleThemeToggleProps {
  onThemeChange?: (theme: "light" | "dark") => void;
}

export function ArticleThemeToggle({ onThemeChange }: ArticleThemeToggleProps) {
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  const handleToggle = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    onThemeChange?.(newTheme);
  };

  return (
    <button
      onClick={handleToggle}
      className="inline-flex items-center justify-center h-10 w-10 rounded-lg bg-gold/20 hover:bg-gold/30 text-gold transition-all duration-200 group relative"
      title={theme === "dark" ? "Passer en mode nuit" : "Passer en mode jour"}
      aria-label={theme === "dark" ? "Passer en mode nuit" : "Passer en mode jour"}
    >
      {theme === "dark" ? (
        <Sun className="h-5 w-5 transition-transform group-hover:scale-110" />
      ) : (
        <Moon className="h-5 w-5 transition-transform group-hover:scale-110" />
      )}
    </button>
  );
}
