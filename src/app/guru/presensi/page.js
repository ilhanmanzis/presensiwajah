import { PrismaClient } from "@prisma/client";
import { getSession } from "@/lib/auth";
import PresensiClient from "./PresensiClient";

const prisma = new PrismaClient();

export default async function GuruPresensiPage() {
  const session = await getSession();
  const userId = session?.user?.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { face_descriptor: true }
  });

  const settings = await prisma.settings.findUnique({
    where: { id: "global" }
  });

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

  const todayAttendances = await prisma.attendance.findMany({
    where: {
      user_id: userId,
      tanggal: targetDate
    }
  });

  return (
    <div className="space-y-6">

      {!user?.face_descriptor ? (
        <div className="p-4 glass bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 rounded-xl">
          <p className="font-semibold">Wajah Anda belum terdaftar.</p>
          <p className="text-sm mt-1">Harap hubungi Admin untuk mendaftarkan wajah Anda sebelum dapat melakukan presensi.</p>
        </div>
      ) : !settings ? (
        <div className="p-4 glass bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded-xl">
          <p className="font-semibold">Sistem Belum Siap.</p>
          <p className="text-sm mt-1">Admin belum mengatur lokasi sekolah.</p>
        </div>
      ) : (
        <PresensiClient
          savedDescriptor={user.face_descriptor}
          settings={settings}
          initialAttendances={todayAttendances}
        />
      )}
    </div>
  );
}
