import { PrismaClient } from "@prisma/client";
import MapWrapper from "./MapWrapper";

const prisma = new PrismaClient();

export default async function GeofencePage() {
  const settings = await prisma.settings.findUnique({
    where: { id: "global" }
  });

  return (
    <div className="space-y-6">
      <MapWrapper initialSettings={settings} />
    </div>
  );
}
