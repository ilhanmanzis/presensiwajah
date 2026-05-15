"use client";

import { useState, useTransition, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Circle, useMapEvents } from "react-leaflet";
import { updateSettingsAction } from "@/app/actions/admin";
import { toast } from "react-hot-toast";
import { Save, MapPin, ShieldCheck, X, Eye, EyeOff, AlertCircle, Info } from "lucide-react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix for Leaflet default icon issue in Next.js
const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

function LocationMarker({ position, setPosition, radius }) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });

  return position === null ? null : (
    <>
      <Marker position={position} />
      <Circle 
        center={position} 
        pathOptions={{ 
          fillColor: '#8b5cf6', 
          color: '#7c3aed',
          fillOpacity: 0.2,
          weight: 2
        }} 
        radius={radius} 
      />
    </>
  );
}

export default function MapClient({ initialSettings }) {
  const defaultPos = { lat: -6.200000, lng: 106.816666 };
  
  const initPos = initialSettings ? { lat: initialSettings.latitude, lng: initialSettings.longitude } : defaultPos;
  const initRadius = initialSettings ? initialSettings.radius : 100;

  const [position, setPosition] = useState(initPos);
  const [radius, setRadius] = useState(initRadius);
  const [isPending, startTransition] = useTransition();
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handlePreSave = (e) => {
    e.preventDefault();
    setShowVerifyModal(true);
  };

  const handleConfirmSave = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("latitude", position.lat.toString());
    formData.append("longitude", position.lng.toString());
    formData.append("radius", radius.toString());
    formData.append("adminPassword", adminPassword);

    startTransition(async () => {
      const res = await updateSettingsAction(formData);
      if (res.success) {
        toast.success(res.success);
        setShowVerifyModal(false);
        setAdminPassword("");
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="glass rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 bg-purple-100 dark:bg-purple-500/20 text-brand-primary rounded-lg">
                <MapPin size={20} />
              </div>
              <h2 className="text-lg font-bold text-foreground">Pengaturan Geofencing GPS</h2>
            </div>
            
            <form onSubmit={handlePreSave} className="space-y-5">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Latitude</label>
                  <input 
                    type="number" 
                    step="any" 
                    value={position.lat} 
                    onChange={(e) => setPosition({ ...position, lat: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 rounded-lg border border-surface-border bg-background outline-none focus:ring-2 focus:ring-brand-primary transition-all" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Longitude</label>
                  <input 
                    type="number" 
                    step="any" 
                    value={position.lng} 
                    onChange={(e) => setPosition({ ...position, lng: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 rounded-lg border border-surface-border bg-background outline-none focus:ring-2 focus:ring-brand-primary transition-all" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Radius Presensi (meter)</label>
                  <input 
                    type="number" 
                    min="10" 
                    max="1000" 
                    value={radius} 
                    onChange={(e) => setRadius(parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-2.5 rounded-lg border border-surface-border bg-background outline-none focus:ring-2 focus:ring-brand-primary transition-all" 
                    placeholder="Contoh: 100"
                  />
                  <p className="text-[10px] text-nav-text mt-1">
                    *Tentukan seberapa jauh guru boleh melakukan presensi dari titik sekolah.
                  </p>
                </div>
              </div>

              <button 
                type="submit" 
                className="w-full py-3 bg-brand-primary hover:bg-purple-700 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition-all flex justify-center items-center gap-2 mt-4 cursor-pointer"
              >
                <Save size={18} />
                Simpan Lokasi
              </button>

              <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-500/5 rounded-lg border border-blue-100 dark:border-blue-500/10">
                <Info size={16} className="text-blue-500 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700 dark:text-blue-400 leading-relaxed">
                  Gunakan peta di samping untuk menentukan titik lokasi sekolah secara akurat. Klik pada posisi gedung sekolah Anda.
                </p>
              </div>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="glass rounded-xl overflow-hidden shadow-2xl h-[550px] relative border border-surface-border z-0">
            <style jsx global>{`
              .leaflet-container {
                cursor: crosshair !important;
              }
            `}</style>
            <MapContainer center={initPos} zoom={16} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <LocationMarker position={position} setPosition={setPosition} radius={radius} />
            </MapContainer>
            
            {/* Map Overlay Badge */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[400] pointer-events-none">
              <div className="bg-slate-900/90 backdrop-blur px-4 py-2 rounded-full shadow-lg border border-white/10 flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-xs font-bold text-white">Mode Penentuan Lokasi Sekolah</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Verification Modal */}
      {showVerifyModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface w-full max-w-md rounded-2xl shadow-2xl border border-surface-border overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <ShieldCheck className="text-brand-primary" />
                  Verifikasi Admin
                </h3>
                <button onClick={() => setShowVerifyModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleConfirmSave} className="space-y-4">
                <p className="text-sm text-nav-text">
                  Demi keamanan, silakan masukkan password admin Anda untuk menyimpan perubahan pengaturan geofence (lokasi presensi).
                </p>

                <div>
                  <label className="block text-sm font-medium mb-1">Password Admin</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      required
                      autoFocus
                      autoComplete="current-password"
                      className="w-full px-4 py-2.5 rounded-lg border border-surface-border bg-background outline-none focus:ring-2 focus:ring-brand-primary transition-all pr-12"
                      placeholder="••••••••"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="p-1 text-slate-400 hover:text-brand-primary transition-colors cursor-pointer"
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowVerifyModal(false)}
                    className="flex-1 py-2.5 rounded-lg border border-surface-border font-medium text-nav-text hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 hover:border-red-600 dark:hover:border-red-500/50 transition-all cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="flex-1 py-2.5 bg-brand-primary text-white rounded-lg font-bold hover:bg-purple-700 shadow-sm hover:shadow-xl transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {isPending ? "Verifikasi..." : "Konfirmasi"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
