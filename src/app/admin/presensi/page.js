import { PrismaClient } from "@prisma/client";
import PresensiTableClient from "./PresensiTableClient";

const prisma = new PrismaClient();

export default async function AdminPresensiPage({ searchParams }) {
  const params = await searchParams;
  let dateStr = params.date;
  if (!dateStr) {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Jakarta",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    });
    const parts = formatter.formatToParts(new Date());
    const year = parts.find(p => p.type === "year").value;
    const month = parts.find(p => p.type === "month").value;
    const day = parts.find(p => p.type === "day").value;
    dateStr = `${year}-${month}-${day}`;
  }
  
  const targetDate = new Date(`${dateStr}T00:00:00.000Z`);

  // Fetch all attendance for the selected date
  const attendances = await prisma.attendance.findMany({
    where: {
      tanggal: targetDate,
    },
    include: {
      user: true,
    },
  });

  // Fetch all teachers to ensure everyone is listed
  const teachers = await prisma.user.findMany({
    where: { role: "GURU" },
    orderBy: { nama_lengkap: "asc" },
  });

  // Group attendance by user_id - now much simpler with one row per day
  const groupedData = teachers.map((teacher) => {
    const att = attendances.find(a => a.user_id === teacher.id);

    return {
      id: teacher.id,
      nama_lengkap: teacher.nama_lengkap,
      nip: teacher.nip,
      jam_masuk: att?.jam_masuk,
      jam_pulang: att?.jam_pulang,
      status: att?.status || "Alfa",
      ket_masuk: att?.ket_masuk,
      catatan_masuk: att?.catatan_masuk,
      catatan_pulang: att?.catatan_pulang,
    };
  }).filter(data => data.status !== "Alfa");

  return (
    <PresensiTableClient 
      initialData={groupedData} 
      selectedDate={dateStr}
    />
  );
}
