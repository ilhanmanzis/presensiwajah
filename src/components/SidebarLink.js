"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function SidebarLink({ href, icon, label, mode = "sidebar", onClick }) {
  const pathname = usePathname();
  const isActive = (href === "/admin" || href === "/guru") 
    ? pathname === href 
    : pathname === href || pathname.startsWith(`${href}/`);

  if (mode === "mobile") {
    return (
      <Link 
        href={href} 
        onClick={onClick}
        className={`flex flex-col items-center justify-center w-full h-full transition-all ${
          isActive 
            ? "text-brand-primary scale-110" 
            : "text-slate-500 hover:text-brand-primary dark:hover:text-purple-400"
        }`}
      >
        <div className="mb-1">{icon}</div>
        <span className="text-[10px] font-bold">{label}</span>
      </Link>
    );
  }

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all font-medium ${
        isActive
          ? "bg-brand-primary text-white shadow-lg shadow-purple-500/20 dark:shadow-purple-500/10"
          : "text-nav-text hover:bg-brand-primary/10 hover:text-brand-primary"
      }`}
    >
      <div className={isActive ? "text-white" : ""}>
        {icon}
      </div>
      <span>{label}</span>
    </Link>
  );
}
