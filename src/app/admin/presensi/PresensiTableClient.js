"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatWIB } from "@/lib/dateUtils";
import { Calendar, Filter, FileText, ChevronRight, Clock, MapPin, UserCheck, AlertCircle } from "lucide-react";

export default function PresensiTableClient({ initialData, selectedDate }) {
  const router = useRouter();
  const [date, setDate] = useState(selectedDate);
  const [loading, setLoading] = useState(false);

  const handleFilter = () => {
    setLoading(true);
    router.push(`/admin/presensi?date=${date}`);
    setTimeout(() => setLoading(false), 1000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">Daftar Presensi Guru</h1>
          <p className="text-sm font-medium text-nav-text opacity-70 mt-1">
            Pantau dan kelola kehadiran guru harian.
          </p>
        </div>
      </div>

      {/* Container 1: Filters & Navigation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass rounded-3xl p-6 bg-surface shadow-sm border border-surface-border flex flex-col md:flex-row items-end gap-4">
          <div className="w-full space-y-2">
            <label className="text-[10px] uppercase tracking-widest font-black text-nav-text opacity-60 ml-1 flex items-center gap-2">
              <Calendar size={12} />
              Pilih Tanggal
            </label>
            <div className="relative">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                onClick={(e) => e.target.showPicker()}
                className="w-full pl-4 pr-10 py-3 rounded-2xl border border-surface-border bg-background focus:ring-2 focus:ring-brand-primary outline-none transition-all font-bold text-foreground cursor-pointer"
              />
            </div>
          </div>
          <button
            onClick={handleFilter}
            disabled={loading}
            className="w-full md:w-auto px-8 py-3 bg-brand-primary text-white font-bold rounded-2xl shadow-lg shadow-brand-primary/20 hover:bg-purple-700 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {loading ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Filter size={18} />}
            <span>Tampilkan</span>
          </button>
        </div>

        <div className="glass rounded-3xl p-6 bg-surface shadow-sm border border-surface-border flex items-center">
          <button
            onClick={() => router.push("/admin/presensi/bulanan")}
            className="w-full group flex items-center justify-between p-4 bg-brand-primary/5 dark:bg-brand-primary/10 hover:bg-brand-primary hover:text-white rounded-2xl transition-all duration-300 border border-brand-primary/10 hover:border-brand-primary/20 cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-brand-primary/10 dark:bg-brand-primary/20 rounded-xl group-hover:bg-brand-primary/20 group-hover:text-white text-brand-primary shadow-sm transition-colors">
                <FileText size={24} />
              </div>
              <div className="text-left text-foreground group-hover:text-white transition-colors">
                <p className="text-sm font-black tracking-tight">Presensi Bulanan</p>
                <p className="text-[10px] font-medium opacity-70">Lihat rekap per guru</p>
              </div>
            </div>
            <ChevronRight size={20} className="opacity-0 group-hover:opacity-100 transition-opacity translate-x-[-10px] group-hover:translate-x-0" />
          </button>
        </div>
      </div>

      {/* Container 2: Attendance Table */}
      <div className="glass rounded-[2.5rem] overflow-hidden bg-surface shadow-xl border border-surface-border">
        <div className="px-8 py-6 border-b border-surface-border flex items-center justify-between bg-surface">
          <h2 className="text-xl font-black text-foreground tracking-tight flex items-center gap-3">
            <div className="w-2 h-6 bg-brand-primary rounded-full"></div>
            Data Presensi: {formatWIB(new Date(selectedDate), "dd MMMM yyyy")}
          </h2>
        </div>

        <div className="overflow-x-auto">
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
              {initialData.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-3 opacity-30">
                      <Clock size={48} />
                      <p className="font-bold">Belum ada data presensi pada tanggal ini.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                initialData.map((teacher, index) => (
                  <tr key={teacher.id} className="group transition-all hover:bg-slate-50/[0.02] dark:hover:bg-slate-800/20">
                    <td className="px-8 py-5 text-center font-bold text-nav-text border-b border-surface-border">
                      {index + 1}
                    </td>
                    <td className="px-6 py-5 border-b border-surface-border">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center text-brand-primary font-bold text-sm">
                          {teacher.nama_lengkap.charAt(0)}
                        </div>
                        <span className="font-bold text-foreground text-sm tracking-tight">{teacher.nama_lengkap}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 border-b border-surface-border">
                      <span className="text-xs font-bold text-nav-text">{teacher.nip || "-"}</span>
                    </td>
                    <td className="px-6 py-5 border-b border-surface-border">
                      {teacher.jam_masuk ? (
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-foreground">{formatWIB(teacher.jam_masuk, "HH:mm")}</span>
                            <span className="text-[10px] font-bold text-nav-text opacity-60">WIB</span>
                          </div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {teacher.ket_masuk && teacher.ket_masuk !== "Tepat Waktu" && (
                              <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded border w-fit bg-red-50 text-red-600 border-red-100 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20">
                                {teacher.ket_masuk}
                              </span>
                            )}
                            {teacher.catatan_masuk && teacher.catatan_masuk !== "Di dalam radius" && (
                              <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded border w-fit bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20">
                                {teacher.catatan_masuk}
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest italic">--:--</span>
                      )}
                    </td>
                    <td className="px-6 py-5 border-b border-surface-border">
                      {teacher.jam_pulang ? (
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-foreground">{formatWIB(teacher.jam_pulang, "HH:mm")}</span>
                            <span className="text-[10px] font-bold text-nav-text opacity-60">WIB</span>
                          </div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {teacher.catatan_pulang && teacher.catatan_pulang !== "Di dalam radius" && (
                              <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded border w-fit bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20">
                                {teacher.catatan_pulang}
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest italic">--:--</span>
                      )}
                    </td>
                    <td className="px-6 py-5 border-b border-surface-border text-center">
                      {teacher.status !== "Alfa" ? (
                        <div className="flex items-center justify-center">
                          <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
                            teacher.status === "Hadir" ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20" :
                            teacher.status === "Izin" ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20" :
                            "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20"
                          }`}>
                            <UserCheck size={14} />
                            {teacher.status}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center">
                          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest">
                            <AlertCircle size={14} />
                            Alfa
                          </span>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
