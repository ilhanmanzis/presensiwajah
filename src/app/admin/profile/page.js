import { getSession } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import { redirect } from "next/navigation";
import ProfileClient from "./ProfileClient";

const prisma = new PrismaClient();

export default async function AdminProfilePage() {
  const session = await getSession();
  
  if (!session || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  const admin = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      nama_lengkap: true,
      email: true,
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-foreground">Profil Admin</h1>
      </div>
      <ProfileClient admin={admin} />
    </div>
  );
}
