const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@gmail.com';
  const password = 'admin123';
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const admin = await prisma.user.upsert({
      where: { email: email },
      update: {
        password: hashedPassword,
        nama_lengkap: 'Administrator',
        role: 'ADMIN',
      },
      create: {
        email: email,
        password: hashedPassword,
        nama_lengkap: 'Administrator',
        role: 'ADMIN',
      },
    });
    console.log('Admin user created/updated successfully:');
    console.log(`Email: ${admin.email}`);
    console.log('Password: admin123');
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
