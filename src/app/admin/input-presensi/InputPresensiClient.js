"use client";

import { useState, useTransition } from "react";
import { 
  LogIn, LogOut, Stethoscope, Calendar, 
  ChevronRight, Search, Plus, X, Clock, 
  UserCheck, AlertCircle, UserMinus 
} from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { saveManualAttendance, processManualCheckout } from "@/app/actions/attendanceActions";
import { toast } from "react-hot-toast";

export default function InputPresensiClient({ teachers, initialCheckoutCandidates }) {
  const [isPending, startTransition] = useTransition();
  const [activeModal, setActiveModal] = useState(null); // 'masuk', 'pulang', 'sakit', 'izin'
  const [checkoutCandidates, setCheckoutCandidates] = useState(initialCheckoutCandidates);

  // Form States
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [tanggal, setTanggal] = useState(format(new Date(), "yyyy-MM-dd"));
  const [jamMasuk, setJamMasuk] = useState(format(new Date(), "HH:mm"));
  const [jamPulang, setJamPulang] = useState(format(new Date(), "HH:mm"));
  const [autoCheckout, setAutoCheckout] = useState(false);
  const [keterangan, setKeterangan] = useState("");

  const filteredTeachers = teachers.filter(t => 
    t.nama_lengkap.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.nip && t.nip.includes(searchQuery))
  );

  const selectedTeacher = teachers.find(t => t.id === selectedTeacherId);

  const closeModal = () => {
    setActiveModal(null);
    setSelectedTeacherId("");
    setSearchQuery("");
    setIsDropdownOpen(false);
    setKeterangan("");
    setAutoCheckout(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append("userId", selectedTeacherId);
    formData.append("tanggal", tanggal);
    formData.append("status", activeModal === 'masuk' ? 'Hadir' : (activeModal === 'sakit' ? 'Sakit' : 'Izin'));
    formData.append("keterangan", keterangan);
    
    if (activeModal === 'masuk') {
      formData.append("jamMasuk", jamMasuk);
      if (autoCheckout) {
        formData.append("autoCheckout", "true");
        formData.append("jamPulang", jamPulang);
      }
    }

    startTransition(async () => {
      const res = await saveManualAttendance(formData);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(res.success);
        closeModal();
        // Refresh candidates if needed (handled by revalidatePath usually)
        setTimeout(() => window.location.reload(), 1000); 
      }
    });
  };

  const handleCheckout = async (attendanceId, time) => {
    const formData = new FormData();
    formData.append("attendanceId", attendanceId);
    formData.append("jamPulang", time);

    startTransition(async () => {
      const res = await processManualCheckout(formData);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(res.success);
        setTimeout(() => window.location.reload(), 1000);
      }
    });
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20 px-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">Input Presensi</h1>
          <p className="text-sm font-medium text-nav-text opacity-70 mt-1">
            Menu khusus Admin untuk input data kehadiran secara manual.
          </p>
        </div>
        <div className="px-5 py-2.5 bg-surface border border-surface-border rounded-2xl shadow-sm flex items-center gap-3">
          <Calendar size={18} className="text-brand-primary" />
          <p className="text-sm font-bold text-foreground">
            {format(new Date(), "EEEE, dd MMMM yyyy", { locale: id })}
          </p>
        </div>
      </div>

      {/* Action Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <ActionCard 
          title="Presensi Masuk"
          description="Input guru yang hadir hari ini"
          icon={<LogIn size={28} />}
          color="green"
          onClick={() => setActiveModal('masuk')}
        />
        <ActionCard 
          title="Presensi Pulang"
          description="Proses guru yang akan pulang"
          icon={<LogOut size={28} />}
          color="orange"
          onClick={() => setActiveModal('pulang')}
        />
        <ActionCard 
          title="Sakit"
          description="Input guru yang sedang sakit"
          icon={<Stethoscope size={28} />}
          color="blue"
          onClick={() => setActiveModal('sakit')}
        />
        <ActionCard 
          title="Izin"
          description="Input izin/keperluan keluarga"
          icon={<UserMinus size={28} />}
          color="yellow"
          onClick={() => setActiveModal('izin')}
        />
      </div>

      {/* Modals */}
      {activeModal && activeModal !== 'pulang' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-lg bg-white dark:bg-[#13142B] rounded-[2.5rem] shadow-2xl border border-white/10 overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
            <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-xl font-black text-foreground flex items-center gap-3">
                <div className={`w-2 h-6 rounded-full ${
                  activeModal === 'masuk' ? 'bg-green-500' : 
                  activeModal === 'sakit' ? 'bg-blue-500' : 'bg-yellow-500'
                }`}></div>
                Input {activeModal.charAt(0).toUpperCase() + activeModal.slice(1)}
              </h3>
              <button onClick={closeModal} className="p-2 hover:bg-white/5 rounded-full transition-colors cursor-pointer text-nav-text">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              {/* Teacher Dropdown */}
              <div className="space-y-2 relative">
                <label className="text-xs font-black text-foreground uppercase tracking-widest opacity-70">Pilih Guru</label>
                <div 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-full px-4 py-4 rounded-2xl border border-surface-border bg-slate-50 dark:bg-slate-800/50 hover:border-brand-primary/50 transition-all cursor-pointer flex items-center justify-between"
                >
                  <span className={`text-sm font-bold ${selectedTeacher ? 'text-foreground' : 'text-nav-text'}`}>
                    {selectedTeacher ? selectedTeacher.nama_lengkap : 'Cari Nama Guru...'}
                  </span>
                  <ChevronRight size={18} className={`transition-transform ${isDropdownOpen ? 'rotate-90' : ''}`} />
                </div>

                {isDropdownOpen && (
                  <div className="absolute z-[60] top-full left-0 right-0 mt-2 bg-white dark:bg-[#1e1f3d] border border-surface-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-60 animate-in slide-in-from-top-2 duration-200">
                    <div className="p-3 border-b border-surface-border sticky top-0 bg-white dark:bg-[#1e1f3d]">
                      <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-nav-text" />
                        <input 
                          type="text"
                          placeholder="Cari..."
                          className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border-none text-sm outline-none focus:ring-2 focus:ring-brand-primary/50"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          autoFocus
                        />
                      </div>
                    </div>
                    <div className="overflow-y-auto p-2">
                      {filteredTeachers.map(t => (
                        <div 
                          key={t.id}
                          onClick={() => {
                            setSelectedTeacherId(t.id);
                            setIsDropdownOpen(false);
                          }}
                          className={`p-3 rounded-xl text-sm font-bold cursor-pointer hover:bg-brand-primary/10 hover:text-brand-primary transition-colors ${selectedTeacherId === t.id ? 'bg-brand-primary/10 text-brand-primary' : 'text-foreground'}`}
                        >
                          {t.nama_lengkap}
                          {t.nip && <span className="block text-[10px] opacity-50">{t.nip}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Date & Time Row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black text-foreground uppercase tracking-widest opacity-70">Tanggal</label>
                  <input 
                    type="date"
                    className="w-full px-4 py-4 rounded-2xl border border-surface-border bg-slate-50 dark:bg-slate-800/50 outline-none focus:ring-2 focus:ring-brand-primary/50 text-sm font-bold text-foreground cursor-pointer"
                    value={tanggal}
                    onChange={(e) => setTanggal(e.target.value)}
                  />
                </div>
                {activeModal === 'masuk' && (
                  <div className="space-y-2">
                    <label className="text-xs font-black text-foreground uppercase tracking-widest opacity-70">Jam Masuk</label>
                    <input 
                      type="time"
                      className="w-full px-4 py-4 rounded-2xl border border-surface-border bg-slate-50 dark:bg-slate-800/50 outline-none focus:ring-2 focus:ring-brand-primary/50 text-sm font-bold text-foreground cursor-pointer"
                      value={jamMasuk}
                      onChange={(e) => setJamMasuk(e.target.value)}
                      onClick={(e) => e.target.showPicker()}
                    />
                  </div>
                )}
              </div>

              {/* Extra Logic for Masuk */}
              {activeModal === 'masuk' && (
                <div className="space-y-4">
                  <label className="flex items-center gap-3 p-4 rounded-2xl bg-brand-primary/5 border border-brand-primary/10 cursor-pointer group transition-all hover:bg-brand-primary/10">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${autoCheckout ? 'bg-brand-primary border-brand-primary' : 'border-slate-300 dark:border-slate-600'}`}>
                      {autoCheckout && <Plus size={14} className="text-white" />}
                    </div>
                    <input 
                      type="checkbox" 
                      className="hidden" 
                      checked={autoCheckout}
                      onChange={(e) => setAutoCheckout(e.target.checked)}
                    />
                    <span className="text-sm font-bold text-foreground">Sekalian Presensi Pulang?</span>
                  </label>

                  {autoCheckout && (
                    <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                      <label className="text-xs font-black text-foreground uppercase tracking-widest opacity-70">Jam Pulang</label>
                      <input 
                        type="time"
                        className="w-full px-4 py-4 rounded-2xl border border-surface-border bg-slate-50 dark:bg-slate-800/50 outline-none focus:ring-2 focus:ring-brand-primary/50 text-sm font-bold text-foreground cursor-pointer"
                        value={jamPulang}
                        onChange={(e) => setJamPulang(e.target.value)}
                        onClick={(e) => e.target.showPicker()}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Keterangan for Sakit/Izin */}
              {activeModal !== 'masuk' && (
                <div className="space-y-2">
                  <label className="text-xs font-black text-foreground uppercase tracking-widest opacity-70">Keterangan / Alasan</label>
                  <textarea 
                    className="w-full px-4 py-4 rounded-2xl border border-surface-border bg-slate-50 dark:bg-slate-800/50 outline-none focus:ring-2 focus:ring-brand-primary/50 text-sm font-bold text-foreground min-h-[100px]"
                    placeholder="Contoh: Sakit demam, Izin ada keperluan keluarga..."
                    value={keterangan}
                    onChange={(e) => setKeterangan(e.target.value)}
                    required
                  ></textarea>
                </div>
              )}

              <button 
                type="submit"
                disabled={isPending || !selectedTeacherId}
                className="w-full py-4 bg-brand-primary text-white font-black rounded-2xl shadow-xl shadow-brand-primary/30 hover:bg-purple-700 transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                {isPending ? (
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Plus size={18} />
                    Simpan Data Presensi
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Pulang Modal / Section */}
      {activeModal === 'pulang' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-2xl bg-white dark:bg-[#13142B] rounded-[2.5rem] shadow-2xl border border-white/10 overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-300">
            <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-xl font-black text-foreground flex items-center gap-3">
                <div className="w-2 h-6 rounded-full bg-orange-500"></div>
                Proses Pulang Guru
              </h3>
              <button onClick={closeModal} className="p-2 hover:bg-white/5 rounded-full transition-colors cursor-pointer text-nav-text">
                <X size={20} />
              </button>
            </div>

            <div className="p-8 overflow-y-auto space-y-4">
              {checkoutCandidates.length === 0 ? (
                <div className="text-center py-12 opacity-50">
                  <UserCheck size={48} className="mx-auto mb-4" />
                  <p className="font-bold">Tidak ada guru yang sedang hadir & belum pulang hari ini.</p>
                </div>
              ) : (
                checkoutCandidates.map(att => (
                  <CheckoutCandidateItem 
                    key={att.id} 
                    att={att} 
                    onCheckout={handleCheckout} 
                    isPending={isPending}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ActionCard({ title, description, icon, color, onClick }) {
  const colors = {
    green: "bg-green-500/10 text-green-500 border-green-500/20 hover:border-green-500 shadow-green-500/5",
    orange: "bg-orange-500/10 text-orange-500 border-orange-500/20 hover:border-orange-500 shadow-orange-500/5",
    blue: "bg-blue-500/10 text-blue-500 border-blue-500/20 hover:border-blue-500 shadow-blue-500/5",
    yellow: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20 hover:border-yellow-500 shadow-yellow-500/5",
  };

  const iconColors = {
    green: "bg-green-500 text-white dark:bg-green-500/20 dark:text-green-400",
    orange: "bg-orange-500 text-white dark:bg-orange-500/20 dark:text-orange-400",
    blue: "bg-blue-500 text-white dark:bg-blue-500/20 dark:text-blue-400",
    yellow: "bg-yellow-500 text-white dark:bg-yellow-500/20 dark:text-yellow-400",
  };

  return (
    <div 
      onClick={onClick}
      className={`group p-8 rounded-[2.5rem] border-2 bg-white dark:bg-[#13142B] transition-all cursor-pointer hover:-translate-y-2 shadow-2xl ${colors[color]}`}
    >
      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 duration-500 shadow-lg ${iconColors[color]}`}>
        {icon}
      </div>
      <h3 className="text-lg font-black text-foreground mb-2">{title}</h3>
      <p className="text-sm font-medium text-nav-text opacity-70 line-clamp-2">{description}</p>
      
      <div className="mt-6 flex items-center text-xs font-black uppercase tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-opacity">
        Buka Form <ChevronRight size={14} className="ml-1" />
      </div>
    </div>
  );
}

function CheckoutCandidateItem({ att, onCheckout, isPending }) {
  const [time, setTime] = useState(format(new Date(), "HH:mm"));
  const [isExpanding, setIsExpanding] = useState(false);

  return (
    <div className="p-6 rounded-[2rem] bg-slate-50 dark:bg-white/5 border border-surface-border transition-all hover:border-orange-500/30 group">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500 font-black text-xl shadow-inner">
            {att.user.nama_lengkap.charAt(0)}
          </div>
          <div>
            <h4 className="font-bold text-foreground text-lg tracking-tight group-hover:text-orange-500 transition-colors">{att.user.nama_lengkap}</h4>
            <div className="flex flex-wrap items-center gap-3 mt-1">
              <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-nav-text bg-slate-100 dark:bg-white/5 px-2.5 py-1 rounded-lg">
                <Calendar size={10} className="text-orange-500" />
                <span>{format(new Date(att.tanggal), "dd MMM yyyy", { locale: id })}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-nav-text bg-slate-100 dark:bg-white/5 px-2.5 py-1 rounded-lg">
                <Clock size={10} className="text-orange-500" />
                <span>Masuk: {format(new Date(att.jam_masuk), "HH:mm")} WIB</span>
              </div>
              <span className="text-[10px] font-black uppercase text-nav-text opacity-40">{att.user.nip || "-"}</span>
            </div>
          </div>
        </div>

        {!isExpanding ? (
          <button 
            onClick={() => setIsExpanding(true)}
            className="h-12 px-6 bg-orange-500 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-orange-600 transition-all cursor-pointer shadow-lg shadow-orange-500/20"
          >
            Proses Pulang
          </button>
        ) : (
          <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-surface-border shadow-sm animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex flex-col px-2 border-r border-surface-border pr-4">
              <span className="text-[9px] font-black uppercase text-nav-text opacity-50 mb-0.5">Jam Pulang</span>
              <input 
                type="time" 
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="bg-transparent border-none p-0 text-sm font-black text-foreground outline-none focus:ring-0 w-20 cursor-pointer"
                autoFocus
                onClick={(e) => e.target.showPicker()}
              />
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => onCheckout(att.id, time)}
                disabled={isPending}
                className="h-10 px-4 bg-green-500 text-white font-black text-[10px] uppercase tracking-widest rounded-lg hover:bg-green-600 transition-all cursor-pointer disabled:opacity-50"
              >
                {isPending ? "..." : "Simpan"}
              </button>
              <button 
                onClick={() => setIsExpanding(false)}
                className="p-2 text-nav-text hover:text-red-500 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
