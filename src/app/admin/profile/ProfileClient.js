"use client";

import { useState, useEffect } from "react";
import { User, Mail, Lock, Save, Key, Eye, EyeOff, CheckCircle2, AlertCircle } from "lucide-react";
import { updateAdminProfileAction, updateAdminPasswordAction } from "@/app/actions/admin";
import { toast } from "react-hot-toast";

export default function ProfileClient({ admin }) {
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setIsProfileLoading(true);
    
    try {
      const result = await updateAdminProfileAction(formData);
      if (result.success) {
        toast.success(result.success);
      } else {
        toast.error(result.error);
      }
    } finally {
      setIsProfileLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setIsPasswordLoading(true);
    
    try {
      const result = await updateAdminPasswordAction(formData);
      if (result.success) {
        toast.success(result.success);
        e.target.reset();
      } else {
        toast.error(result.error);
      }
    } finally {
      setIsPasswordLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Biodata Section */}
      <div className="space-y-6">
        <div className="glass rounded-2xl p-6 shadow-sm border border-surface-border">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-purple-100 dark:bg-purple-500/20 text-brand-primary rounded-xl">
              <User size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Biodata Admin</h2>
              <p className="text-xs text-nav-text">Kelola informasi dasar akun Anda</p>
            </div>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-nav-text mb-1.5 ml-1">Nama Lengkap</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-400">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  name="nama_lengkap"
                  defaultValue={admin.nama_lengkap}
                  required
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-surface-border bg-background outline-none focus:ring-2 focus:ring-brand-primary transition-all text-foreground"
                  placeholder="Nama Admin"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-nav-text mb-1.5 ml-1">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-400">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  name="email"
                  defaultValue={admin.email}
                  required
                  autoComplete="off"
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-surface-border bg-background outline-none focus:ring-2 focus:ring-brand-primary transition-all text-foreground font-medium"
                  placeholder="email@admin.com"
                />
              </div>
            </div>



            <button
              type="submit"
              disabled={isProfileLoading}
              className="w-full py-3 bg-brand-primary hover:bg-purple-700 text-white font-bold rounded-xl shadow-lg hover:shadow-brand-primary/20 transition-all flex justify-center items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Save size={18} />
              {isProfileLoading ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </form>
        </div>
      </div>

      {/* Security Section */}
      <div className="space-y-6">
        <div className="glass rounded-2xl p-6 shadow-sm border border-surface-border">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl">
              <Lock size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Keamanan</h2>
              <p className="text-xs text-nav-text">Perbarui password akun Anda secara berkala</p>
            </div>
          </div>

          <form onSubmit={handleUpdatePassword} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-nav-text mb-1.5 ml-1">Password Lama</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-400">
                  <Key size={18} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  name="currentPassword"
                  required
                  autoComplete="current-password"
                  className="w-full pl-11 pr-12 py-3 rounded-xl border border-surface-border bg-background outline-none focus:ring-2 focus:ring-brand-primary transition-all text-foreground"
                  placeholder="••••••••"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1.5 text-slate-400 hover:text-brand-primary transition-colors cursor-pointer rounded-lg"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-nav-text mb-1.5 ml-1">Password Baru</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-400">
                  <Lock size={18} />
                </div>
                <input
                  type={showNewPassword ? "text" : "password"}
                  name="newPassword"
                  required
                  autoComplete="new-password"
                  className="w-full pl-11 pr-12 py-3 rounded-xl border border-surface-border bg-background outline-none focus:ring-2 focus:ring-brand-primary transition-all text-foreground"
                  placeholder="Minimal 6 karakter"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="p-1.5 text-slate-400 hover:text-brand-primary transition-colors cursor-pointer rounded-lg"
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>



            <button
              type="submit"
              disabled={isPasswordLoading}
              className="w-full py-3 bg-brand-primary hover:bg-purple-700 text-white font-bold rounded-xl shadow-lg hover:shadow-brand-primary/20 transition-all flex justify-center items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Key size={18} />
              {isPasswordLoading ? "Memproses..." : "Update Password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
