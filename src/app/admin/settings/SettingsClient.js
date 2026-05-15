"use client";

import { useActionState, useEffect } from "react";
import { updateSystemSettingsAction } from "@/app/actions/admin";
import { Save, Globe, Clock, Image as ImageIcon, CheckSquare } from "lucide-react";
import { toast } from "react-hot-toast";

export default function SettingsClient({ initialSettings }) {
  const [state, formAction, isPending] = useActionState(updateSystemSettingsAction, null);

  useEffect(() => {
    if (state?.success) {
      toast.success(state.success);
    } else if (state?.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <div className="max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <form action={formAction} className="space-y-6">
          <div className="glass rounded-3xl p-6 md:p-8 bg-surface shadow-sm border border-surface-border">
            <div className="space-y-6">

              <div className="grid grid-cols-1 md:grid-cols-1 gap-8">
                <div className="space-y-2.5">
                  <label className="flex items-center gap-2 text-sm font-bold text-foreground ml-1">
                    <Globe size={16} className="text-brand-primary" />
                    Nama Sistem
                  </label>
                  <input
                    type="text"
                    name="nama_sistem"
                    defaultValue={initialSettings?.nama_sistem || "Sistem Presensi"}
                    required
                    className="w-full px-5 py-4 rounded-2xl border border-surface-border bg-background focus:ring-2 focus:ring-brand-primary outline-none transition-all shadow-sm"
                    placeholder="Contoh: Presensi Sekolah Digital"
                  />
                </div>

                <div className="space-y-2.5">
                  <label className="flex items-center gap-2 text-sm font-bold text-foreground ml-1">
                    <Clock size={16} className="text-brand-primary" />
                    Jam Masuk
                  </label>
                  <input
                    type="time"
                    name="jam_masuk"
                    defaultValue={initialSettings?.jam_masuk || "07:00"}
                    required
                    className="w-full px-5 py-4 rounded-2xl border border-surface-border bg-background focus:ring-2 focus:ring-brand-primary outline-none transition-all shadow-sm"
                    onClick={(e) => e.target.showPicker()}
                  />
                </div>
              </div>

              <div className="pt-6 border-t border-surface-border flex justify-end">
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full md:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-brand-primary text-white font-bold rounded-2xl shadow-xl shadow-brand-primary/20 hover:bg-purple-700 hover:-translate-y-0.5 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <Save size={20} />
                  {isPending ? "Menyimpan..." : "Update Pengaturan"}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>


    </div>
  );
}
