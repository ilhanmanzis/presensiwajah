import { PrismaClient } from "@prisma/client";
import GuruTableClient from "./GuruTableClient";

const prisma = new PrismaClient();

export default async function DataGuruPage({ searchParams }) {
  const params = await searchParams;
  const search = params.search || "";
  const page = parseInt(params.page) || 1;
  const limit = 10;
  const skip = (page - 1) * limit;

  // Build query
  const where = {
    role: "GURU",
    ...(search && {
      OR: [
        { nama_lengkap: { contains: search, mode: 'insensitive' } },
        { nip: { contains: search, mode: 'insensitive' } },
      ],
    }),
  };

  // Fetch data
  const [gurus, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { nama_lengkap: "asc" },
    }),
    prisma.user.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <GuruTableClient
      gurus={gurus}
      total={total}
      page={page}
      totalPages={totalPages}
      search={search}
    />
  );
}
