"use client";

import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { usePathname } from "next/navigation";

export default function Breadcrumbs() {
  const pathname = usePathname();
  
  // Don't show breadcrumbs on landing page or login
  if (pathname === "/" || pathname === "/login") return null;

  const paths = pathname.split("/").filter((path) => path !== "");
  
  // Custom labels for paths
  const routeLabels = {
    admin: "Dashboard",
    guru: "Data Guru", // This applies to /admin/guru
    presensi: "Presensi",
    bulanan: "Bulanan",
    attendance: "Presensi",
    settings: "Pengaturan",
    history: "Riwayat",
    enrollment: "Registrasi Wajah",
    geofence: "Pengaturan Lokasi",
    profile: "Profil",
    laporan: "Laporan"
  };

  const isAdmin = pathname.startsWith("/admin");
  const isGuru = pathname.startsWith("/guru");
  const baseHref = isAdmin ? "/admin" : (isGuru ? "/guru" : "/");

  // If we are exactly at /admin or /guru, just show Home
  const isBaseDashboard = pathname === "/admin" || pathname === "/guru";

  // Logic to handle virtual breadcrumb paths (e.g., adding "Bulanan" before "Detail")
  let displayPaths = [...paths];
  if (pathname.startsWith("/admin/presensi/detail")) {
    const detailIndex = displayPaths.indexOf("detail");
    if (detailIndex !== -1) {
      displayPaths.splice(detailIndex, 0, "bulanan");
    }
  }

  return (
    <nav className="hidden md:flex items-center space-x-2 text-sm font-medium text-slate-500 dark:text-slate-400 mb-6">
      <Link
        href={baseHref}
        className="flex items-center hover:text-brand-primary transition-colors"
      >
        <Home size={16} className="mr-1" />
        <span>Home</span>
      </Link>

      {!isBaseDashboard && displayPaths.map((path, index) => {
        // Skip the base path (admin/guru) since "Home" already represents the dashboard
        if ((path === "admin" || path === "guru") && index === 0) return null;

        const href = `/${displayPaths.slice(0, index + 1).join("/")}`;
        const isLast = index === displayPaths.length - 1;
        const label = routeLabels[path.toLowerCase()] || path.charAt(0).toUpperCase() + path.slice(1);

        return (
          <div key={path} className="flex items-center">
            <ChevronRight size={14} className="mx-1 text-slate-400" />
            {isLast ? (
              <span className="text-brand-primary font-bold">{label}</span>
            ) : (
              <Link
                href={href}
                className="hover:text-brand-primary transition-colors"
              >
                {label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
