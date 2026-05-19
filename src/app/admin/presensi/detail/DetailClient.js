"use client";

import { useState } from "react";
import { formatWIB } from "@/lib/dateUtils";
import { MapPin, UserCheck, Trash2, AlertCircle, MoreVertical } from "lucide-react";
import MapWrapper from "./MapWrapper";
import { deleteAttendanceAction } from "@/app/actions/admin";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";

export default function DetailClient({ attendanceId, teacher, dateStr, formattedDate, masuk, pulang, status, keterangan, settings }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Combine statuses for display
  const statusHadir = status === "Hadir";
  const statusLabel = status;

  const handleDeleteClick = () => {
    setShowOptions(false);
    setShowConfirmModal(true);
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    const idsToDelete = [attendanceId];

    const result = await deleteAttendanceAction(idsToDelete);
    setIsDeleting(false);
    setShowConfirmModal(false);

    if (result.success) {
      toast.success(result.success);
      // Redirect back after deletion
      const [year, month] = dateStr.split('-');
      router.push(`/admin/presensi/bulanan?teacherId=${teacher.id}&month=${parseInt(month)}&year=${year}`);
    } else {
      toast.error(result.error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Teacher Info Card */}
      <div className="bg-white dark:bg-surface rounded-[2rem] p-6 md:p-8 shadow-sm border border-surface-border">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">

          <div className="flex flex-col">
            <h2 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">{teacher.nama_lengkap}</h2>
            <p className="text-sm font-bold text-nav-text mt-1">
              NIP: {teacher.nip || "-"}
            </p>
            {keterangan && (
              <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-surface-border inline-block w-fit">
                <p className="text-[9px] uppercase tracking-widest font-black text-nav-text opacity-50 mb-0.5">Keterangan / Alasan:</p>
                <p className="text-sm font-bold text-foreground italic">"{keterangan}"</p>
              </div>
            )}
          </div>

          <div className="flex flex-col items-end gap-3">
            <div className="flex items-center gap-3">
              <span className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest ${statusHadir ? "bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400" :
                status === "Izin" ? "bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400" :
                  status === "Sakit" ? "bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400" :
                    "bg-slate-100 text-slate-600 dark:bg-slate-500/20 dark:text-slate-400"
                }`}>
                {statusLabel}
              </span>

              {/* Three dots menu */}
              {attendanceId && (
                <div className="relative">
                  <button
                    onClick={() => setShowOptions(!showOptions)}
                    className="w-10 h-10 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-[#1e293b] dark:hover:bg-[#0f172a] dark:text-white rounded-xl transition-all shadow-sm dark:shadow-md cursor-pointer"
                  >
                    <MoreVertical size={18} />
                  </button>

                  {showOptions && (
                    <>
                      <div
                        className="fixed inset-0 z-[90]"
                        onClick={() => setShowOptions(false)}
                      />
                      <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden z-[100] animate-in fade-in zoom-in-95 duration-100">
                        <button
                          onClick={handleDeleteClick}
                          className="w-full text-left px-4 py-3 text-sm font-bold text-red-600 dark:text-[#ff6b6b] hover:bg-red-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2 cursor-pointer"
                        >
                          <Trash2 size={16} />
                          Hapus Presensi
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            <p className="text-sm font-black text-foreground">{formattedDate}</p>
          </div>
        </div>
      </div>

      {statusHadir ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Map */}
          <div className="lg:col-span-2">
            <div className="glass rounded-[2rem] overflow-hidden shadow-xl border border-surface-border h-[400px] lg:h-[600px] relative z-0">
              <div className="absolute top-0 inset-x-0 p-4 bg-white dark:bg-slate-800/80 backdrop-blur-md border-b border-surface-border z-10">
                <h3 className="text-sm font-black text-foreground">Lokasi Presensi</h3>
              </div>

              {(masuk?.latitude || pulang?.latitude) ? (
                <MapWrapper settings={settings} masuk={masuk} pulang={pulang} />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-800/30 p-6 text-center">
                  <MapPin size={48} className="text-slate-300 dark:text-slate-600 mb-4" />
                  <p className="text-nav-text font-bold">
                    Peta tidak tersedia untuk presensi ini.
                  </p>
                  <p className="text-xs text-nav-text opacity-70 mt-2 max-w-sm">
                    Peta hanya akan ditampilkan jika guru melakukan presensi dengan status Hadir dan memiliki data koordinat GPS.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right: Info Cards */}
          <div className="lg:col-span-1 space-y-4">

            {/* Masuk Card */}
            <div className="bg-white dark:bg-surface rounded-2xl p-5 border border-surface-border shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <MapPin size={20} className="text-green-500" />
                <h3 className="font-bold text-green-600 dark:text-green-400">Presensi Masuk</h3>
              </div>
              {masuk ? (
                <div className="space-y-3 text-sm">
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-nav-text">Waktu</span>
                    <span className="col-span-2 font-semibold text-foreground">: {masuk.waktu ? formatWIB(masuk.waktu, "HH:mm") : "-"} WIB</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-nav-text">Latitude</span>
                    <span className="col-span-2 font-semibold text-foreground">: {masuk.latitude || "-"}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-nav-text">Longitude</span>
                    <span className="col-span-2 font-semibold text-foreground">: {masuk.longitude || "-"}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-nav-text">Jarak</span>
                    <span className="col-span-2 font-semibold text-foreground">: {masuk.distance ? Math.floor(masuk.distance) : 0} m</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-nav-text">Status Radius</span>
                    <span className="col-span-2 font-semibold text-foreground">: {masuk.catatan || "-"}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-nav-text">Keterangan</span>
                    <span className="col-span-2 font-semibold text-foreground">: {masuk.keterangan || "-"}</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm font-semibold text-slate-400 italic">Belum presensi masuk</p>
              )}
            </div>

            {/* Pulang Card */}
            <div className="bg-white dark:bg-surface rounded-2xl p-5 border border-surface-border shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <MapPin size={20} className="text-orange-500" />
                <h3 className="font-bold text-orange-600 dark:text-orange-400">Presensi Pulang</h3>
              </div>
              {pulang ? (
                <div className="space-y-3 text-sm">
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-nav-text">Waktu</span>
                    <span className="col-span-2 font-semibold text-foreground">: {pulang.waktu ? formatWIB(pulang.waktu, "HH:mm") : "-"} WIB</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-nav-text">Latitude</span>
                    <span className="col-span-2 font-semibold text-foreground">: {pulang.latitude || "-"}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-nav-text">Longitude</span>
                    <span className="col-span-2 font-semibold text-foreground">: {pulang.longitude || "-"}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-nav-text">Jarak</span>
                    <span className="col-span-2 font-semibold text-foreground">: {pulang.distance ? Math.floor(pulang.distance) : 0} m</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-nav-text">Status Radius</span>
                    <span className="col-span-2 font-semibold text-foreground">: {pulang.catatan || "-"}</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm font-bold text-red-500 dark:text-red-400 italic">Belum presensi pulang</p>
              )}
            </div>

            {/* Sekolah Info Card */}
            <div className="bg-white dark:bg-surface rounded-2xl p-5 border border-surface-border shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <MapPin size={20} className="text-blue-500" />
                <h3 className="font-bold text-blue-600 dark:text-blue-400">Lokasi Sekolah</h3>
              </div>
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-nav-text">Radius</span>
                  <span className="col-span-2 font-semibold text-foreground">: {settings?.radius || 100} meter</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-surface rounded-[2rem] p-8 border border-surface-border shadow-sm">
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="w-20 h-20 bg-blue-50 dark:bg-blue-500/10 text-blue-500 rounded-3xl flex items-center justify-center mb-6">
              <AlertCircle size={40} />
            </div>
            <h3 className="text-xl font-black text-foreground mb-2">Informasi Presensi</h3>
            <p className="text-nav-text font-medium max-w-md">
              Guru ini berstatus <span className="font-bold text-brand-primary">{status}</span> pada tanggal tersebut.
            </p>
            <p className="text-[10px] text-nav-text opacity-50 mt-8">
              Informasi lokasi dan peta hanya tersedia untuk presensi dengan status Hadir.
            </p>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface w-full max-w-md rounded-2xl shadow-2xl border border-surface-border overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4 text-red-600 dark:text-red-500">
                <AlertCircle size={28} />
                <h3 className="text-xl font-bold">Hapus Presensi?</h3>
              </div>
              <p className="text-sm text-nav-text mb-6">
                Apakah Anda yakin ingin menghapus data presensi guru ini pada tanggal {formattedDate}?
                Jika terdapat presensi pulang, maka data presensi pulang juga akan ikut terhapus.
                Tindakan ini tidak dapat dibatalkan.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  disabled={isDeleting}
                  className="px-4 py-2 rounded-xl font-bold text-nav-text hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all shadow hover:shadow-lg flex items-center justify-center disabled:opacity-50 cursor-pointer"
                >
                  {isDeleting ? "Menghapus..." : "Ya, Hapus Presensi"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
