import { PrismaClient } from "@prisma/client";
import EnrollmentClient from "./EnrollmentClient";

const prisma = new PrismaClient();

export default async function EnrollmentServerPage() {
  const users = await prisma.user.findMany({
    where: { role: "GURU" },
    select: {
      id: true,
      nama_lengkap: true,
      nip: true,
      face_descriptor: true,
    },
    orderBy: { nama_lengkap: "asc" },
  });

  return <EnrollmentClient users={users} />;
}
