import { PrismaClient } from "@prisma/client";
import { Users, UserCheck, Clock, UserX } from "lucide-react";
import { formatWIB } from "@/lib/dateUtils";

const prisma = new PrismaClient();

export default async function AdminDashboard() {
  const now = new Date();
  const jakartaFormatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  
  const parts = jakartaFormatter.formatToParts(now);
  const getValue = (type) => parts.find(p => p.type === type).value;
  const targetDate = new Date(`${getValue('year')}-${getValue('month')}-${getValue('day')}T00:00:00.000Z`);

  // Fetch stats
  const totalGuru = await prisma.user.count({
    where: { role: "GURU" },
  });

  const presentToday = await prisma.attendance.count({
    where: {
      tanggal: targetDate,
      status: "Hadir",
    },
  });

  const sickOrPermitToday = await prisma.attendance.count({
    where: {
      tanggal: targetDate,
      status: { in: ["Izin", "Sakit", "Dinas Luar"] },
    },
  });

  const todayAttendances = await prisma.attendance.findMany({
    where: {
      tanggal: targetDate,
    },
    include: {
      user: true,
    },
    orderBy: {
      jam_masuk: "desc",
    },
  });

  // Simple mapping since one row now equals one day's data
  const finalAttendances = todayAttendances;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">Dashboard Admin</h1>
          <p className="text-sm font-medium text-nav-text opacity-70 mt-1">
            Kelola kehadiran dan data guru secara real-time.
          </p>
        </div>
        <div className="px-5 py-2.5 bg-surface border border-surface-border rounded-2xl shadow-sm flex items-center gap-3">
          <div className="w-2 h-2 bg-brand-primary rounded-full animate-ping"></div>
          <p className="text-sm font-bold text-foreground">
            {formatWIB(new Date(), "EEEE, dd MMMM yyyy")}
          </p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard
          title="Total Guru"
          value={totalGuru}
          icon={<Users size={24} />}
          color="brand"
        />
        <StatCard
          title="Hadir Hari Ini"
          value={presentToday}
          icon={<UserCheck size={24} />}
          color="green"
        />
        <StatCard
          title="Belum Hadir Hari Ini"
          value={totalGuru - presentToday > 0 ? totalGuru - presentToday : 0}
          icon={<Clock size={24} />}
          color="amber"
        />
        <StatCard
          title="Izin / Sakit Hari Ini"
          value={sickOrPermitToday}
          icon={<UserX size={24} />}
          color="red"
        />
      </div>

      {/* Recent Attendances */}
      <div className="glass rounded-[2.5rem] overflow-hidden bg-surface shadow-xl border border-surface-border">
        <div className="px-8 py-6 border-b border-surface-border flex items-center justify-between bg-surface">
          <h2 className="text-xl font-black text-foreground tracking-tight flex items-center gap-3">
            <div className="w-2 h-6 bg-brand-primary rounded-full shadow-lg shadow-brand-primary/20"></div>
            Presensi Terbaru Hari ini
          </h2>

        </div>

        <div className="p-2">
          {finalAttendances.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 opacity-50">
                <Clock size={32} />
              </div>
              <p className="text-slate-500 font-bold">Belum ada data presensi hari ini.</p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="text-[10px] text-foreground font-black uppercase tracking-[0.2em] opacity-70 ">
                    <tr>
                      <th className="px-4 py-5 text-center border-b border-surface-border">No</th>
                      <th className="px-6 py-5 border-b border-surface-border">Nama</th>
                      <th className="px-6 py-5 border-b border-surface-border">NPP/NIP</th>
                      <th className="px-6 py-5 border-b border-surface-border">Presensi Masuk</th>
                      <th className="px-6 py-5 border-b border-surface-border">Presensi Pulang</th>
                      <th className="px-6 py-5 text-center border-b border-surface-border">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {finalAttendances.map((data, index) => (
                      <tr key={data.id} className="group transition-all hover:bg-slate-50/[0.02] dark:hover:bg-slate-800/20">
                        <td className="px-4 py-5 text-center font-bold text-nav-text border-b border-surface-border">
                          {index + 1}
                        </td>
                        <td className="px-6 py-5 border-b border-surface-border">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary font-bold text-sm">
                              {data.user.nama_lengkap.charAt(0)}
                            </div>
                            <span className="font-bold text-foreground text-sm tracking-tight">{data.user.nama_lengkap}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5 border-b border-surface-border">
                          <span className="text-xs font-bold text-nav-text">{data.user.nip || "-"}</span>
                        </td>

                        <td className="px-6 py-5 border-b border-surface-border">
                          {data.jam_masuk ? (
                            <div className="flex flex-col gap-1">
                              <span className="text-sm font-black text-foreground">{formatWIB(data.jam_masuk, "HH:mm")} WIB</span>
                              <div className="flex flex-wrap gap-1">
                                {data.ket_masuk && data.ket_masuk !== "Tepat Waktu" && (
                                  <span className="px-2 py-0.5 bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 rounded text-[9px] font-black uppercase border border-red-100 dark:border-red-500/20">{data.ket_masuk}</span>
                                )}
                                {data.catatan_masuk && data.catatan_masuk !== "Di dalam radius" && (
                                  <span className="px-2 py-0.5 bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 rounded text-[9px] font-black uppercase border border-amber-100 dark:border-amber-500/20">{data.catatan_masuk}</span>
                                )}
                              </div>
                            </div>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Belum Masuk</span>
                          )}
                        </td>
                        <td className="px-6 py-5 border-b border-surface-border">
                          {data.jam_pulang ? (
                            <div className="flex flex-col gap-1">
                              <span className="text-sm font-black text-foreground">{formatWIB(data.jam_pulang, "HH:mm")} WIB</span>
                              <div className="flex flex-wrap gap-1">
                                {data.catatan_pulang && data.catatan_pulang !== "Di dalam radius" && (
                                  <span className="px-2 py-0.5 bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 rounded text-[9px] font-black uppercase border border-amber-100 dark:border-amber-500/20">{data.catatan_pulang}</span>
                                )}
                              </div>
                            </div>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Belum Pulang</span>
                          )}
                        </td>
                        <td className="px-6 py-5 border-b border-surface-border text-center">
                          {data.status !== "Alfa" ? (
                            <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm border ${data.status === "Hadir" ? "bg-green-50 text-green-700 border-green-100 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20" :
                              data.status === "Izin" ? "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20" :
                                "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20"
                              }`}>
                              {data.status}
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-300 uppercase">Alfa</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile List View */}
              <div className="md:hidden space-y-3 p-4">
                {finalAttendances.map((data) => (
                  <div key={data.id} className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/40 border border-surface-border transition-all">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary font-bold">
                        {data.user.nama_lengkap.charAt(0)}
                      </div>
                      <div className="flex flex-col">
                        <h4 className="font-bold text-foreground text-sm tracking-tight">{data.user.nama_lengkap}</h4>
                        <span className="text-[10px] text-nav-text font-bold opacity-60 uppercase">{data.user.nip || "-"}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-surface-border/50">
                      <div>
                        <p className="text-[9px] font-black text-nav-text uppercase tracking-widest opacity-50 mb-1">Masuk</p>
                        {data.jam_masuk ? (
                          <div className="flex flex-col gap-1">
                            <span className="text-xs font-black text-foreground">{formatWIB(data.jam_masuk, "HH:mm")} WIB</span>
                            {data.ket_masuk && data.ket_masuk !== "Tepat Waktu" && (
                              <span className="text-[8px] font-black text-red-500 uppercase">{data.ket_masuk}</span>
                            )}
                            {data.catatan_masuk && data.catatan_masuk !== "Di dalam radius" && (
                              <span className="text-[8px] font-black text-amber-500 uppercase">Luar Radius</span>
                            )}
                          </div>
                        ) : <span className="text-xs font-bold text-slate-300 italic">--:--</span>}
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-nav-text uppercase tracking-widest opacity-50 mb-1">Pulang</p>
                        {data.jam_pulang ? (
                          <div className="flex flex-col gap-1">
                            <span className="text-xs font-black text-foreground">{formatWIB(data.jam_pulang, "HH:mm")} WIB</span>
                            {data.catatan_pulang && data.catatan_pulang !== "Di dalam radius" && (
                              <span className="text-[8px] font-black text-amber-500 uppercase">Luar Radius</span>
                            )}
                          </div>
                        ) : <span className="text-xs font-bold text-slate-300 italic">--:--</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }) {
  const colorMap = {
    brand: "bg-brand-primary/10 text-brand-primary border-brand-primary/20",
    green: "bg-green-500/10 text-green-500 border-green-500/20",
    amber: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    red: "bg-red-500/10 text-red-500 border-red-500/20",
  };

  return (
    <div className="glass rounded-[2.5rem] p-6 border border-surface-border bg-surface shadow-sm hover:shadow-xl hover:border-brand-primary/20 transition-all group relative overflow-hidden">
      <div className="absolute -right-4 -top-4 w-24 h-24 bg-brand-primary opacity-[0.03] rounded-full group-hover:scale-150 transition-transform duration-700"></div>
      <div className="relative z-10 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-black text-nav-text uppercase tracking-widest mb-2 opacity-70">{title}</p>
          <h3 className="text-3xl font-black text-foreground tracking-tighter">{value}</h3>
        </div>
        <div className={`p-4 rounded-2xl border shadow-inner ${colorMap[color] || colorMap.brand}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
