"use client";

import { useActionState, useState, useEffect } from "react";
import { loginAction } from "@/app/actions/auth";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, CheckSquare } from "lucide-react";
import FloatingThemeToggle from "@/components/FloatingThemeToggle";

export default function LoginForm({ namaSistem }) {
  const [state, formAction, isPending] = useActionState(loginAction, null);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  useEffect(() => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      const cookies = document.cookie.split(";");
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i];
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substring(0, eqPos).trim() : cookie.trim();
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
      }
      if ('caches' in window) {
        caches.keys().then((names) => {
          names.forEach((name) => caches.delete(name));
        });
      }
    } catch (e) {
      console.error("Gagal membersihkan cache:", e);
    }
  }, []);

  useEffect(() => {
    if (state?.success) {
      if (state.role === "ADMIN") {
        router.push("/admin");
      } else {
        router.push("/guru");
      }
    }
  }, [state, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground transition-colors duration-300 p-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-brand-primary/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md p-10 rounded-[2.5rem] glass shadow-2xl dark:shadow-brand-primary/5 border border-surface-border transition-all relative z-10 animate-in fade-in zoom-in-95 duration-700">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-[2rem] bg-brand-primary/10 dark:bg-brand-primary/20 text-brand-primary mb-8 transition-all shadow-inner border border-brand-primary/10 group">
            <CheckSquare size={48} className="group-hover:scale-110 transition-transform duration-500" />
          </div>
          <h1 className="text-2xl font-black text-foreground tracking-tight leading-tight">
            {namaSistem}
          </h1>
          <p className="text-foreground mt-4 font-bold opacity-70 uppercase text-[10px] tracking-[0.3em]">
            Portal Presensi Digital
          </p>
        </div>

        <form action={formAction} className="space-y-6">
          {state?.error && (
            <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 rounded-2xl text-sm text-center font-black animate-in shake duration-300">
              {state.error}
            </div>
          )}

          <div className="space-y-2.5">
            <label className="block text-sm font-black text-foreground ml-2 opacity-80">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              required
              className="w-full px-6 py-4 rounded-2xl border border-surface-border bg-background/50 text-foreground focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all shadow-sm"
              placeholder="nama@email.com"
            />
          </div>

          <div className="space-y-2.5">
            <label className="block text-sm font-black text-foreground ml-2 opacity-80">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                required
                className="w-full px-6 py-4 rounded-2xl border border-surface-border bg-background/50 text-foreground focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all pr-14 shadow-sm"
                placeholder="••••••••"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-3 text-nav-text hover:text-brand-primary transition-colors cursor-pointer rounded-xl hover:bg-brand-primary/5"
                >
                  {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-5 px-6 bg-brand-primary hover:bg-purple-700 text-white font-black rounded-2xl shadow-xl shadow-brand-primary/30 hover:shadow-2xl hover:-translate-y-0.5 transition-all active:scale-95 disabled:opacity-70 flex justify-center items-center cursor-pointer text-lg tracking-tight"
          >
            {isPending ? (
              <span className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Memproses...
              </span>
            ) : "Masuk ke Sistem"}
          </button>
        </form>

        <div className="mt-10 text-center">
          <p className="text-[10px] font-black text-foreground uppercase tracking-widest opacity-30">
            © 2026 {namaSistem}
          </p>
        </div>
      </div>

      <FloatingThemeToggle />
    </div>
  );
}
