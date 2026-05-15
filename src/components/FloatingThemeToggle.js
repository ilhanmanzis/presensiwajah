"use client";

import { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";

export default function FloatingThemeToggle() {
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light";
    setTheme(savedTheme);
    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.cookie = `theme=${newTheme}; path=/; max-age=31536000`; // 1 year
    
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  return (
    <button
      onClick={toggleTheme}
      className="fixed bottom-6 right-6 p-4 rounded-2xl bg-surface border border-surface-border shadow-2xl hover:scale-110 transition-all cursor-pointer z-50 group glass active:scale-95"
      title={theme === "light" ? "Ganti ke Mode Gelap" : "Ganti ke Mode Terang"}
    >
      {theme === "light" ? (
        <Moon size={24} className="text-slate-600 group-hover:text-brand-primary transition-colors" />
      ) : (
        <Sun size={24} className="text-amber-400 group-hover:rotate-45 transition-all duration-300" />
      )}
    </button>
  );
}
