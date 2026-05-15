"use client";

import { useState } from "react";
import { LayoutDashboard, Users, UserPlus, MapPin, FileBarChart, LogOut, User, Menu, X, Settings, ClipboardList, LogIn } from "lucide-react";
import { logoutAction } from "@/app/actions/auth";
import ThemeToggle from "@/components/ThemeToggle";
import SidebarLink from "@/components/SidebarLink";

export default function AdminSidebarClient({ namaSistem }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const sidebarContent = (
    <>
      <div className="p-6 flex items-center justify-between">
        <h1 className="text-md font-black text-foreground tracking-tight line-clamp-1">
          {namaSistem}
        </h1>
        <button
          className="md:hidden p-2 text-nav-text hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
          onClick={() => setIsSidebarOpen(false)}
        >
          <X size={20} />
        </button>
      </div>
      <nav className="mt-2 flex-1 overflow-y-auto">
        <div className="px-4 space-y-2">
          <SidebarLink href="/admin" icon={<LayoutDashboard size={20} />} label="Dashboard" onClick={() => setIsSidebarOpen(false)} />
          <SidebarLink href="/admin/input-presensi" icon={<LogIn size={20} />} label="Input Presensi" onClick={() => setIsSidebarOpen(false)} />
          <SidebarLink href="/admin/presensi" icon={<ClipboardList size={20} />} label="Daftar Presensi Guru" onClick={() => setIsSidebarOpen(false)} />
          <SidebarLink href="/admin/guru" icon={<Users size={20} />} label="Data Guru" onClick={() => setIsSidebarOpen(false)} />
          <SidebarLink href="/admin/enrollment" icon={<UserPlus size={20} />} label="Registrasi Wajah" onClick={() => setIsSidebarOpen(false)} />
          <SidebarLink href="/admin/geofence" icon={<MapPin size={20} />} label="Pengaturan GPS" onClick={() => setIsSidebarOpen(false)} />
          <SidebarLink href="/admin/settings" icon={<Settings size={20} />} label="Pengaturan Sistem" onClick={() => setIsSidebarOpen(false)} />
          <SidebarLink href="/admin/laporan" icon={<FileBarChart size={20} />} label="Laporan" onClick={() => setIsSidebarOpen(false)} />
          <SidebarLink href="/admin/profile" icon={<User size={20} />} label="Profil" onClick={() => setIsSidebarOpen(false)} />
        </div>
      </nav>
      <div className="p-4 border-t border-surface-border">
        <ThemeToggle />
        <form action={logoutAction}>
          <button className="flex w-full items-center gap-3 px-4 py-2.5 rounded-lg text-nav-text hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/20 dark:hover:text-red-400 transition-colors cursor-pointer">
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </form>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="w-64 bg-surface border-r border-surface-border flex-shrink-0 glass hidden md:flex flex-col sticky top-0 h-screen z-[100]">
        {sidebarContent}
      </aside>

      {/* Mobile Header */}
      <header className="h-16 flex items-center px-4 bg-surface border-b border-surface-border md:hidden sticky top-0 z-[9999]">
        <button
          className="p-2 text-nav-text hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
          onClick={() => setIsSidebarOpen(true)}
        >
          <Menu size={24} />
        </button>
        <div className="ml-4 font-bold text-foreground line-clamp-1">
          {namaSistem}
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-[10000] bg-slate-950/50 backdrop-blur-sm md:hidden animate-in fade-in duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-[10001] w-72 bg-surface border-r border-surface-border glass md:hidden transition-transform duration-300 flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {sidebarContent}
      </aside>
    </>
  );
}
