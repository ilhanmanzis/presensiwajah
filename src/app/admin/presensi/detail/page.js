import { PrismaClient } from "@prisma/client";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import DetailClient from "./DetailClient";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

const prisma = new PrismaClient();

export default async function PresensiDetailPage({ searchParams }) {
  const params = await searchParams;
  const teacherId = params.teacherId;
  const dateStr = params.date;

  if (!teacherId || !dateStr) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <h2 className="text-xl font-bold mb-4">Parameter tidak lengkap</h2>
        <Link
          href="/admin/presensi/bulanan"
          className="px-6 py-2 bg-brand-primary text-white rounded-xl shadow hover:bg-purple-700"
        >
          Kembali
        </Link>
      </div>
    );
  }

  // Fetch Teacher
  const teacher = await prisma.user.findUnique({
    where: { id: teacherId }
  });

  if (!teacher) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <h2 className="text-xl font-bold mb-4">Data Guru tidak ditemukan</h2>
        <Link
          href="/admin/presensi/bulanan"
          className="px-6 py-2 bg-brand-primary text-white rounded-xl shadow hover:bg-purple-700"
        >
          Kembali
        </Link>
      </div>
    );
  }

  // Fetch Attendance for that specific date
  // dateStr is "YYYY-MM-DD"
  const targetDate = new Date(`${dateStr}T00:00:00.000Z`);

  const att = await prisma.attendance.findUnique({
    where: {
      user_id_tanggal: {
        user_id: teacherId,
        tanggal: targetDate,
      }
    }
  });

  const masuk = att?.jam_masuk ? { 
    id: att.id,
    waktu: att.jam_masuk, 
    latitude: att.lat_masuk, 
    longitude: att.lng_masuk, 
    distance: att.dist_masuk, 
    catatan: att.catatan_masuk, 
    keterangan: att.ket_masuk,
    status: att.status 
  } : null;

  const pulang = att?.jam_pulang ? { 
    id: att.id,
    waktu: att.jam_pulang, 
    latitude: att.lat_pulang, 
    longitude: att.lng_pulang, 
    distance: att.dist_pulang, 
    catatan: att.catatan_pulang,
    status: att.status
  } : null;

  // Fetch global settings
  const settings = await prisma.settings.findUnique({
    where: { id: "global" }
  });

  const formattedDate = format(new Date(dateStr), "dd MMMM yyyy", { locale: id });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <div className="flex items-center gap-4">

        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">Detail Presensi</h1>
          <p className="text-sm font-medium text-nav-text opacity-70 mt-1">
            Lihat informasi detail dan lokasi presensi guru.
          </p>
        </div>
      </div>

      <DetailClient
        attendanceId={att?.id}
        teacher={teacher}
        dateStr={dateStr}
        formattedDate={formattedDate}
        masuk={masuk || null}
        pulang={pulang || null}
        status={att?.status || "Belum Ada Data"}
        keterangan={att?.keterangan}
        settings={settings}
      />
    </div>
  );
}
