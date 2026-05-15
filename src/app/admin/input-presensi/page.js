import { PrismaClient } from "@prisma/client";
import InputPresensiClient from "./InputPresensiClient";
import { getTeachersForCheckout } from "@/app/actions/attendanceActions";

const prisma = new PrismaClient();

export default async function InputPresensiPage() {
  const teachers = await prisma.user.findMany({
    where: { role: "GURU" },
    orderBy: { nama_lengkap: "asc" },
  });

  const checkoutCandidates = await getTeachersForCheckout();

  return (
    <InputPresensiClient 
      teachers={teachers} 
      initialCheckoutCandidates={checkoutCandidates}
    />
  );
}
