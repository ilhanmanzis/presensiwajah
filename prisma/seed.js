const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const adminEmail = "admin@gmail.com";
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash("admin", 10);
    await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        nama_lengkap: "Administrator",
        role: "ADMIN",
      },
    });
    console.log("Admin account created: admin@gmail.com / admin");
  } else {
    console.log("Admin account already exists.");
  }

  // Create default settings if not exist
  const existingSettings = await prisma.settings.findUnique({
    where: { id: "global" },
  });

  if (!existingSettings) {
    await prisma.settings.create({
      data: {
        id: "global",
        latitude: -6.200000, // Default Jakarta, adjust as needed
        longitude: 106.816666,
        radius: 100, // 100 meters
      },
    });
    console.log("Default settings created.");
  } else {
    console.log("Settings already exist.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
