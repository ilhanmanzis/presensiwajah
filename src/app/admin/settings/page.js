import { PrismaClient } from "@prisma/client";
import SettingsClient from "./SettingsClient";

const prisma = new PrismaClient();

export default async function AdminSettingsPage() {
  const settings = await prisma.settings.findUnique({
    where: { id: "global" }
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Pengaturan Sistem</h1>
          <p className="text-nav-text font-medium mt-1">Sesuaikan identitas dan parameter operasional aplikasi.</p>
        </div>
      </div>

      <SettingsClient initialSettings={settings} />
    </div>
  );
}
