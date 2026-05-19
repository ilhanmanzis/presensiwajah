"use server";

import { PrismaClient } from "@prisma/client";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

const prisma = new PrismaClient();

// Haversine formula to check distance on server side as well
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // metres
  const φ1 = lat1 * Math.PI/180; // φ, λ in radians
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // in metres
}

export async function savePresensiAction(latitude, longitude, isFaceMatched) {
  const session = await getSession();
  if (!session) return { error: "Sesi tidak ditemukan" };
  const userId = session.user.id;

  if (!isFaceMatched) {
    return { error: "Wajah tidak cocok. Presensi ditolak." };
  }

  const settings = await prisma.settings.findUnique({ where: { id: "global" } });
  if (!settings) {
    return { error: "Pengaturan sistem belum diset oleh admin." };
  }

  const distance = getDistance(latitude, longitude, settings.latitude, settings.longitude);
  
  // Ambil waktu saat ini di zona Asia/Jakarta (WIB)
  const now = new Date();
  const jakartaFormatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  
  const parts = jakartaFormatter.formatToParts(now);
  const getValue = (type) => parts.find(p => p.type === type).value;
  
  const year = getValue('year');
  const month = getValue('month');
  const day = getValue('day');
  const hour = parseInt(getValue('hour'));
  const minute = parseInt(getValue('minute'));

  // Tanggal hari ini di UTC (00:00:00) untuk index database
  const targetDate = new Date(`${year}-${month}-${day}T00:00:00.000Z`);

  // Fetch today's record
  const existingAtt = await prisma.attendance.findUnique({
    where: {
      user_id_tanggal: {
        user_id: userId,
        tanggal: targetDate,
      }
    }
  });

  let attendanceType = "MASUK";
  if (!existingAtt) {
    attendanceType = "MASUK";
  } else if (existingAtt.jam_masuk && !existingAtt.jam_pulang) {
    // Safety check: cegah double-submission / check-out tak sengaja jika selisih waktu masuk < 30 detik
    const selisihWaktu = Math.abs(now.getTime() - new Date(existingAtt.jam_masuk).getTime());
    if (selisihWaktu < 30 * 1000) {
      const sisaDetik = Math.ceil((30 * 1000 - selisihWaktu) / 1000);
      return { error: `Silakan tunggu ${sisaDetik} detik untuk presensi pulang.` };
    }
    attendanceType = "PULANG";
  } else {
    return { error: "Anda sudah menyelesaikan presensi hari ini (Masuk & Pulang)." };
  }

  let lateText = "";
  if (attendanceType === "MASUK" && settings.jam_masuk) {
    const [hMasuk, mMasuk] = settings.jam_masuk.split(":").map(Number);
    const minutesNow = hour * 60 + minute;
    const minutesMasuk = hMasuk * 60 + mMasuk;

    if (minutesNow > minutesMasuk) {
      const diff = minutesNow - minutesMasuk;
      const hoursLate = Math.floor(diff / 60);
      const minsLate = diff % 60;
      lateText = "Terlambat";
      if (hoursLate > 0) lateText += ` ${hoursLate} jam`;
      if (minsLate > 0) lateText += ` ${minsLate} menit`;
    }
  }

  try {
    const isInside = distance <= settings.radius;
    const catatan = isInside ? "Di dalam radius" : "Di luar radius";
    
    if (attendanceType === "MASUK") {
      await prisma.attendance.create({
        data: {
          user_id: userId,
          tanggal: targetDate,
          status: "Hadir",
          jam_masuk: now,
          lat_masuk: latitude,
          lng_masuk: longitude,
          dist_masuk: distance,
          catatan_masuk: catatan,
          ket_masuk: lateText || "Tepat Waktu",
          tipe_input: "Wajah"
        }
      });
    } else {
      await prisma.attendance.update({
        where: { id: existingAtt.id },
        data: {
          jam_pulang: now,
          lat_pulang: latitude,
          lng_pulang: longitude,
          dist_pulang: distance,
          catatan_pulang: catatan,
        }
      });
    }

    revalidatePath("/guru");
    revalidatePath("/admin");
    return { success: true, type: attendanceType };
  } catch (error) {
    console.error("Attendance Save Error:", error);
    return { error: `Gagal menyimpan: ${error.message || "Kesalahan Database"}` };
  }
}
