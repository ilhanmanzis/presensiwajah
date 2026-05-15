import { PrismaClient } from "@prisma/client";
import { getSession } from "@/lib/auth";
import GuruLaporanClient from "./GuruLaporanClient";

const prisma = new PrismaClient();

export default async function GuruLaporanPage() {
  const session = await getSession();
  const userId = session?.user?.id;

  const teacher = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      nama_lengkap: true,
      nip: true
    }
  });

  const settings = await prisma.settings.findUnique({
    where: { id: "global" }
  });

  if (!teacher) return <div>Data tidak ditemukan.</div>;

  return (
    <div className="space-y-12">
      <GuruLaporanClient teacher={teacher} settings={settings} />
    </div>
  );
}
