import { PrismaClient } from "@prisma/client";
import { getSession } from "@/lib/auth";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

const prisma = new PrismaClient();

export default async function GuruDashboardPage() {
  const session = await getSession();
  const userId = session?.user?.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      attendances: {
        orderBy: { tanggal: "desc" },
        take: 5,
      }
    }
  });

  if (!user) return <div>User not found</div>;

  const targetDateStr = format(new Date(), "yyyy-MM-dd");
  const todayAtt = user.attendances.find(att => format(new Date(att.tanggal), "yyyy-MM-dd") === targetDateStr);
  
  const hasIn = !!todayAtt?.jam_masuk;
  const hasOut = !!todayAtt?.jam_pulang;

  let statusText = "Belum Presensi";
  let statusColor = "text-red-600 dark:text-red-400";
  let dotColor = "bg-red-500 shadow-red-500/50";

  if (hasIn && hasOut) {
    statusText = "Presensi Selesai";
    statusColor = "text-green-600 dark:text-green-400";
    dotColor = "bg-green-500 shadow-green-500/50";
  } else if (hasIn) {
    statusText = "Anda belum presensi pulang";
    statusColor = "text-amber-600 dark:text-amber-400";
    dotColor = "bg-amber-500 shadow-amber-500/50";
  } else if (todayAtt?.status && todayAtt.status !== "Hadir") {
    statusText = `Status: ${todayAtt.status}`;
    statusColor = "text-blue-600 dark:text-blue-400";
    dotColor = "bg-blue-500 shadow-blue-500/50";
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      {/* Welcome Card */}
      <div className="glass rounded-2xl p-8 md:p-10 relative overflow-hidden bg-brand-primary text-white border-none shadow-xl shadow-brand-primary/20">
        <div className="relative z-10">
          <p className="text-white/80 font-medium mb-2 uppercase tracking-widest text-[10px]">Dashboard Guru</p>
          <h1 className="text-3xl md:text-4xl font-extrabold mb-2 tracking-tight">Halo, {user.nama_lengkap}</h1>
          <p className="text-white/70 font-medium italic">Selamat datang di sistem presensi cerdas sekolah.</p>
        </div>

        {/* Decor */}
        <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-400/20 rounded-full blur-2xl"></div>
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl"></div>
      </div>

      {/* Status Card */}
      <div className="glass rounded-2xl p-6 bg-surface shadow-sm border border-surface-border">
        <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
          <div className="w-2 h-6 bg-brand-primary rounded-full"></div>
          Status Hari Ini
        </h2>
        <div className="flex items-center justify-between p-6 rounded-2xl bg-background border border-surface-border transition-all hover:border-brand-primary/20">
          <div>
            <p className="text-xs font-bold text-nav-text uppercase tracking-wider">{format(new Date(), "EEEE, dd MMMM yyyy", { locale: localeId })}</p>
            <p className={`text-xl font-extrabold mt-1 ${statusColor}`}>
              {statusText}
            </p>
          </div>
          <div className={`w-6 h-6 rounded-full ${dotColor} shadow-lg animate-pulse`}></div>
        </div>
      </div>

      {/* History Card */}
      <div className="glass rounded-2xl p-6 bg-surface shadow-sm border border-surface-border">
        <h2 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
          <div className="w-2 h-6 bg-brand-secondary rounded-full"></div>
          Riwayat Terakhir
        </h2>
        {user.attendances.length === 0 ? (
          <div className="text-center py-10 opacity-50">
            <p className="text-nav-text font-medium">Belum ada riwayat presensi.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {user.attendances.map((att) => (
              <div key={att.id} className="flex justify-between items-center p-4 rounded-2xl bg-background border border-surface-border hover:border-brand-primary/30 transition-all group">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-foreground group-hover:text-brand-primary transition-colors text-sm md:text-base">
                      {format(new Date(att.tanggal), "dd MMM yyyy", { locale: localeId })}
                    </p>
                    <span className={`text-[9px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded border border-surface-border ${
                      att.jam_pulang ? "bg-green-500 text-white" : "bg-slate-100 dark:bg-slate-800 text-nav-text"
                    }`}>
                      {att.jam_pulang ? "Selesai" : (att.jam_masuk ? "Aktif" : att.status)}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 mt-0.5">
                    {att.jam_masuk && (
                      <p className="text-[10px] md:text-xs font-medium text-nav-text">
                        Masuk: {format(new Date(att.jam_masuk), "HH:mm")}
                      </p>
                    )}
                    {att.jam_pulang && (
                      <p className="text-[10px] md:text-xs font-medium text-nav-text">
                        Pulang: {format(new Date(att.jam_pulang), "HH:mm")}
                      </p>
                    )}
                    {att.ket_masuk && att.ket_masuk !== "Tepat Waktu" && (
                      <span className="text-[10px] md:text-xs font-black text-red-500 flex items-center gap-1">
                        <div className="w-1 h-1 bg-red-500 rounded-full animate-pulse"></div>
                        {att.ket_masuk}
                      </span>
                    )}
                  </div>
                </div>
                <span className={`px-4 py-1.5 rounded-xl text-[10px] md:text-xs font-bold shadow-sm border ${att.status === "Hadir" ? "bg-green-50 text-green-700 border-green-100 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20" :
                  att.status === "Izin" ? "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20" :
                    "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20"
                  }`}>
                  {att.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
