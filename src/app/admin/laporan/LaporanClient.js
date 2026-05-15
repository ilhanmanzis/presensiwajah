"use client";

import { useState, useEffect } from "react";
import { 
  FileText, FileSpreadsheet, Search, 
  Calendar, Users, User, ChevronDown, 
  Download, AlertCircle, Info
} from "lucide-react";
import { toast } from "react-hot-toast";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { 
  exportIndividualPDF, exportIndividualExcel, 
  exportRekapPDF, exportRekapExcel 
} from "@/lib/exportUtils";

export default function LaporanClient({ teachers, settings }) {
  const [reportType, setReportType] = useState("individual"); // individual | rekap
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [monthYear, setMonthYear] = useState(format(new Date(), "yyyy-MM"));
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isGeneratingExcel, setIsGeneratingExcel] = useState(false);

  // Custom Select State
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTeacher, setSearchTeacher] = useState("");

  const filteredTeachers = teachers.filter(t =>
    t.nama_lengkap.toLowerCase().includes(searchTeacher.toLowerCase()) ||
    (t.nip && t.nip.toLowerCase().includes(searchTeacher.toLowerCase()))
  );

  const selectedTeacherData = teachers.find(t => t.id === selectedTeacher);

  const handleExport = async (formatType) => {
    if (!monthYear) {
      toast.error("Silakan pilih bulan dan tahun!");
      return;
    }

    if (reportType === "individual" && !selectedTeacher) {
      toast.error("Silakan pilih guru terlebih dahulu!");
      return;
    }

    const [year, month] = monthYear.split("-");
    if (formatType === "pdf") setIsGeneratingPDF(true);
    else setIsGeneratingExcel(true);

    try {
      const url = `/api/admin/reports?type=${reportType}&month=${month}&year=${year}${selectedTeacher ? `&userId=${selectedTeacher}` : ""}`;
      const res = await fetch(url);
      const result = await res.json();

      if (!res.ok) throw new Error(result.error || "Gagal mengambil data");

      if (!result.data || (Array.isArray(result.data) && result.data.length === 0)) {
        toast.error("Data presensi tidak ditemukan pada periode ini.");
        return;
      }

      if (reportType === "individual") {
        if (formatType === "pdf") {
          exportIndividualPDF(result.teacher, month, year, result.data, settings);
        } else {
          await exportIndividualExcel(result.teacher, month, year, result.data, settings);
        }
      } else {
        if (formatType === "pdf") {
          exportRekapPDF(month, year, result.data, settings);
        } else {
          await exportRekapExcel(month, year, result.data, settings);
        }
      }

      toast.success(`Laporan ${formatType.toUpperCase()} berhasil diunduh!`);
    } catch (error) {
      console.error(error);
      toast.error(error.message);
    } finally {
      if (formatType === "pdf") setIsGeneratingPDF(false);
      else setIsGeneratingExcel(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-black text-foreground tracking-tight">Ekspor Laporan Presensi</h1>
        <p className="text-nav-text opacity-70 font-medium">Pilih format dan periode laporan yang ingin diunduh.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Report Type Card */}
        <button 
          onClick={() => setReportType("individual")}
          className={`p-6 rounded-[2.5rem] border-2 transition-all flex flex-col items-center gap-4 text-center group ${reportType === "individual" ? "bg-brand-primary border-brand-primary text-white shadow-xl shadow-brand-primary/20 scale-105" : "bg-surface border-surface-border text-foreground hover:border-brand-primary/50"}`}
        >
          <div className={`p-4 rounded-2xl ${reportType === "individual" ? "bg-white/20" : "bg-brand-primary/10 text-brand-primary group-hover:scale-110 transition-transform"}`}>
            <User size={32} />
          </div>
          <div>
            <h3 className="font-black text-lg">Laporan Individu</h3>
            <p className={`text-xs mt-1 ${reportType === "individual" ? "text-white/70" : "text-nav-text"}`}>Detail kehadiran satu guru dalam sebulan.</p>
          </div>
        </button>

        <button 
          onClick={() => setReportType("rekap")}
          className={`p-6 rounded-[2.5rem] border-2 transition-all flex flex-col items-center gap-4 text-center group ${reportType === "rekap" ? "bg-brand-primary border-brand-primary text-white shadow-xl shadow-brand-primary/20 scale-105" : "bg-surface border-surface-border text-foreground hover:border-brand-primary/50"}`}
        >
          <div className={`p-4 rounded-2xl ${reportType === "rekap" ? "bg-white/20" : "bg-brand-primary/10 text-brand-primary group-hover:scale-110 transition-transform"}`}>
            <Users size={32} />
          </div>
          <div>
            <h3 className="font-black text-lg">Rekapitulasi Guru</h3>
            <p className={`text-xs mt-1 ${reportType === "rekap" ? "text-white/70" : "text-nav-text"}`}>Ringkasan kehadiran seluruh guru dalam sebulan.</p>
          </div>
        </button>
      </div>

      <div className="glass rounded-[3rem] p-8 md:p-10 shadow-2xl border border-surface-border bg-white dark:bg-surface/50">
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Filter Section */}
            {reportType === "individual" && (
              <div className="space-y-3 relative">
                <label className="text-sm font-black text-foreground ml-1 flex items-center gap-2">
                  <User size={16} className="text-brand-primary" />
                  Pilih Guru
                </label>
                <div
                  className="w-full px-5 py-4 rounded-2xl border border-surface-border bg-background hover:border-brand-primary/50 transition-all flex items-center justify-between cursor-pointer shadow-sm group"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                  <span className={`text-sm font-bold ${selectedTeacherData ? 'text-foreground' : 'text-nav-text opacity-50'}`}>
                    {selectedTeacherData ? selectedTeacherData.nama_lengkap : "Pilih Nama Guru..."}
                  </span>
                  <ChevronDown size={18} className={`text-nav-text transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </div>

                {isDropdownOpen && (
                  <div className="absolute z-50 top-full left-0 right-0 mt-3 bg-background border border-surface-border rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-72 animate-in fade-in slide-in-from-top-4">
                    <div className="p-4 border-b border-surface-border relative">
                      <Search size={16} className="absolute left-8 top-1/2 -translate-y-1/2 text-nav-text opacity-50" />
                      <input
                        type="text"
                        placeholder="Cari nama atau NIP..."
                        value={searchTeacher}
                        onChange={(e) => setSearchTeacher(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-white/5 border border-surface-border rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-brand-primary/50"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="overflow-y-auto p-3 custom-scrollbar">
                      {filteredTeachers.length === 0 ? (
                        <div className="p-6 text-center text-sm text-nav-text font-medium">Guru tidak ditemukan.</div>
                      ) : (
                        filteredTeachers.map(t => (
                          <div
                            key={t.id}
                            onClick={() => {
                              setSelectedTeacher(t.id);
                              setIsDropdownOpen(false);
                              setSearchTeacher("");
                            }}
                            className={`p-4 rounded-xl text-sm font-bold cursor-pointer transition-all flex flex-col gap-0.5 ${selectedTeacher === t.id ? 'bg-brand-primary text-white' : 'text-foreground hover:bg-brand-primary/10 hover:text-brand-primary'}`}
                          >
                            <span>{t.nama_lengkap}</span>
                            <span className={`text-[10px] ${selectedTeacher === t.id ? 'text-white/70' : 'text-nav-text opacity-60'}`}>{t.nip || "Tanpa NIP"}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className={`space-y-3 ${reportType === "rekap" ? "md:col-span-2" : ""}`}>
              <label className="text-sm font-black text-foreground ml-1 flex items-center gap-2">
                <Calendar size={16} className="text-brand-primary" />
                Pilih Periode
              </label>
              <input
                type="month"
                value={monthYear}
                onChange={(e) => setMonthYear(e.target.value)}
                onClick={(e) => e.target.showPicker()}
                className="w-full px-5 py-4 rounded-2xl border border-surface-border bg-background focus:ring-2 focus:ring-brand-primary/50 outline-none transition-all shadow-sm font-bold text-sm text-foreground cursor-pointer"
              />
            </div>
          </div>

          <div className="pt-6 border-t border-surface-border">
            <div className="grid grid-cols-2 gap-3 md:gap-4">
              <button
                onClick={() => handleExport("pdf")}
                disabled={isGeneratingPDF || isGeneratingExcel}
                className="h-14 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-red-500/20 transition-all hover:-translate-y-1 active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {isGeneratingPDF ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <><FileText size={18} /> <span className="hidden xs:inline">Unduh</span> PDF</>}
              </button>
              
              <button
                onClick={() => handleExport("excel")}
                disabled={isGeneratingPDF || isGeneratingExcel}
                className="h-14 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-green-600/20 transition-all hover:-translate-y-1 active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {isGeneratingExcel ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <><FileSpreadsheet size={18} /> <span className="hidden xs:inline">Unduh</span> Excel</>}
              </button>
            </div>
          </div>

          <div className="p-4 bg-blue-50 dark:bg-blue-500/5 rounded-2xl border border-blue-100 dark:border-blue-500/10 flex items-start gap-3">
            <Info size={18} className="text-blue-500 mt-0.5 shrink-0" />
            <p className="text-xs text-blue-700 dark:text-blue-400 font-medium leading-relaxed">
              Laporan akan diunduh secara otomatis. Pastikan browser Anda tidak memblokir pop-up unduhan. Data yang ditampilkan mencakup jam masuk, jam pulang, dan status kehadiran.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
