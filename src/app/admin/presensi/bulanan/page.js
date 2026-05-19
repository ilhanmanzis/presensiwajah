import { PrismaClient } from "@prisma/client";
import { startOfMonth, endOfMonth, getDaysInMonth } from "date-fns";
import { formatWIB } from "@/lib/dateUtils";
import BulananClient from "./BulananClient";

const prisma = new PrismaClient();

export default async function MonthlyAttendancePage({ searchParams }) {
  const params = await searchParams;
  const month = params.month ? parseInt(params.month) : new Date().getMonth() + 1;
  const year = params.year ? parseInt(params.year) : new Date().getFullYear();
  const teacherId = params.teacherId || null;

  // Fetch all teachers for the dropdown
  const teachers = await prisma.user.findMany({
    where: { role: "GURU" },
    orderBy: { nama_lengkap: "asc" },
  });

  // Calculate range
  const startDate = startOfMonth(new Date(year, month - 1));
  const endDate = endOfMonth(new Date(year, month - 1));

  let attendanceData = [];
  let selectedTeacher = null;

  if (teacherId) {
    selectedTeacher = teachers.find(t => t.id === teacherId);

    const attendances = await prisma.attendance.findMany({
      where: {
        user_id: teacherId,
        tanggal: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        tanggal: 'asc'
      }
    });

    // Group by day
    const daysInMonth = getDaysInMonth(startDate);
    
    for (let i = 1; i <= daysInMonth; i++) {
      const currentDate = new Date(year, month - 1, i);
      const dateStr = formatWIB(currentDate, "yyyy-MM-dd");
      
      const att = attendances.find(a => formatWIB(a.tanggal, "yyyy-MM-dd") === dateStr);

      // Only add to array if there is actual attendance (Hadir, Izin, Sakit)
      if (att && att.status !== "Alfa") {
        attendanceData.push({
          date: currentDate,
          dateStr: formatWIB(currentDate, "dd MMMM yyyy"),
          status: att.status,
          masuk: att.jam_masuk ? { id: att.id, waktu: att.jam_masuk, keterangan: att.ket_masuk, catatan: att.catatan_masuk, status: att.status } : null,
          pulang: att.jam_pulang ? { id: att.id, waktu: att.jam_pulang, catatan: att.catatan_pulang, status: att.status } : null,
          isWeekend: currentDate.getDay() === 0
        });
      }
    }
  }

  return (
    <BulananClient 
      teachers={teachers}
      initialTeacherId={selectedTeacher?.id}
      initialMonth={month}
      initialYear={year}
      attendanceData={attendanceData}
    />
  );
}
