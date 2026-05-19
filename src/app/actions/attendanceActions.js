"use server";

import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { toUTCfromWIB } from "@/lib/dateUtils";

const prisma = new PrismaClient();

/**
 * Save manual attendance (Masuk, Izin, Sakit)
 */
export async function saveManualAttendance(formData) {
  const userId = formData.get("userId");
  const tanggalStr = formData.get("tanggal"); // YYYY-MM-DD
  const jamMasukStr = formData.get("jamMasuk"); // HH:mm
  const jamPulangStr = formData.get("jamPulang"); // HH:mm (Optional)
  const status = formData.get("status"); // Hadir, Izin, Sakit, Dinas Luar
  const keterangan = formData.get("keterangan") || "";
  const autoCheckout = formData.get("autoCheckout") === "true";

  if (!userId || !tanggalStr || !status) {
    return { error: "Data tidak lengkap." };
  }

  const tanggal = new Date(`${tanggalStr}T00:00:00.000Z`);

  try {
    // 1. Check for existing attendance for this user on this date
    const existing = await prisma.attendance.findUnique({
      where: {
        user_id_tanggal: {
          user_id: userId,
          tanggal: tanggal,
        },
      },
    });

    if (existing) {
      return { 
        error: "Presensi gagal: Data kehadiran untuk guru ini pada tanggal tersebut sudah ada. Silakan periksa menu laporan atau hapus data lama terlebih dahulu." 
      };
    }

    // Fetch settings for default coordinates
    const settings = await prisma.settings.findUnique({
      where: { id: "global" }
    });

    // 2. Prepare Data
    const data = {
      user_id: userId,
      tanggal: tanggal,
      status: status,
      keterangan: status !== "Hadir" ? keterangan : null,
      tipe_input: "Manual_Admin",
    };

    if (status === "Hadir") {
      if (jamMasukStr) {
        data.jam_masuk = toUTCfromWIB(tanggalStr, jamMasukStr);
        
        let ketMasuk = "Tepat Waktu";
        if (settings?.jam_masuk) {
          const [hMasuk, mMasuk] = settings.jam_masuk.split(":").map(Number);
          const [hInput, mInput] = jamMasukStr.split(":").map(Number);
          const minutesInput = hInput * 60 + mInput;
          const minutesMasuk = hMasuk * 60 + mMasuk;

          if (minutesInput > minutesMasuk) {
            const diff = minutesInput - minutesMasuk;
            const hoursLate = Math.floor(diff / 60);
            const minsLate = diff % 60;
            ketMasuk = "Terlambat";
            if (hoursLate > 0) ketMasuk += ` ${hoursLate} jam`;
            if (minsLate > 0) ketMasuk += ` ${minsLate} menit`;
          }
        }
        
        data.ket_masuk = ketMasuk;
        data.lat_masuk = settings?.latitude;
        data.lng_masuk = settings?.longitude;
        data.catatan_masuk = "Di dalam radius";
        data.dist_masuk = 0;
      }
      
      if (autoCheckout && jamPulangStr) {
        data.jam_pulang = toUTCfromWIB(tanggalStr, jamPulangStr);
        data.lat_pulang = settings?.latitude;
        data.lng_pulang = settings?.longitude;
        data.catatan_pulang = "Di dalam radius";
        data.dist_pulang = 0;
      }
    }

    await prisma.attendance.create({ data });

    revalidatePath("/admin/input-presensi");
    revalidatePath("/admin/presensi");
    revalidatePath("/admin");

    return { success: `Presensi ${status} berhasil disimpan.` };
  } catch (error) {
    console.error("Save Manual Attendance Error:", error);
    return { error: "Gagal menyimpan data presensi." };
  }
}

/**
 * Process manual checkout for a teacher who is already present
 */
export async function processManualCheckout(formData) {
  const attendanceId = formData.get("attendanceId");
  const jamPulangStr = formData.get("jamPulang"); // HH:mm
  
  if (!attendanceId || !jamPulangStr) {
    return { error: "Data tidak lengkap." };
  }

  try {
    const att = await prisma.attendance.findUnique({
      where: { id: attendanceId },
    });

    if (!att) return { error: "Data presensi tidak ditemukan." };

    const settings = await prisma.settings.findUnique({
      where: { id: "global" }
    });

    const tanggalStr = att.tanggal.toISOString().split('T')[0];
    const jamPulang = toUTCfromWIB(tanggalStr, jamPulangStr);

    await prisma.attendance.update({
      where: { id: attendanceId },
      data: {
        jam_pulang: jamPulang,
        lat_pulang: settings?.latitude,
        lng_pulang: settings?.longitude,
        catatan_pulang: "Di dalam radius",
        dist_pulang: 0,
      },
    });

    revalidatePath("/admin/input-presensi");
    revalidatePath("/admin/presensi");
    revalidatePath("/admin");

    return { success: "Berhasil memproses pulang." };
  } catch (error) {
    console.error("Process Manual Checkout Error:", error);
    return { error: "Gagal memproses pulang." };
  }
}

/**
 * Get teachers who are present today but haven't checked out
 */
export async function getTeachersForCheckout() {
  const now = new Date();
  const jakartaFormatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  
  const parts = jakartaFormatter.formatToParts(now);
  const getValue = (type) => parts.find(p => p.type === type).value;
  
  const targetDate = new Date(`${getValue('year')}-${getValue('month')}-${getValue('day')}T00:00:00.000Z`);

  try {
    const presentTeachers = await prisma.attendance.findMany({
      where: {
        tanggal: targetDate,
        status: "Hadir",
        jam_pulang: null,
      },
      include: {
        user: true,
      },
      orderBy: {
        jam_masuk: "asc",
      },
    });

    return presentTeachers;
  } catch (error) {
    console.error("Get Teachers for Checkout Error:", error);
    return [];
  }
}
