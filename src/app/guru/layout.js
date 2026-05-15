import { Home, MapPin, User, FileText, LogOut } from "lucide-react";
import { logoutAction } from "@/app/actions/auth";
import ThemeToggleIcon from "@/components/ThemeToggleIcon";
import ThemeToggle from "@/components/ThemeToggle";
import SidebarLink from "@/components/SidebarLink";
import Breadcrumbs from "@/components/Breadcrumbs";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function GuruLayout({ children }) {
  const settings = await prisma.settings.findUnique({
    where: { id: "global" }
  });

  const namaSistem = settings?.nama_sistem || "Sistem Presensi";

  return (
    <div className="flex flex-col min-h-screen bg-background transition-colors duration-300">
      {/* Header Mobile */}
      <header className="sticky top-0 z-[10002] px-4 py-3 flex justify-between items-center md:hidden bg-surface border-b border-surface-border shadow-sm">
        <h1 className="text-xl font-extrabold text-foreground tracking-tight line-clamp-1">
          {namaSistem}
        </h1>
        <ThemeToggleIcon />
      </header>

      {/* Main Content (Mobile Only) */}
      <main className="flex-1 overflow-y-auto pb-20 md:hidden p-4">
        <div className="max-w-xl mx-auto w-full">
          {children}
        </div>
      </main>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 w-full bg-surface border-t border-slate-200 dark:border-surface-border z-[10002] md:hidden pb-safe shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        <div className="flex justify-around items-center h-16">
          <SidebarLink href="/guru" icon={<Home size={24} />} label="Beranda" mode="mobile" />
          <SidebarLink href="/guru/presensi" icon={<MapPin size={24} />} label="Presensi" mode="mobile" />
          <SidebarLink href="/guru/laporan" icon={<FileText size={24} />} label="Laporan" mode="mobile" />
          <SidebarLink href="/guru/profil" icon={<User size={24} />} label="Profil" mode="mobile" />
        </div>
      </nav>

      {/* Desktop Sidebar (Optional Fallback for Guru on Desktop) */}
      <aside className="hidden md:flex flex-col w-64 glass border-r border-slate-200 dark:border-surface-border h-screen fixed left-0 top-0 z-[100]">
        <div className="p-6">
          <h1 className="text-xl font-extrabold text-foreground tracking-tight line-clamp-1">
            {namaSistem}
          </h1>
        </div>
        <div className="flex-1 mt-6 px-4 space-y-2">
          <SidebarLink href="/guru" icon={<Home size={20} />} label="Beranda" />
          <SidebarLink href="/guru/presensi" icon={<MapPin size={20} />} label="Presensi" />
          <SidebarLink href="/guru/laporan" icon={<FileText size={20} />} label="Laporan" />
          <SidebarLink href="/guru/profil" icon={<User size={20} />} label="Profil" />
        </div>
        <div className="p-4 border-t border-surface-border">
          <ThemeToggle />
          <form action={logoutAction}>
            <button className="flex w-full items-center gap-3 px-4 py-2.5 rounded-lg text-nav-text hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/20 dark:hover:text-red-400 transition-colors cursor-pointer">
              <LogOut size={20} />
              <span className="font-medium">Logout</span>
            </button>
          </form>
        </div>
      </aside>

      {/* Desktop Main Content offset */}
      <div className="hidden md:block md:ml-64 flex-1 h-screen overflow-y-auto p-8">
        <div className="max-w-5xl mx-auto">
          <Breadcrumbs />
          {children}
        </div>
      </div>
    </div>
  );
}
