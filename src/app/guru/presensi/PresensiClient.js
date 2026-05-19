"use client";

import { useState, useEffect, useRef } from "react";
import { MapPin, Camera, CheckCircle, AlertCircle, XCircle } from "lucide-react";
import dynamic from "next/dynamic";
import { savePresensiAction } from "@/app/actions/guru";
import { useRouter } from "next/navigation";

const GuruMapClient = dynamic(() => import("./GuruMapClient"), { ssr: false, loading: () => <div className="h-64 glass animate-pulse rounded-xl" /> });

function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // metres
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function PresensiClient({ savedDescriptor, settings, initialAttendances }) {
  const router = useRouter();
  const [attendances, setAttendances] = useState(initialAttendances || []);

  // Face API reference (loaded dynamically)
  const faceapiRef = useRef(null);
  const isSubmittingRef = useRef(false);

  // GPS States
  const [userPos, setUserPos] = useState(null);
  const [isInsideZone, setIsInsideZone] = useState(false);
  const [gpsStatus, setGpsStatus] = useState("Mencari lokasi...");

  // Face States
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [faceStatus, setFaceStatus] = useState("Kamera belum aktif");
  const [isProcessing, setIsProcessing] = useState(false);
  const [cameraPermission, setCameraPermission] = useState("prompt");

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const schoolPos = { lat: settings.latitude, lng: settings.longitude };

  useEffect(() => {
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'camera' }).then((result) => {
        setCameraPermission(result.state);
        result.onchange = () => setCameraPermission(result.state);
      }).catch(err => console.error("Permission query error:", err));
    }
  }, []);

  const getAttendanceType = () => {
    if (attendances.length === 0) return "MASUK";
    const att = attendances[0];
    if (att.jam_masuk && !att.jam_pulang) return "PULANG";
    return "SELESAI";
  };

  const attType = getAttendanceType();

  useEffect(() => {
    updateLocation();
    loadFaceModels();
    return () => stopCamera();
  }, [settings.latitude, settings.longitude, settings.radius]);

  useEffect(() => {
    let timeout;
    if (isCameraActive && !isProcessing && userPos) {
      timeout = setTimeout(() => {
        autoVerifyFace();
      }, 1500);
    }
    return () => clearTimeout(timeout);
  }, [isCameraActive, isProcessing, userPos]);

  const updateLocation = () => {
    if (!navigator.geolocation) {
      setGpsStatus("GPS tidak didukung di browser ini.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude: lat, longitude: lng } = position.coords;
        setUserPos({ lat, lng });
        const dist = getDistance(lat, lng, schoolPos.lat, schoolPos.lng);
        if (dist <= settings.radius) {
          setIsInsideZone(true);
          setGpsStatus("Anda berada di dalam radius sekolah.");
        } else {
          setIsInsideZone(false);
          setGpsStatus(`Anda berada di luar radius (${Math.round(dist)}m).`);
        }
      },
      (error) => {
        setGpsStatus(error.code === 1 ? "Izin lokasi ditolak." : "Gagal mendapatkan lokasi.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const loadFaceModels = async () => {
    if (isModelLoaded) return;
    setFaceStatus("Memuat Kamera...");
    try {
      const faceapi = await import("@vladmandic/face-api");
      faceapiRef.current = faceapi;
      await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri("/models"),
        faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
        faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
      ]);
      setIsModelLoaded(true);
      setFaceStatus("Kamera Siap.");
    } catch (e) {
      setFaceStatus("Gagal Memuat Kamera.");
    }
  };

  const requestCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach((track) => track.stop());
      if (navigator.permissions && navigator.permissions.query) {
        const result = await navigator.permissions.query({ name: 'camera' });
        setCameraPermission(result.state);
      } else {
        setCameraPermission("granted");
      }
    } catch (err) {
      console.error("Camera permission error:", err);
      setCameraPermission("denied");
    }
  };

  const startCamera = () => {
    isSubmittingRef.current = false;
    setIsCameraActive(true);
    setFaceStatus("Menunggu kamera...");
  };

  const stopCamera = () => {
    isSubmittingRef.current = false;
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setIsCameraActive(false);
    setFaceStatus("Kamera nonaktif.");
  };

  // Camera initialization effect
  useEffect(() => {
    let active = true;
    const init = async () => {
      if (!isCameraActive || !videoRef.current) return;

      try {
        if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } }
        });

        if (active && videoRef.current) {
          videoRef.current.srcObject = stream;
          streamRef.current = stream;
          setFaceStatus("Posisikan wajah Anda tepat di tengah.");
        }
      } catch (err) {
        if (active) setFaceStatus("Gagal akses kamera.");
      }
    };

    init();
    return () => { active = false; };
  }, [isCameraActive]);

  const autoVerifyFace = async () => {
    const faceapi = faceapiRef.current;
    if (!videoRef.current || !savedDescriptor || !faceapi || !isCameraActive || isProcessing || isSubmittingRef.current) return;
    try {
      const detection = await faceapi.detectSingleFace(videoRef.current, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.7 })).withFaceLandmarks().withFaceDescriptor();
      if (detection) {
        const savedFloatArray = new Float32Array(savedDescriptor);
        const distance = faceapi.euclideanDistance(detection.descriptor, savedFloatArray);
        if (distance < 0.45) {
          isSubmittingRef.current = true;
          setIsProcessing(true);
          setFaceStatus("Wajah Cocok! Menyimpan...");
          const res = await savePresensiAction(userPos.lat, userPos.lng, true);
          if (res.success) {
            setFaceStatus("Presensi Berhasil!");
            setTimeout(() => { stopCamera(); router.push("/guru"); }, 2000);
          } else {
            setFaceStatus(`Gagal: ${res.error}`);
            setIsProcessing(false);
            isSubmittingRef.current = false;
          }
        } else {
          setFaceStatus("Wajah tidak cocok, coba lagi.");
        }
      } else {
        setFaceStatus("Wajah tidak terdeteksi...");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Auto-verify loop
  useEffect(() => {
    let interval;
    if (isCameraActive && !isProcessing && isModelLoaded) {
      // Delay sedikit agar video stabil
      const timer = setTimeout(() => {
        interval = setInterval(() => {
          autoVerifyFace();
        }, 1500); // Scan setiap 1.5 detik
      }, 1000);

      return () => {
        clearTimeout(timer);
        clearInterval(interval);
      };
    }
  }, [isCameraActive, isProcessing, isModelLoaded]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <div className="glass rounded-3xl p-8 bg-surface shadow-xl border border-surface-border overflow-hidden relative group">
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <h2 className="text-3xl font-extrabold text-foreground tracking-tight">{attType === "MASUK" ? "Presensi Masuk" : attType === "PULANG" ? "Presensi Pulang" : "Presensi Selesai"}</h2>
              <p className="text-nav-text font-medium">{attType === "SELESAI" ? "Anda sudah presensi hari ini. Terima kasih!" : "Silakan lakukan verifikasi lokasi dan wajah."}</p>
            </div>
            {attType !== "SELESAI" && (
              <button
                onClick={() => userPos && startCamera()}
                disabled={!userPos || !isModelLoaded}
                className={`group flex items-center gap-3 px-8 py-4 rounded-2xl font-bold transition-all shadow-lg active:scale-95 cursor-pointer ${userPos ? 'bg-brand-primary text-white shadow-brand-primary/30 hover:bg-purple-700' : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 shadow-none cursor-not-allowed grayscale'}`}
              >
                <Camera size={24} className={userPos ? "animate-pulse" : ""} />
                {attType === "MASUK" ? "Mulai Presensi Masuk" : "Mulai Presensi Pulang"}
              </button>
            )}
          </div>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={`flex items-center gap-4 p-5 rounded-2xl border transition-all ${isInsideZone ? 'bg-green-50 border-green-200 text-green-900 dark:bg-green-500/10 dark:border-green-500/20 dark:text-green-400' : 'bg-red-50 border-red-200 text-red-900 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-400'}`}>
              <div className={`p-3 rounded-xl ${isInsideZone ? 'bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400' : 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400'}`}>{isInsideZone ? <CheckCircle size={24} /> : <AlertCircle size={24} />}</div>
              <div>
                <p className="text-[10px] uppercase tracking-widest font-extrabold opacity-60">Status Lokasi</p>
                <p className="text-base font-black leading-tight">{gpsStatus}</p>
              </div>
            </div>
            <div className={`flex items-center gap-4 p-5 rounded-2xl border transition-all ${isModelLoaded && cameraPermission === 'granted' ? 'bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-500/10 dark:border-blue-500/20 dark:text-blue-400' : 'bg-slate-50 border-slate-200 text-slate-900 dark:bg-slate-800/10 dark:border-slate-700/20 dark:text-slate-400'}`}>
              <div className={`p-3 rounded-xl ${isModelLoaded && cameraPermission === 'granted' ? 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-800/20 dark:text-slate-400'}`}>{isModelLoaded ? <Camera size={24} /> : <div className="w-6 h-6 border-3 border-slate-300 border-t-slate-600 rounded-full animate-spin" />}</div>
              <div className="flex-1">
                <p className="text-[10px] uppercase tracking-widest font-extrabold opacity-60">Status Sistem</p>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-base font-black leading-tight">
                    {!isModelLoaded ? "Sedang Menyiapkan..." : cameraPermission === 'granted' ? "Biometrik Siap" : "Akses Kamera?"}
                  </p>
                  {isModelLoaded && cameraPermission !== 'granted' && (
                    <button
                      onClick={requestCameraPermission}
                      className="text-[10px] bg-brand-primary text-white px-3 py-1.5 rounded-lg font-bold hover:bg-purple-700 transition-all cursor-pointer shadow-lg shadow-brand-primary/20"
                    >
                      Izinkan
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="glass rounded-3xl p-6 bg-surface shadow-sm border border-surface-border">
        <div className="flex items-center justify-between mb-4 px-2">
          <div className="flex items-center gap-2">
            <MapPin size={18} className="text-brand-primary" />
            <span className="font-bold text-foreground">Lokasi Sekolah</span>
          </div>
          <button
            onClick={updateLocation}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-brand-primary transition-all active:rotate-180 duration-500 cursor-pointer"
            title="Refresh Lokasi"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" /><path d="M16 16h5v5" /></svg>
          </button>
        </div>
        <div className="rounded-2xl overflow-hidden border border-surface-border shadow-inner bg-background relative h-96">
          <GuruMapClient userPos={userPos} schoolPos={schoolPos} radius={settings.radius} />
          {!userPos && (
            <div className="absolute inset-0 z-[5] bg-slate-500/20 backdrop-blur-[4px] flex flex-col items-center justify-center p-6 text-center">
              <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-100 dark:border-slate-800 max-w-xs animate-in zoom-in-95 duration-300">
                <div className="w-20 h-20 bg-red-50 dark:bg-red-500/10 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                  <MapPin size={36} />
                </div>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mb-3 tracking-tight">Lokasi Belum Aktif</h3>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">Harap izinkan akses lokasi untuk memverifikasi posisi Anda di sekolah.</p>
                <button
                  onClick={updateLocation}
                  className="w-full py-4 bg-brand-primary text-white font-bold rounded-2xl shadow-lg shadow-brand-primary/20 hover:bg-purple-700 transition-all active:scale-95 cursor-pointer text-base"
                >
                  Aktifkan Lokasi
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Legend Below Map */}
        <div className="mt-4 flex flex-wrap gap-6 items-center justify-center py-2 border-t border-surface-border/50 pt-4">
          <div className="flex items-center gap-2.5">
            <div className="w-3 h-3 bg-brand-secondary border border-brand-secondary/30 rounded-full shadow-sm" />
            <span className="text-[10px] font-bold text-nav-text uppercase tracking-widest">Zona ({settings.radius}m)</span>
          </div>
          <div className="flex items-center gap-2.5">
            <img src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png" className="h-5 drop-shadow-sm" alt="Sekolah" />
            <span className="text-[10px] font-bold text-nav-text uppercase tracking-widest">Sekolah</span>
          </div>
          <div className="flex items-center gap-2.5">
            <img src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png" className="h-5 drop-shadow-sm" alt="Anda" />
            <span className="text-[10px] font-bold text-nav-text uppercase tracking-widest">Anda</span>
          </div>
        </div>
      </div>
      {isCameraActive && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center overflow-hidden">
          <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-20 bg-gradient-to-b from-black/80 to-transparent">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-white text-sm font-bold uppercase tracking-wider">{attType === "MASUK" ? "Presensi Masuk" : "Presensi Pulang"}</span>
            </div>
            <button onClick={stopCamera} className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md transition-all cursor-pointer"><XCircle size={24} /></button>
          </div>
          <div className="relative w-full h-full flex items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
            />
            <div className="relative z-10 flex flex-col items-center justify-center">
              <div className="w-64 h-80 md:w-80 md:h-96 border-4 border-white/40 rounded-[60px] relative">
                <div className="absolute inset-0 border-2 border-white/20 rounded-[58px] animate-[pulse_2s_infinite]" />
              </div>
              <div className="mt-10 px-8 py-4 bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center gap-4">
                {isProcessing ? <div className="w-6 h-6 border-3 border-white/20 border-t-white rounded-full animate-spin" /> : <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />}
                <span className="text-white font-bold text-lg">{faceStatus}</span>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
  );
}
