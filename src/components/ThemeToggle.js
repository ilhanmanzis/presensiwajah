"use client";

import { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
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
      className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-nav-text hover:bg-brand-primary/10 hover:text-brand-primary dark:hover:bg-purple-500/20 dark:hover:text-purple-400 transition-all w-full font-medium mb-2 cursor-pointer group"
      title="Ganti Tema"
    >
      {theme === "light" ? (
        <>
          <Moon size={20} className="text-slate-500 group-hover:text-brand-primary transition-colors" />
          <span>Mode Gelap</span>
        </>
      ) : (
        <>
          <Sun size={20} className="text-amber-400 group-hover:scale-110 transition-transform" />
          <span>Mode Terang</span>
        </>
      )}
    </button>
  );
}
