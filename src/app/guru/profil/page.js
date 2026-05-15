import { PrismaClient } from "@prisma/client";
import { getSession } from "@/lib/auth";
import { User, Mail, CreditCard, Calendar, LogOut } from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { logoutAction } from "@/app/actions/auth";

const prisma = new PrismaClient();

export default async function ProfilPage() {
  const session = await getSession();
  const userId = session?.user?.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) return null;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <div className="flex items-center gap-3">
        <div className="w-2 h-8 bg-brand-primary rounded-full shadow-lg shadow-brand-primary/20"></div>
        <h1 className="text-3xl font-black text-foreground tracking-tight">Profil Pribadi</h1>
      </div>

      <div className="glass rounded-[2rem] p-8 bg-surface shadow-xl border border-surface-border relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity rotate-12 hidden md:block">
          <User size={120} />
        </div>

        <div className="flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-8 relative z-10">
          <div className="w-28 h-28 rounded-[2.5rem] bg-brand-primary/10 border-2 border-brand-primary/20 flex items-center justify-center text-brand-primary text-4xl font-black shadow-inner flex-shrink-0">
            {user.nama_lengkap.charAt(0)}
          </div>
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-2xl font-black text-foreground tracking-tight mb-1">{user.nama_lengkap}</h2>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-brand-primary/10 text-brand-primary rounded-full text-[10px] font-black uppercase tracking-widest border border-brand-primary/10">
              <div className="w-1.5 h-1.5 bg-brand-primary rounded-full animate-pulse"></div>
              {user.role}
            </div>

            <div className="mt-6 flex flex-wrap gap-3 justify-center md:justify-start">
              {user.face_descriptor ? (
                <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400 rounded-xl text-[11px] font-bold border border-green-100 dark:border-green-500/20">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Wajah Terverifikasi
                </div>
              ) : (
                <div className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400 rounded-xl text-[11px] font-bold border border-red-100 dark:border-red-500/20">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  Belum Registrasi Wajah
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="glass rounded-[2rem] overflow-hidden bg-surface shadow-sm border border-surface-border">
        <div className="px-8 py-5 bg-brand-primary relative">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-transparent opacity-50"></div>
          <h3 className="font-black text-white text-[11px] uppercase tracking-[0.3em] relative z-10">Informasi Lengkap</h3>
        </div>
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
          <ProfileItem icon={<User size={18} />} label="Nama Lengkap" value={user.nama_lengkap} />
          <ProfileItem icon={<Mail size={18} />} label="Alamat Email" value={user.email} />
          <ProfileItem icon={<CreditCard size={18} />} label="Nomor Induk Pegawai (NIP)" value={user.nip || "Belum diatur"} />
        </div>
      </div>

      <div className="glass rounded-[2rem] p-8 border border-surface-border bg-surface shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="text-center md:text-left">
          <p className="text-xs font-bold text-foreground">Butuh Perubahan Data?</p>
          <p className="text-[11px] text-nav-text mt-1">Silakan hubungi Administrator untuk mengubah informasi profil Anda.</p>
        </div>

        <form action={logoutAction} className="w-full md:w-auto">
          <button
            type="submit"
            className="w-full md:px-10 py-4 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-black transition-all flex items-center justify-center gap-3 cursor-pointer shadow-xl shadow-red-500/20 active:scale-95"
          >
            <LogOut size={20} />
            LOGOUT
          </button>
        </form>
      </div>
    </div>
  );
}

function ProfileItem({ icon, label, value }) {
  return (
    <div className="flex items-start gap-4 group">
      <div className="mt-1 p-2.5 rounded-xl bg-brand-primary/5 text-brand-primary group-hover:bg-brand-primary group-hover:text-white transition-all duration-300">
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-black text-nav-text uppercase tracking-widest opacity-50 mb-1">{label}</p>
        <p className="text-base font-bold text-foreground tracking-tight">{value}</p>
      </div>
    </div>
  );
}
