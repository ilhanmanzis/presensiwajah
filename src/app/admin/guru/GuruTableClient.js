"use client";

import { useState, useTransition, useEffect } from "react";
import { Search, UserPlus, Pencil, Trash2, X, ChevronLeft, ChevronRight, Key, CheckCircle2, AlertCircle, AlertTriangle, Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { addGuruAction, updateGuruAction, deleteGuruAction, changePasswordAction } from "@/app/actions/admin";
import Breadcrumbs from "@/components/Breadcrumbs";

export default function GuruTableClient({ gurus, total, page, totalPages, search: initialSearch }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(initialSearch);
  const [showModal, setShowModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [currentGuru, setCurrentGuru] = useState(null); // null for Add, object for Edit
  const [selectedGuruId, setSelectedGuruId] = useState(null);
  const [guruToDelete, setGuruToDelete] = useState(null);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearch(value);

    // Simple debounce/timeout for search
    const timeoutId = setTimeout(() => {
      router.push(`/admin/guru?search=${value}&page=1`);
    }, 500);
    return () => clearTimeout(timeoutId);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      router.push(`/admin/guru?search=${search}&page=${newPage}`);
    }
  };

  const openAddModal = () => {
    setCurrentGuru(null);
    setError("");
    setFieldErrors({});
    setShowPassword(false);
    setShowModal(true);
  };

  const openEditModal = (guru) => {
    setCurrentGuru(guru);
    setError("");
    setFieldErrors({});
    setShowModal(true);
  };

  const openDeleteModal = (guru) => {
    setGuruToDelete(guru);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!guruToDelete) return;

    const formData = new FormData();
    formData.append("id", guruToDelete.id);

    startTransition(async () => {
      const result = await deleteGuruAction(formData);
      if (result.success) {
        setSuccessMessage(result.success);
        setShowDeleteModal(false);
        setGuruToDelete(null);
      } else if (result.error) {
        alert(result.error);
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = currentGuru
        ? await updateGuruAction(formData)
        : await addGuruAction(formData);

      if (result.fieldErrors) {
        setFieldErrors(result.fieldErrors);
      } else if (result.error) {
        setError(result.error);
      } else {
        setSuccessMessage(result.success);
        setShowModal(false);
      }
    });
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await changePasswordAction(formData);
      if (result.fieldErrors) {
        setFieldErrors(result.fieldErrors);
      } else if (result.error) {
        setError(result.error);
      } else {
        setSuccessMessage(result.success);
        setShowPasswordModal(false);
      }
    });
  };

  return (
    <div className="space-y-6">

      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Data Guru</h1>
      </div>

      {successMessage && (
        <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 text-green-700 dark:text-green-400 rounded-xl animate-in slide-in-from-top-2 duration-300">
          <CheckCircle2 size={20} />
          <p className="font-medium">{successMessage}</p>
        </div>
      )}

      <div className="glass rounded-xl p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <h2 className="text-lg font-semibold">Daftar Guru</h2>

          <div className="flex w-full md:w-auto gap-3">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-nav-text" size={18} />
              <input
                type="text"
                placeholder="Cari Nama atau NIP..."
                value={search}
                onChange={handleSearch}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-surface-border bg-background focus:ring-2 focus:ring-brand-primary outline-none transition-all"
              />
            </div>
            <button
              onClick={openAddModal}
              className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-purple-700 transition-all font-medium cursor-pointer"
            >
              <UserPlus size={18} />
              <span className="hidden sm:inline">Tambah Guru</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-nav-text uppercase bg-surface border-b border-surface-border">
              <tr>
                <th className="px-4 py-3 font-semibold">No</th>
                <th className="px-6 py-3 font-semibold">Nama</th>
                <th className="px-6 py-3 font-semibold">NIP</th>
                <th className="px-6 py-3 font-semibold">Email</th>
                <th className="px-6 py-3 font-semibold text-center">Status Wajah</th>
                <th className="px-6 py-3 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {gurus.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-10 text-center text-nav-text">
                    Tidak ada data guru ditemukan.
                  </td>
                </tr>
              ) : (
                gurus.map((guru, index) => (
                  <tr key={guru.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-4">{(page - 1) * 1 + index + 1}</td>
                    <td className="px-6 py-4 font-medium text-foreground">{guru.nama_lengkap}</td>
                    <td className="px-6 py-4 text-nav-text">{guru.nip || "-"}</td>
                    <td className="px-6 py-4 text-nav-text">{guru.email}</td>
                    <td className="px-6 py-4 text-center">
                      {guru.face_descriptor ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400 uppercase tracking-wider">
                          Terdaftar
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 uppercase tracking-wider">
                          Belum
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => {
                            setSelectedGuruId(guru.id);
                            setError("");
                            setShowPasswordModal(true);
                          }}
                          className="p-1.5 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded-lg transition-colors cursor-pointer"
                          title="Ganti Password"
                        >
                          <Key size={18} />
                        </button>
                        <button
                          onClick={() => openEditModal(guru)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors cursor-pointer"
                          title="Edit"
                        >
                          <Pencil size={18} />
                        </button>
                        <button
                          onClick={() => openDeleteModal(guru)}
                          className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors cursor-pointer"
                          title="Hapus"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-6 border-t border-surface-border">
            <p className="text-sm text-nav-text">
              Menampilkan <span className="font-bold text-foreground">{(page - 1) * 1 + 1}</span> sampai <span className="font-bold text-foreground">{Math.min(page * 1, total)}</span> dari <span className="font-bold text-foreground">{total}</span> guru
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
                className="p-2 rounded-lg border border-surface-border disabled:opacity-50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
              >
                <ChevronLeft size={20} />
              </button>
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => handlePageChange(i + 1)}
                  className={`w-10 h-10 rounded-lg border font-medium transition-all cursor-pointer ${page === i + 1
                    ? "bg-brand-primary text-white border-brand-primary"
                    : "border-surface-border hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page === totalPages}
                className="p-2 rounded-lg border border-surface-border disabled:opacity-50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Add/Edit */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface w-full max-w-md rounded-2xl shadow-2xl border border-surface-border overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-surface-border bg-background">
              <h3 className="text-xl font-bold">
                {currentGuru ? "Edit Data Guru" : "Tambah Guru Baru"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/20 dark:hover:text-red-400 rounded-full transition-all cursor-pointer"
                title="Tutup"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 rounded-lg text-sm font-medium">
                  {error}
                </div>
              )}

              {currentGuru && <input type="hidden" name="id" value={currentGuru.id} />}

              <div>
                <label className="block text-sm font-medium mb-1">Nama Lengkap + Gelar</label>
                <input
                  type="text"
                  name="nama_lengkap"
                  defaultValue={currentGuru?.nama_lengkap || ""}
                  required
                  className={`w-full px-4 py-2.5 rounded-lg border bg-background outline-none focus:ring-2 focus:ring-brand-primary transition-all ${fieldErrors.nama_lengkap ? "border-red-500 ring-red-500/20" : "border-surface-border"}`}
                  placeholder="Contoh: Budi Santoso, S.Pd"
                />
                {fieldErrors.nama_lengkap && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><AlertCircle size={12} /> {fieldErrors.nama_lengkap}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">NIP</label>
                  <input
                    type="text"
                    name="nip"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    onKeyPress={(e) => {
                      if (!/[0-9]/.test(e.key)) {
                        e.preventDefault();
                      }
                    }}
                    defaultValue={currentGuru?.nip || ""}
                    className={`w-full px-4 py-2.5 rounded-lg border bg-background outline-none focus:ring-2 focus:ring-brand-primary transition-all ${fieldErrors.nip ? "border-red-500 ring-red-500/20" : "border-surface-border"}`}
                    placeholder="Contoh: 1980..."
                  />
                  {fieldErrors.nip && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><AlertCircle size={12} /> {fieldErrors.nip}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    autoComplete="off"
                    defaultValue={currentGuru?.email || ""}
                    required
                    className={`w-full px-4 py-2.5 rounded-lg border bg-background outline-none focus:ring-2 focus:ring-brand-primary transition-all pr-12 ${fieldErrors.email ? "border-red-500 ring-red-500/20" : "border-surface-border"}`}
                    placeholder="email@gmail.com"
                  />
                  {fieldErrors.email && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><AlertCircle size={12} /> {fieldErrors.email}</p>}
                </div>
              </div>

              {!currentGuru && (
                <div>
                  <label className="block text-sm font-medium mb-1">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      autoComplete="new-password"
                      required
                      className={`w-full px-4 py-2.5 rounded-lg border bg-background outline-none focus:ring-2 focus:ring-brand-primary transition-all pr-10 ${fieldErrors.password ? "border-red-500 ring-red-500/20" : "border-surface-border"}`}
                      placeholder="Minimal 6 Karakter"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="p-1 text-slate-400 hover:text-brand-primary transition-colors cursor-pointer rounded-md focus:outline-none"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  {fieldErrors.password && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><AlertCircle size={12} /> {fieldErrors.password}</p>}
                </div>
              )}

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-lg border border-surface-border font-medium text-nav-text hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 hover:border-red-600 dark:hover:border-red-500/50 transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 py-2.5 bg-brand-primary text-white rounded-lg font-medium hover:bg-purple-700 dark:hover:bg-purple-600 shadow-sm hover:shadow-md transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isPending ? "Menyimpan..." : "Simpan Data"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Change Password */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface w-full max-w-sm rounded-2xl shadow-2xl border border-surface-border overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-surface-border bg-background">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Key size={20} className="text-amber-500" />
                Ganti Password
              </h3>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="p-2 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/20 dark:hover:text-red-400 rounded-full transition-all cursor-pointer"
                title="Tutup"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handlePasswordSubmit} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 rounded-lg text-sm font-medium">
                  {error}
                </div>
              )}

              <input type="hidden" name="id" value={selectedGuruId} />

              <div>
                <label className="block text-sm font-medium mb-1">Password Baru</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    autoComplete="new-password"
                    required
                    autoFocus
                    className={`w-full px-4 py-2.5 rounded-lg border bg-background outline-none focus:ring-2 focus:ring-brand-primary transition-all pr-10 ${fieldErrors.password ? "border-red-500 ring-red-500/20" : "border-surface-border"}`}
                    placeholder="Minimal 6 karakter"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-1 text-slate-400 hover:text-brand-primary transition-colors cursor-pointer rounded-md focus:outline-none"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                {fieldErrors.password && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><AlertCircle size={12} /> {fieldErrors.password}</p>}
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 py-2.5 rounded-lg border border-surface-border font-medium text-nav-text hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 hover:border-red-600 dark:hover:border-red-500/50 transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 py-2.5 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 shadow-sm hover:shadow-md transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isPending ? "Proses..." : "Update Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Delete Confirmation */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface w-full max-w-sm rounded-2xl shadow-2xl border border-surface-border overflow-hidden">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-xl font-bold mb-2 text-foreground">Hapus Data Guru?</h3>
              <p className="text-nav-text mb-6">
                Apakah Anda yakin ingin menghapus <span className="font-bold text-foreground">{guruToDelete?.nama_lengkap}</span>? Tindakan ini tidak dapat dibatalkan.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 py-2.5 rounded-lg border border-surface-border font-medium text-nav-text hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 hover:border-red-600 dark:hover:border-red-500/50 transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={isPending}
                  className="flex-1 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 shadow-sm hover:shadow-md transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isPending ? "Menghapus..." : "Ya, Hapus"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
