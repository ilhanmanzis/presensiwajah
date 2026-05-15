"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { ChevronLeft, Calendar, UserCheck, AlertCircle, Search, ChevronDown, Eye, X, MapPin } from "lucide-react";
import Link from "next/link";

export default function BulananClient({ teachers, initialTeacherId, initialMonth, initialYear, attendanceData }) {
  const router = useRouter();

  // Format the month/year for the input type="month" (YYYY-MM)
  const formattedMonth = initialMonth < 10 ? `0${initialMonth}` : initialMonth;
  const initialMonthYear = `${initialYear}-${formattedMonth}`;

  const [selectedTeacher, setSelectedTeacher] = useState(initialTeacherId || "");
  const [monthYear, setMonthYear] = useState(initialMonthYear);
  const [loading, setLoading] = useState(false);

  // Custom Select State
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTeacher, setSearchTeacher] = useState("");

  const filteredTeachers = teachers.filter(t =>
    t.nama_lengkap.toLowerCase().includes(searchTeacher.toLowerCase()) ||
    (t.nip && t.nip.toLowerCase().includes(searchTeacher.toLowerCase()))
  );

  const selectedTeacherData = teachers.find(t => t.id === selectedTeacher);

  const handleFilter = () => {
    if (!selectedTeacher || !monthYear) return;

    setLoading(true);
    const [year, month] = monthYear.split("-");
    router.push(`/admin/presensi/bulanan?teacherId=${selectedTeacher}&month=${month}&year=${year}`);
    setTimeout(() => setLoading(false), 1000);
  };

  const filteredAttendanceData = attendanceData;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <div className="flex items-center gap-4">

        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">Presensi Bulanan</h1>
          <p className="text-sm font-medium text-nav-text opacity-70 mt-1">
            Lihat detail kehadiran guru per bulan.
          </p>
        </div>
      </div>

      {/* Filter Section */}
      <div className="rounded-[2rem] p-6 md:p-8 bg-white dark:bg-surface shadow-xl border border-surface-border">
        <h2 className="text-lg font-black text-foreground mb-6 flex items-center gap-2">
          Filter Presensi Bulanan Guru
        </h2>

        <div className="flex flex-col md:flex-row items-end gap-6">
          <div className="w-full space-y-2 relative">
            <label className="text-xs font-bold text-foreground flex items-center gap-1">
              Guru<span className="text-red-500">*</span>
            </label>
            <div
              className="w-full px-4 py-3 rounded-xl border border-surface-border bg-background hover:border-brand-primary/50 transition-all flex items-center justify-between cursor-pointer"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <span className={`text-sm font-semibold ${selectedTeacherData ? 'text-foreground' : 'text-nav-text opacity-70'}`}>
                {selectedTeacherData ? `${selectedTeacherData.nip ? `${selectedTeacherData.nip} - ` : ''}${selectedTeacherData.nama_lengkap}` : "Pilih Guru..."}
              </span>
              <ChevronDown size={16} className={`text-nav-text transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </div>

            {isDropdownOpen && (
              <div className="absolute z-50 top-full left-0 right-0 mt-2 bg-background border border-surface-border rounded-xl shadow-xl overflow-hidden flex flex-col max-h-64">
                <div className="p-3 border-b border-surface-border relative">
                  <Search size={14} className="absolute left-6 top-1/2 -translate-y-1/2 text-nav-text opacity-50" />
                  <input
                    type="text"
                    placeholder="Cari nama atau NIP..."
                    value={searchTeacher}
                    onChange={(e) => setSearchTeacher(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-surface border border-surface-border rounded-lg text-sm outline-none focus:ring-1 focus:ring-brand-primary"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                <div className="overflow-y-auto p-2">
                  {filteredTeachers.length === 0 ? (
                    <div className="p-4 text-center text-xs text-nav-text">Guru tidak ditemukan.</div>
                  ) : (
                    filteredTeachers.map(t => (
                      <div
                        key={t.id}
                        onClick={() => {
                          setSelectedTeacher(t.id);
                          setIsDropdownOpen(false);
                          setSearchTeacher("");
                        }}
                        className={`p-3 rounded-lg text-sm font-semibold cursor-pointer hover:bg-brand-primary/10 hover:text-brand-primary transition-colors ${selectedTeacher === t.id ? 'bg-brand-primary/10 text-brand-primary' : 'text-foreground'}`}
                      >
                        {t.nip ? `${t.nip} - ` : ''}{t.nama_lengkap}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="w-full space-y-2">
            <label className="text-xs font-bold text-foreground">
              Bulan & Tahun
            </label>
            <div className="relative">
              <input
                type="month"
                value={monthYear}
                onChange={(e) => setMonthYear(e.target.value)}
                onClick={(e) => e.target.showPicker()}
                className="w-full px-4 py-3 rounded-xl border border-surface-border bg-background focus:ring-2 focus:ring-brand-primary outline-none transition-all text-sm font-semibold text-foreground cursor-pointer"
              />
            </div>
          </div>

          <button
            onClick={handleFilter}
            disabled={loading || !selectedTeacher || !monthYear}
            className="w-full md:w-auto px-8 py-3 bg-brand-primary text-white font-bold rounded-xl shadow-lg shadow-brand-primary/20 hover:bg-purple-700 transition-all flex items-center justify-center disabled:opacity-50 cursor-pointer whitespace-nowrap"
          >
            {loading ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : "Tampilkan"}
          </button>
        </div>
      </div>

      {/* Data Section */}
      <div className="rounded-[2rem] overflow-hidden bg-white dark:bg-surface shadow-xl border border-surface-border mt-8">
        <div className="px-8 py-6 border-b border-surface-border flex items-center justify-between bg-surface">
          <h2 className="text-xl font-black text-foreground tracking-tight flex items-center gap-3">
            <div className="w-2 h-6 bg-brand-primary rounded-full"></div>
            Data Presensi {format(new Date(initialYear, initialMonth - 1), "MMMM yyyy", { locale: id })}
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="text-[10px] text-foreground font-black uppercase tracking-[0.2em] opacity-70 border-b border-surface-border">
              <tr>
                <th className="px-6 py-5 border-b border-surface-border text-center">No</th>
                <th className="px-6 py-5 border-b border-surface-border">Tanggal</th>
                <th className="px-6 py-5 border-b border-surface-border">Presensi Masuk</th>
                <th className="px-6 py-5 border-b border-surface-border">Presensi Pulang</th>
                <th className="px-6 py-5 border-b border-surface-border text-center">Status</th>
                <th className="px-6 py-5 border-b border-surface-border text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredAttendanceData.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-nav-text">
                    <div className="flex flex-col items-center gap-2 opacity-50">
                      <AlertCircle size={48} className="mb-2" />
                      <p className="font-bold">Tidak ada data presensi.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAttendanceData.map((data, index) => (
                  <tr key={index} className="transition-all hover:bg-slate-50/[0.05] dark:hover:bg-slate-800/20">
                    <td className="px-6 py-4 text-center font-bold text-nav-text border-b border-surface-border">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 border-b border-surface-border">
                      <span className="text-sm font-bold text-foreground">
                        {data.dateStr}
                      </span>
                    </td>
                    <td className="px-6 py-4 border-b border-surface-border">
                      {data.masuk ? (
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-foreground">{format(new Date(data.masuk.waktu), "HH:mm")}</span>
                            <span className="text-[10px] font-bold text-nav-text opacity-60">WIB</span>
                          </div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {data.masuk.keterangan && data.masuk.keterangan !== "Tepat Waktu" && (
                              <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded border w-fit bg-red-50 text-red-600 border-red-100 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20">
                                {data.masuk.keterangan}
                              </span>
                            )}
                            {data.masuk.catatan && data.masuk.catatan !== "Di dalam radius" && (
                              <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded border w-fit bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20">
                                {data.masuk.catatan}
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest italic">--:--</span>
                      )}
                    </td>
                    <td className="px-6 py-4 border-b border-surface-border">
                      {data.pulang ? (
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-foreground">{format(new Date(data.pulang.waktu), "HH:mm")}</span>
                            <span className="text-[10px] font-bold text-nav-text opacity-60">WIB</span>
                          </div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {data.pulang.catatan && data.pulang.catatan !== "Di dalam radius" && (
                              <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded border w-fit bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20">
                                {data.pulang.catatan}
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest italic">--:--</span>
                      )}
                    </td>
                    <td className="px-6 py-4 border-b border-surface-border text-center">
                      <div className="flex items-center justify-center">
                        <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${data.status === "Hadir" ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20" :
                          data.status === "Izin" ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20" :
                            "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20"
                          }`}>
                          {data.status === "Hadir" && <UserCheck size={14} />}
                          {data.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 border-b border-surface-border text-center">
                      <button
                        onClick={() => router.push(`/admin/presensi/detail?teacherId=${selectedTeacher}&date=${format(new Date(data.date), "yyyy-MM-dd")}`)}
                        className="cursor-pointer p-2 bg-brand-primary/10 hover:bg-brand-primary text-brand-primary hover:text-white rounded-xl transition-colors inline-flex items-center justify-center"
                        title="Lihat Detail"
                      >
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>    </div>
  );
}
