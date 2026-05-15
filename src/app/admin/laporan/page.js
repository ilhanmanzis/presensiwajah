import { PrismaClient } from "@prisma/client";
import LaporanClient from "./LaporanClient";

const prisma = new PrismaClient();

export default async function AdminLaporanPage() {
  const teachers = await prisma.user.findMany({
    where: { role: "GURU" },
    orderBy: { nama_lengkap: "asc" },
    select: {
      id: true,
      nama_lengkap: true,
      nip: true
    }
  });

  const settings = await prisma.settings.findUnique({
    where: { id: "global" }
  });

  return (
    <LaporanClient teachers={teachers} settings={settings} />
  );
}
