"use client";

import { useState } from "react";
import { 
  FileText, FileSpreadsheet,
  Calendar, Download, Info
} from "lucide-react";
import { toast } from "react-hot-toast";
import { format } from "date-fns";
import { 
  exportIndividualPDF, exportIndividualExcel
} from "@/lib/exportUtils";

export default function GuruLaporanClient({ teacher, settings }) {
  const [monthYear, setMonthYear] = useState(format(new Date(), "yyyy-MM"));
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isGeneratingExcel, setIsGeneratingExcel] = useState(false);

  const handleExport = async (formatType) => {
    if (!monthYear) {
      toast.error("Silakan pilih bulan dan tahun!");
      return;
    }

    const [year, month] = monthYear.split("-");
    if (formatType === "pdf") setIsGeneratingPDF(true);
    else setIsGeneratingExcel(true);

    try {
      const url = `/api/admin/reports?type=individual&month=${month}&year=${year}&userId=${teacher.id}`;
      const res = await fetch(url);
      const result = await res.json();

      if (!res.ok) throw new Error(result.error || "Gagal mengambil data");

      if (!result.data || (Array.isArray(result.data) && result.data.length === 0)) {
        toast.error("Data presensi tidak ditemukan pada periode ini.");
        return;
      }

      if (formatType === "pdf") {
        exportIndividualPDF(result.teacher, month, year, result.data, settings);
      } else {
        await exportIndividualExcel(result.teacher, month, year, result.data, settings);
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
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-black text-foreground tracking-tight">Cetak Laporan Saya</h1>
        <p className="text-nav-text opacity-70 font-medium">Pilih periode laporan yang ingin diunduh.</p>
      </div>

      <div className="glass rounded-[3rem] p-8 md:p-10 shadow-2xl border border-surface-border bg-white dark:bg-surface/50">
        <div className="space-y-8">
          <div className="space-y-3">
            <label className="text-sm font-black text-foreground ml-1 flex items-center gap-2">
              <Calendar size={16} className="text-brand-primary" />
              Pilih Bulan & Tahun
            </label>
            <input
              type="month"
              value={monthYear}
              onChange={(e) => setMonthYear(e.target.value)}
              onClick={(e) => e.target.showPicker()}
              className="w-full px-5 py-4 rounded-2xl border border-surface-border bg-background focus:ring-2 focus:ring-brand-primary/50 outline-none transition-all shadow-sm font-bold text-sm text-foreground cursor-pointer"
            />
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
              Laporan ini mencantumkan riwayat presensi masuk dan pulang Anda secara lengkap sesuai periode yang dipilih.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
