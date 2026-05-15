import { PrismaClient } from "@prisma/client";
import LoginForm from "./LoginForm";

const prisma = new PrismaClient();

export default async function LoginPage() {
  const settings = await prisma.settings.findUnique({
    where: { id: "global" }
  });

  const namaSistem = settings?.nama_sistem || "Sistem Presensi";

  return <LoginForm namaSistem={namaSistem} />;
}
