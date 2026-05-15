import { PrismaClient } from "@prisma/client";
import AdminSidebarClient from "./AdminSidebarClient";
import Breadcrumbs from "@/components/Breadcrumbs";

const prisma = new PrismaClient();

export default async function AdminLayout({ children }) {
  const settings = await prisma.settings.findUnique({
    where: { id: "global" }
  });

  const namaSistem = settings?.nama_sistem || "Presensi Admin";

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-background transition-colors duration-300">
      <AdminSidebarClient namaSistem={namaSistem} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto">
            <div className="hidden md:block">
              <Breadcrumbs />
            </div>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
