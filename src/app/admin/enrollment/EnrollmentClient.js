"use client";

import { useState, useEffect, useRef, useCallback, useTransition } from "react";
import { Camera, CheckCircle, AlertCircle, Save, X, ZoomIn, ZoomOut, Info, RefreshCw, Trash2, Edit2, UserCheck, ShieldAlert, User, Search, AlertTriangle, ChevronDown, ChevronLeft, ChevronRight, Lock, Eye, EyeOff, Upload, FileImage, Image } from "lucide-react";
import { enrollFaceAction, deleteFaceAction } from "@/app/actions/admin";

export default function EnrollmentClient({ users }) {
  // Filter users
  const eligibleUsers = users.filter(u => !u.face_descriptor);
  const registeredUsers = users.filter(u => u.face_descriptor);

  const [selectedUser, setSelectedUser] = useState("");
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [instruction, setInstruction] = useState("Menunggu...");
  const [instructionColor, setInstructionColor] = useState("text-white");
  const [capturedImage, setCapturedImage] = useState(null);
  const [faceDescriptor, setFaceDescriptor] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(null); // ID of user being deleted
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");


  const [selectSearch, setSelectSearch] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [modalError, setModalError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [isPending, startTransition] = useTransition();

  // Photo file upload states
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadImage, setUploadImage] = useState(null);
  const [uploadDescriptor, setUploadDescriptor] = useState(null);
  const [uploadError, setUploadError] = useState("");
  const [isProcessingFile, setIsProcessingFile] = useState(false);



  // Zoom management
  const [zoom, setZoom] = useState(1);
  const [hasZoomCapability, setHasZoomCapability] = useState(false);

  // Stability & Countdown
  const stabilityCounter = useRef(0);
  const lastFaceCenter = useRef({ x: 0, y: 0 });
  const detectionTimeout = useRef(null);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const zoomRef = useRef(1);
  const dropdownRef = useRef(null);

  // FaceAPI Ref to hold the dynamically loaded module
  const faceapiRef = useRef(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  }, []);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Load models on mount
  useEffect(() => {
    const loadModels = async () => {
      try {
        const faceapi = await import("@vladmandic/face-api");
        faceapiRef.current = faceapi;

        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri("/models"),
          faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
          faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
        ]);
        setIsModelLoaded(true);
      } catch (err) {
        console.error("Failed to load models:", err);
        setError("Gagal memuat model biometrik.");
      }
    };
    loadModels();

    return () => {
      if (detectionTimeout.current) clearTimeout(detectionTimeout.current);
      stopCamera();
    };
  }, [stopCamera]);

  const startScanning = async () => {
    if (!selectedUser) return;
    setIsScanning(true);
    setInstruction("Menginisialisasi Kamera...");
    setInstructionColor("text-white");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setInstruction("Mencari Wajah...");
      setInstructionColor("text-white");

      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities ? track.getCapabilities() : {};
      if (capabilities.zoom) {
        setHasZoomCapability(true);
        const minZoom = capabilities.zoom.min || 1;
        setZoom(minZoom);
        zoomRef.current = minZoom;
      } else {
        setHasZoomCapability(false);
        setZoom(1);
        zoomRef.current = 1;
      }

    } catch (err) {
      console.error(err);
      setError("Akses kamera ditolak.");
      setIsScanning(false);
    }
  };

  const handleZoomChange = (delta) => {
    if (hasZoomCapability && streamRef.current) {
      const track = streamRef.current.getVideoTracks()[0];
      const capabilities = track.getCapabilities();
      const newZoom = Math.min(Math.max(zoom + delta, capabilities.zoom.min), capabilities.zoom.max);
      setZoom(newZoom);
      zoomRef.current = newZoom;
      track.applyConstraints({ advanced: [{ zoom: newZoom }] });
    } else {
      const newZoom = Math.min(Math.max(zoom + delta, 1), 3);
      setZoom(newZoom);
      zoomRef.current = newZoom;
    }
  };

  const processFrame = useCallback(async () => {
    if (!isScanning) return;

    if (!videoRef.current || !isModelLoaded || !faceapiRef.current || videoRef.current.readyState < 2) {
      detectionTimeout.current = setTimeout(processFrame, 500);
      return;
    }

    const faceapi = faceapiRef.current;
    const video = videoRef.current;
    if (video.paused || video.ended) {
      detectionTimeout.current = setTimeout(processFrame, 500);
      return;
    }

    try {
      const detection = await faceapi.detectSingleFace(video, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!isScanning || !videoRef.current) return;

      if (!detection) {
        setInstruction("Perlihatkan wajah ke kamera");
        setInstructionColor("text-red-400");
        stabilityCounter.current = 0;
      } else {
        const box = detection.detection.box;
        const videoWidth = video.videoWidth;
        const videoHeight = video.videoHeight;
        const currentZoom = zoomRef.current;

        const rawFaceArea = (box.width * box.height) / (videoWidth * videoHeight);
        const faceArea = rawFaceArea * currentZoom * currentZoom;

        const faceCenterX = box.x + box.width / 2;
        const faceCenterY = box.y + box.height / 2;

        const movement = Math.sqrt(
          Math.pow(faceCenterX - lastFaceCenter.current.x, 2) +
          Math.pow(faceCenterY - lastFaceCenter.current.y, 2)
        );
        lastFaceCenter.current = { x: faceCenterX, y: faceCenterY };

        const facePosX = faceCenterX / videoWidth;
        const facePosY = faceCenterY / videoHeight;
        const distFromCenter = Math.sqrt(
          Math.pow(facePosX - 0.5, 2) +
          Math.pow(facePosY - 0.45, 2)
        );

        if (detection.detection.score < 0.6) {
          setInstruction("Kurang pencahayaan / Cahaya terlalu gelap");
          setInstructionColor("text-yellow-400");
          stabilityCounter.current = 0;
        } else if (distFromCenter > 0.15) {
          setInstruction("Posisikan wajah di tengah bingkai");
          setInstructionColor("text-orange-400");
          stabilityCounter.current = 0;
        } else if (faceArea < 0.12) {
          setInstruction("Wajah harus mendekat");
          setInstructionColor("text-yellow-400");
          stabilityCounter.current = 0;
        } else if (faceArea > 0.85) {
          setInstruction("Wajah terlalu dekat, sedikit menjauh");
          setInstructionColor("text-yellow-400");
          stabilityCounter.current = 0;
        } else if (movement > 15) {
          setInstruction("Tahan posisi, jangan bergerak");
          setInstructionColor("text-brand-primary");
          stabilityCounter.current = 0;
        } else {
          stabilityCounter.current += 1;
          const countdownValue = Math.max(0, 3 - Math.floor(stabilityCounter.current / 7));

          if (countdownValue > 0) {
            setInstruction(`Sempurna, Tahan... ${countdownValue}`);
            setInstructionColor("text-cyan-400");
          } else {
            setInstruction("MENGAMBIL GAMBAR...");
            setInstructionColor("text-green-400");
            captureFace(detection);
            return;
          }
        }
      }
    } catch (err) {
      console.error("Detection error:", err);
    }

    if (isScanning) {
      detectionTimeout.current = setTimeout(processFrame, 100);
    }
  }, [isScanning, isModelLoaded]);

  useEffect(() => {
    if (isScanning) {
      processFrame();
    } else {
      if (detectionTimeout.current) clearTimeout(detectionTimeout.current);
    }
  }, [isScanning, processFrame]);

  const captureFace = (detection) => {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0);

    setCapturedImage(canvas.toDataURL("image/jpeg"));
    setFaceDescriptor(Array.from(detection.descriptor));
    stopCamera();
  };

  const handleSave = async () => {
    if (!selectedUser || !faceDescriptor) return;
    setIsSaving(true);
    setError("");

    const res = await enrollFaceAction(selectedUser, faceDescriptor);
    if (res.success) {
      setSuccess("Vektor wajah berhasil disimpan ke database.");
      setCapturedImage(null);
      setFaceDescriptor(null);
      setSelectedUser("");
      setTimeout(() => setSuccess(""), 5000);
    } else {
      setError(res.error);
    }
    setIsSaving(false);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadImage(null);
    setUploadDescriptor(null);
    setUploadError("");
    setIsProcessingFile(true);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const imageUrl = event.target.result;
        setUploadImage(imageUrl);

        if (!faceapiRef.current || !isModelLoaded) {
          setUploadError("Model biometrik belum siap. Silakan tunggu.");
          setIsProcessingFile(false);
          return;
        }

        const img = new window.Image();
        img.src = imageUrl;
        img.onload = async () => {
          try {
            const faceapi = faceapiRef.current;
            const detection = await faceapi.detectSingleFace(img, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
              .withFaceLandmarks()
              .withFaceDescriptor();

            if (!detection) {
              setUploadError("Wajah tidak terdeteksi pada gambar. Pastikan wajah terlihat jelas dan menghadap ke depan.");
            } else {
              setUploadDescriptor(Array.from(detection.descriptor));
            }
          } catch (err) {
            console.error(err);
            setUploadError("Terjadi kesalahan saat memproses gambar.");
          } finally {
            setIsProcessingFile(false);
          }
        };
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      setUploadError("Gagal membaca file.");
      setIsProcessingFile(false);
    }
  };

  const handleSaveUpload = async () => {
    if (!selectedUser || !uploadDescriptor) return;
    setIsSaving(true);
    setUploadError("");

    const res = await enrollFaceAction(selectedUser, uploadDescriptor);
    if (res.success) {
      setSuccess("Vektor wajah berhasil disimpan ke database dari file foto.");
      setUploadImage(null);
      setUploadDescriptor(null);
      setSelectedUser("");
      setShowUploadModal(false);
      setTimeout(() => setSuccess(""), 5000);
    } else {
      setUploadError(res.error);
    }
    setIsSaving(false);
  };

  const handleDeleteFace = (user) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
    setShowPassword(false);
  };

  const confirmDeleteFace = async () => {
    if (!userToDelete) return;
    if (!passwordConfirm) {
      setModalError("Silakan masukkan password admin.");
      return;
    }

    setIsDeleting(userToDelete.id);
    const res = await deleteFaceAction(userToDelete.id, passwordConfirm);
    if (res.success) {
      setSuccess(res.success);
      setTimeout(() => setSuccess(""), 5000);
      setShowDeleteModal(false);
      setUserToDelete(null);
      setPasswordConfirm("");
      setModalError("");
      setShowPassword(false);
    } else {
      setModalError(res.error);
    }
    setIsDeleting(null);
  };

  const handleEditFace = (user) => {
    setSelectedUser(user.id);
    setCapturedImage(null);
    setFaceDescriptor(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filteredEligible = eligibleUsers.filter(u =>
    u.nama_lengkap.toLowerCase().includes(selectSearch.toLowerCase()) ||
    (u.nip && u.nip.toLowerCase().includes(selectSearch.toLowerCase()))
  );

  const selectedUserObj = users.find(u => u.id === selectedUser);

  const filteredRegistered = registeredUsers.filter(u =>
    u.nama_lengkap.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.nip && u.nip.toLowerCase().includes(searchTerm.toLowerCase()))
  );



  return (
    <div className="space-y-8 pb-20">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Side: Controls */}
        <div className="space-y-6">
          <div className="glass rounded-2xl p-6 shadow-sm border border-surface-border">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-purple-100 dark:bg-purple-500/20 text-brand-primary rounded-xl">
                <Camera size={24} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">Registrasi Wajah</h2>
                <p className="text-xs text-nav-text">Pilih guru dan lakukan pemindaian wajah</p>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-nav-text mb-2 ml-1">Pilih Guru (Hanya yang belum terdaftar)</label>
                {eligibleUsers.length > 0 ? (
                  <div className="relative" ref={dropdownRef}>
                    <div
                      onClick={() => !isScanning && setIsDropdownOpen(!isDropdownOpen)}
                      className={`w-full px-4 py-3 rounded-xl border border-surface-border bg-background flex items-center justify-between cursor-pointer transition-all hover:border-brand-primary ${isDropdownOpen ? 'ring-2 ring-brand-primary border-brand-primary' : ''} ${isScanning ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <span className={selectedUser ? "text-foreground font-medium" : "text-nav-text"}>
                        {selectedUserObj ? `${selectedUserObj.nama_lengkap} --- ${selectedUserObj.nip || 'Tanpa NIP'}` : "-- Pilih Nama Guru --"}
                      </span>
                      <ChevronDown size={20} className={`text-nav-text transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                    </div>

                    {isDropdownOpen && (
                      <div className="absolute z-50 w-full mt-2 bg-surface border border-surface-border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-3 border-b border-surface-border sticky top-0 bg-surface z-10">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-nav-text" size={16} />
                            <input
                              type="text"
                              autoFocus
                              autoComplete="off"
                              placeholder="Cari nama atau NIP..."
                              value={selectSearch}
                              onChange={(e) => setSelectSearch(e.target.value)}
                              className="w-full pl-10 pr-4 py-2 bg-background border border-surface-border rounded-xl text-sm text-foreground outline-none focus:ring-2 focus:ring-brand-primary transition-all"
                            />
                          </div>
                        </div>
                        <div className="max-h-60 overflow-y-auto custom-scrollbar">
                          {filteredEligible.length > 0 ? (
                            filteredEligible.map(u => (
                              <div
                                key={u.id}
                                onClick={() => {
                                  setSelectedUser(u.id);
                                  setCapturedImage(null);
                                  setFaceDescriptor(null);
                                  setIsDropdownOpen(false);
                                  setSelectSearch("");
                                }}
                                className={`px-4 py-3 hover:bg-brand-primary/10 cursor-pointer transition-colors flex flex-col gap-0.5 ${selectedUser === u.id ? 'bg-brand-primary/5 border-l-4 border-brand-primary' : ''}`}
                              >
                                <span className="font-bold text-sm text-foreground">{u.nama_lengkap}</span>
                                <span className="text-xs text-nav-text">NIP: {u.nip || "-"}</span>
                              </div>
                            ))
                          ) : (
                            <div className="px-4 py-8 text-center text-nav-text">
                              <User size={32} className="mx-auto mb-2 opacity-20" />
                              <p className="text-xs">Guru tidak ditemukan</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-700 dark:text-blue-400 rounded-xl flex items-center gap-3">
                    <UserCheck size={20} />
                    <span className="text-sm font-medium">Semua guru sudah terdaftar di sistem!</span>
                  </div>
                )}
              </div>

              {!capturedImage ? (
                <div className="space-y-4">
                  <button
                    onClick={startScanning}
                    disabled={!isModelLoaded || !selectedUser || isScanning}
                    className="w-full py-4 bg-brand-primary hover:bg-purple-700 text-white font-bold rounded-xl shadow-lg hover:shadow-brand-primary/20 transition-all flex justify-center items-center gap-3 cursor-pointer disabled:opacity-50"
                  >
                    <Camera size={22} />
                    {isScanning ? "Kamera Aktif..." : "Mulai Pindai Wajah"}
                  </button>

                  <div className="flex items-center gap-3 py-1">
                    <div className="h-[1px] bg-surface-border flex-1"></div>
                    <span className="text-xs font-black text-nav-text uppercase tracking-widest opacity-60">atau</span>
                    <div className="h-[1px] bg-surface-border flex-1"></div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (!selectedUser) {
                        setError("Silakan pilih guru terlebih dahulu!");
                        return;
                      }
                      setError("");
                      setShowUploadModal(true);
                      setUploadImage(null);
                      setUploadDescriptor(null);
                      setUploadError("");
                    }}
                    disabled={!isModelLoaded || !selectedUser || isScanning}
                    className="w-full py-3.5 border border-brand-primary hover:bg-brand-primary/5 dark:hover:bg-brand-primary/10 text-brand-primary font-bold rounded-xl transition-all flex justify-center items-center gap-3 cursor-pointer disabled:opacity-50"
                  >
                    <Upload size={20} />
                    Registrasi lewat File Foto
                  </button>
                </div>
              ) : (
                <div className="space-y-4 animate-in zoom-in-95 duration-300">
                  <div className="p-4 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 text-green-700 dark:text-green-400 rounded-xl flex items-center gap-3">
                    <UserCheck className="flex-shrink-0" size={24} />
                    <div>
                      <div className="font-bold">Wajah Berhasil Dipindai!</div>
                      <p className="text-xs opacity-80">Data biometrik guru ini sudah siap disimpan.</p>
                    </div>
                  </div>

                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="w-full py-4 bg-brand-primary hover:bg-purple-700 text-white font-bold rounded-xl shadow-lg hover:shadow-brand-primary/20 transition-all flex justify-center items-center gap-3 cursor-pointer disabled:opacity-50"
                  >
                    {isSaving ? <RefreshCw className="animate-spin" /> : <Save size={22} />}
                    Simpan Vektor Wajah
                  </button>

                  <button
                    onClick={() => { setCapturedImage(null); setFaceDescriptor(null); }}
                    className="w-full py-3 border border-surface-border bg-surface text-nav-text hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 rounded-xl font-medium transition-all cursor-pointer"
                  >
                    Pindai Ulang
                  </button>
                </div>
              )}

              {success && (
                <div className="p-4 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 text-green-700 dark:text-green-400 rounded-xl text-sm font-medium flex items-center gap-2 animate-in slide-in-from-top-2">
                  <CheckCircle size={18} /> {success}
                </div>
              )}

              {error && (
                <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 rounded-xl text-sm font-medium flex items-center gap-2">
                  <AlertCircle size={18} /> {error}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Preview */}
        <div className="relative">
          <div className="glass rounded-2xl overflow-hidden aspect-square border border-surface-border shadow-2xl bg-slate-900 flex items-center justify-center relative group">
            {capturedImage ? (
              <img src={capturedImage} className="w-full h-full object-cover" alt="Captured Face" />
            ) : (
              <div className="flex flex-col items-center text-slate-500">
                <div className="relative">
                  <Camera size={80} className="mb-4 opacity-10" />
                </div>
                <p className="text-xs font-bold opacity-30 uppercase tracking-[0.3em]">AI Biometric Preview</p>
              </div>
            )}

            {!capturedImage && !isScanning && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-[70%] h-[75%] border-2 border-dashed border-white/5 rounded-full" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Face Management Table */}
      <div className="glass rounded-2xl overflow-hidden border border-surface-border shadow-sm bg-surface">
        <div className="p-6 border-b border-surface-border flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-foreground">Daftar Guru Terdaftar</h3>
            <p className="text-xs text-nav-text">Kelola data biometrik wajah yang sudah tersimpan</p>
          </div>

          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-nav-text" size={16} />
            <input
              type="text"
              autoComplete="off"
              placeholder="Cari nama atau NIP..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-background border border-surface-border rounded-xl text-sm text-foreground outline-none focus:ring-2 focus:ring-brand-primary transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-nav-text uppercase bg-surface border-b border-surface-border">
              <tr>
                <th className="px-4 py-3 font-semibold">No</th>
                <th className="px-6 py-3 font-semibold">Nama</th>
                <th className="px-6 py-3 font-semibold">NIP</th>
                <th className="px-6 py-3 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {filteredRegistered.length > 0 ? (
                filteredRegistered.map((user, index) => (
                  <tr key={user.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-4 text-nav-text">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-500/20 text-brand-primary flex items-center justify-center font-bold text-xs">
                          {user.nama_lengkap.charAt(0)}
                        </div>
                        <span className="text-sm font-medium text-foreground">{user.nama_lengkap}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-nav-text">
                      {user.nip || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleDeleteFace(user)}
                          disabled={isDeleting === user.id}
                          className="p-2 text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-500/10 rounded-lg transition-all disabled:opacity-50 cursor-pointer"
                          title="Hapus Data Wajah"
                        >
                          {isDeleting === user.id ? <RefreshCw className="animate-spin" size={18} /> : <Trash2 size={18} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-nav-text">
                    <div className="flex flex-col items-center gap-2 opacity-50">
                      <ShieldAlert size={48} className="mb-2" />
                      <p className="font-medium">Tidak ada data guru yang cocok.</p>
                      <p className="text-xs">Silakan lakukan registrasi wajah di atas.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>


      </div>

      {/* Modal Konfirmasi Hapus */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface w-full max-w-sm rounded-2xl shadow-2xl border border-surface-border overflow-hidden">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Hapus Data Wajah?</h3>
              <p className="text-sm text-nav-text mb-6">
                Anda akan menghapus data biometrik untuk <span className="font-bold text-foreground">{userToDelete?.nama_lengkap}</span>. Masukkan password admin untuk konfirmasi.
              </p>

              <div className="mb-6 text-left">
                <label className="block text-xs font-medium text-nav-text mb-2 ml-1">Password Admin</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-nav-text" size={18} />
                  <input
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Masukkan password admin..."
                    value={passwordConfirm}
                    onChange={(e) => { setPasswordConfirm(e.target.value); setModalError(""); }}
                    className={`w-full pl-10 pr-12 py-3 bg-background border rounded-xl text-sm text-foreground outline-none transition-all ${modalError ? 'border-red-500 focus:ring-2 focus:ring-red-500/20' : 'border-surface-border focus:ring-2 focus:ring-brand-primary'}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-nav-text hover:text-brand-primary transition-colors cursor-pointer p-1"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {modalError && (
                  <p className="mt-2 text-[10px] text-red-500 font-medium animate-in fade-in slide-in-from-top-1">
                    {modalError}
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => { setShowDeleteModal(false); setUserToDelete(null); setPasswordConfirm(""); setModalError(""); }}
                  className="flex-1 py-3 border border-surface-border text-nav-text hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-medium transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  onClick={confirmDeleteFace}
                  disabled={isDeleting}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-lg shadow-red-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isDeleting ? <RefreshCw className="animate-spin" size={18} /> : <Trash2 size={18} />}
                  Hapus
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full-Screen Scanning Modal */}
      {isScanning && (
        <div className="fixed inset-0 z-[999] bg-black flex flex-col items-center justify-center animate-in fade-in duration-500">
          <button
            onClick={stopCamera}
            className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all cursor-pointer z-[1001]"
          >
            <X size={28} />
          </button>

          <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              style={{ transform: `scaleX(-1) scale(${zoom})` }}
              className="w-full h-full object-cover transition-transform duration-300"
            />

            <div className="absolute inset-0 pointer-events-none z-[1000]">
              <svg className="w-full h-full">
                <defs>
                  <mask id="overlay-mask">
                    <rect width="100%" height="100%" fill="white" />
                    <ellipse cx="50%" cy="45%" rx="min(38%, 220px)" ry="min(45%, 350px)" fill="black" />
                  </mask>
                </defs>
                <rect width="100%" height="100%" fill="rgba(0,0,0,0.8)" mask="url(#overlay-mask)" />
                <ellipse
                  cx="50%"
                  cy="45%"
                  rx="min(38%, 220px)"
                  ry="min(45%, 350px)"
                  fill="none"
                  stroke="cyan"
                  strokeWidth="4"
                  strokeDasharray="10 5"
                  className="animate-spin-slow"
                />
              </svg>
            </div>

            <div className="absolute top-[10%] left-0 right-0 text-center px-6 z-[1001]">
              <div className="inline-block px-6 py-4 bg-black/60 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl scale-in-95 animate-in">
                <h3 className={`text-2xl md:text-3xl font-black uppercase tracking-tighter drop-shadow-2xl ${instructionColor} transition-all duration-300`}>
                  {instruction}
                </h3>
              </div>
            </div>

            <div className="absolute bottom-12 flex gap-8 z-[1001]">
              <button
                onClick={() => handleZoomChange(-0.5)}
                className="p-5 bg-white/10 hover:bg-brand-primary text-white rounded-full backdrop-blur-xl transition-all cursor-pointer border border-white/20 active:scale-90"
              >
                <ZoomOut size={36} />
              </button>
              <button
                onClick={() => handleZoomChange(0.5)}
                className="p-5 bg-white/10 hover:bg-brand-primary text-white rounded-full backdrop-blur-xl transition-all cursor-pointer border border-white/20 active:scale-90"
              >
                <ZoomIn size={36} />
              </button>
            </div>

            {stabilityCounter.current > 0 && (
              <div className="absolute bottom-[25%] z-[1001] animate-in zoom-in">
                <div className="w-32 h-32 border-8 border-white/10 rounded-full flex items-center justify-center relative">
                  <svg className="absolute inset-0 w-full h-full -rotate-90">
                    <circle
                      cx="64" cy="64" r="56"
                      fill="none" stroke="currentColor" strokeWidth="8"
                      className="text-cyan-400 transition-all duration-200"
                      strokeDasharray="351.8"
                      strokeDashoffset={351.8 - (stabilityCounter.current * (351.8 / 20))}
                    />
                  </svg>
                  <span className="text-white font-black text-3xl drop-shadow-lg">
                    {Math.max(1, 3 - Math.floor(stabilityCounter.current / 7))}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Modal Upload Foto */}
      {showUploadModal && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface w-full max-w-lg rounded-[2rem] shadow-2xl border border-surface-border overflow-hidden">
            <div className="p-6 border-b border-surface-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-brand-primary/10 text-brand-primary rounded-xl">
                  <FileImage size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">Upload File Foto</h3>
                  <p className="text-xs text-nav-text">Registrasi wajah guru menggunakan gambar</p>
                </div>
              </div>
              <button
                onClick={() => { setShowUploadModal(false); setUploadImage(null); setUploadDescriptor(null); setUploadError(""); }}
                className="p-2 text-nav-text hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Selected Teacher Info */}
              <div className="p-4 bg-brand-primary/5 border border-brand-primary/10 rounded-2xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-primary text-white flex items-center justify-center font-black">
                  {selectedUserObj?.nama_lengkap?.charAt(0)}
                </div>
                <div>
                  <p className="text-xs text-nav-text">Nama Guru:</p>
                  <p className="text-sm font-bold text-foreground">{selectedUserObj?.nama_lengkap}</p>
                </div>
              </div>

              {/* Upload area */}
              <div className="space-y-4">
                {!uploadImage ? (
                  <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-surface-border hover:border-brand-primary dark:hover:border-brand-primary bg-background rounded-2xl cursor-pointer transition-all duration-300 group">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <div className="p-4 bg-brand-primary/5 rounded-full text-brand-primary mb-3 group-hover:scale-110 transition-transform">
                        <Upload size={28} />
                      </div>
                      <p className="text-sm font-bold text-foreground">Pilih File Foto Guru</p>
                      <p className="text-[11px] text-nav-text mt-1">PNG, JPG atau JPEG (Maks. 5MB)</p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </label>
                ) : (
                  <div className="relative rounded-2xl overflow-hidden border border-surface-border bg-slate-900 aspect-video flex items-center justify-center max-h-56">
                    <img src={uploadImage} className="w-full h-full object-contain" alt="Uploaded Preview" />
                    
                    {!isProcessingFile && (
                      <button
                        onClick={() => { setUploadImage(null); setUploadDescriptor(null); setUploadError(""); }}
                        className="absolute top-3 right-3 p-2 bg-red-600 hover:bg-red-700 text-white rounded-full transition-all cursor-pointer shadow-lg"
                        title="Hapus Foto"
                      >
                        <X size={16} />
                      </button>
                    )}

                    {isProcessingFile && (
                      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex flex-col items-center justify-center gap-3 text-white">
                        <RefreshCw className="animate-spin text-brand-primary" size={32} />
                        <span className="text-xs font-bold tracking-wider uppercase animate-pulse">Mendeteksi Wajah...</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Status and Errors */}
              {uploadDescriptor && (
                <div className="p-4 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 text-green-700 dark:text-green-400 rounded-xl flex items-center gap-3 animate-in zoom-in-95 duration-200">
                  <CheckCircle className="flex-shrink-0" size={22} />
                  <div>
                    <div className="font-bold text-xs md:text-sm">Wajah Terdeteksi!</div>
                    <p className="text-[10px] md:text-xs opacity-85">Karakteristik biometrik berhasil dianalisis.</p>
                  </div>
                </div>
              )}

              {uploadError && (
                <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 rounded-xl text-xs font-medium flex items-center gap-2 animate-in zoom-in-95 duration-200">
                  <AlertCircle size={18} className="shrink-0" /> {uploadError}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-surface-border bg-slate-50/50 dark:bg-slate-900/30 flex gap-3">
              <button
                onClick={() => { setShowUploadModal(false); setUploadImage(null); setUploadDescriptor(null); setUploadError(""); }}
                className="flex-1 py-3 border border-surface-border text-nav-text hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-medium transition-all cursor-pointer text-xs md:text-sm"
              >
                Batal
              </button>
              <button
                onClick={handleSaveUpload}
                disabled={isSaving || !uploadDescriptor || isProcessingFile}
                className="flex-1 py-3 bg-brand-primary hover:bg-purple-700 text-white rounded-xl font-bold shadow-lg shadow-brand-primary/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-xs md:text-sm"
              >
                {isSaving ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
                Simpan Vektor Wajah
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
