import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type"); // individual | rekap
  const month = parseInt(searchParams.get("month"));
  const year = parseInt(searchParams.get("year"));
  const userId = searchParams.get("userId");

  if (!month || !year) {
    return NextResponse.json({ error: "Month and Year are required" }, { status: 400 });
  }

  try {
    // Calculate date range for the month
    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

    if (type === "individual") {
      if (!userId) return NextResponse.json({ error: "UserId is required for individual report" }, { status: 400 });

      const teacher = await prisma.user.findUnique({ where: { id: userId } });
      if (!teacher) return NextResponse.json({ error: "Teacher not found" }, { status: 404 });

      // Fetch all attendance for this teacher in this month
      const attendances = await prisma.attendance.findMany({
        where: {
          user_id: userId,
          tanggal: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: { tanggal: "asc" },
      });

      // Map to formatted data for export
      const formattedData = attendances.map(att => ({
        dateStr: att.tanggal.toISOString().split('T')[0].split('-').reverse().join('-'),
        status: att.status,
        keterangan: att.keterangan, // For Sakit/Izin
        masuk: att.jam_masuk ? { 
          waktu: att.jam_masuk, 
          keterangan: att.ket_masuk, 
          catatan: att.catatan_masuk 
        } : null,
        pulang: att.jam_pulang ? { 
          waktu: att.jam_pulang, 
          catatan: att.catatan_pulang 
        } : null,
      }));

      return NextResponse.json({ teacher, data: formattedData });

    } else if (type === "rekap") {
      // Fetch all teachers
      const teachers = await prisma.user.findMany({
        where: { role: "GURU" },
        orderBy: { nama_lengkap: "asc" },
      });

      // Fetch all attendance for this month
      const allAttendances = await prisma.attendance.findMany({
        where: {
          tanggal: {
            gte: startDate,
            lte: endDate,
          }
        }
      });

      // Group and count
      const rekapData = teachers.map(t => {
        const teacherAtts = allAttendances.filter(a => a.user_id === t.id);
        return {
          id: t.id,
          nip: t.nip,
          nama_lengkap: t.nama_lengkap,
          hadir: teacherAtts.filter(a => a.status === "Hadir").length,
          sakit: teacherAtts.filter(a => a.status === "Sakit").length,
          izin: teacherAtts.filter(a => a.status === "Izin").length,
        };
      });

      return NextResponse.json({ data: rekapData });
    }

    return NextResponse.json({ error: "Invalid report type" }, { status: 400 });

  } catch (error) {
    console.error("Report API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
