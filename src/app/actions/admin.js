"use server";

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

const prisma = new PrismaClient();

export async function addGuruAction(formData) {
  const email = formData.get("email")?.toString().trim().toLowerCase();
  const password = formData.get("password");
  const nama_lengkap = formData.get("nama_lengkap")?.toString().trim();
  const nip = formData.get("nip")?.toString().trim() || null;
  
  const fieldErrors = {};
  if (!email) fieldErrors.email = "Email wajib diisi.";
  if (!nama_lengkap) fieldErrors.nama_lengkap = "Nama lengkap wajib diisi.";
  if (!password) {
    fieldErrors.password = "Password wajib diisi.";
  } else if (password.length < 6) {
    fieldErrors.password = "Password minimal 6 karakter.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  // Check email & NIP uniqueness
  const checks = [];
  checks.push(prisma.user.findUnique({ where: { email } }));
  if (nip) checks.push(prisma.user.findFirst({ where: { nip } }));

  const [existingEmail, existingNip] = await Promise.all(checks);

  if (existingEmail) fieldErrors.email = "Email sudah digunakan.";
  // Note: if nip was provided, existingNip will be the 2nd result. 
  // If not provided, it won't be in the array if I push conditionally.
  // Let's make it more robust.

  if (existingEmail) fieldErrors.email = "Email sudah digunakan.";
  
  if (nip) {
    // Re-check more simply to avoid index confusion
    const checkNip = await prisma.user.findFirst({ where: { nip } });
    if (checkNip) fieldErrors.nip = "NIP sudah digunakan.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        nama_lengkap,
        nip,
        role: "GURU",
      },
    });
    revalidatePath("/admin/guru");
    return { success: "Guru berhasil ditambahkan." };
  } catch (error) {
    return { error: "Terjadi kesalahan saat menyimpan data." };
  }
}

export async function deleteGuruAction(formData) {
  const id = formData.get("id");
  if (!id) return { error: "ID tidak valid" };

  try {
    // Delete associated attendances first due to foreign key
    await prisma.attendance.deleteMany({
      where: { user_id: id }
    });
    
    await prisma.user.delete({
      where: { id },
    });
    revalidatePath("/admin/guru");
    return { success: "Data guru berhasil dihapus." };
  } catch (error) {
    return { error: "Gagal menghapus data." };
  }
}

export async function updateGuruAction(formData) {
  const id = formData.get("id");
  const email = formData.get("email")?.toString().trim().toLowerCase();
  const nama_lengkap = formData.get("nama_lengkap")?.toString().trim();
  const nip = formData.get("nip")?.toString().trim() || null;

  if (!id) return { error: "ID tidak valid." };

  const fieldErrors = {};
  if (!email) fieldErrors.email = "Email wajib diisi.";
  if (!nama_lengkap) fieldErrors.nama_lengkap = "Nama lengkap wajib diisi.";

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  // Check email & NIP uniqueness (exclude self)
  const [existingEmail, existingNip] = await Promise.all([
    prisma.user.findFirst({ where: { email, NOT: { id } } }),
    nip ? prisma.user.findFirst({ where: { nip, NOT: { id } } }) : Promise.resolve(null)
  ]);

  if (existingEmail) fieldErrors.email = "Email sudah digunakan oleh orang lain.";
  if (existingNip) fieldErrors.nip = "NIP sudah digunakan oleh orang lain.";

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  try {
    await prisma.user.update({
      where: { id },
      data: {
        email,
        nama_lengkap,
        nip,
      },
    });

    revalidatePath("/admin/guru");
    return { success: "Data guru berhasil diperbarui." };
  } catch (error) {
    return { error: "Gagal memperbarui data." };
  }
}

export async function changePasswordAction(formData) {
  const id = formData.get("id");
  const password = formData.get("password");

  if (!id) return { error: "ID tidak valid." };
  if (!password) return { fieldErrors: { password: "Password wajib diisi." } };
  if (password.length < 6) return { fieldErrors: { password: "Password minimal 6 karakter." } };

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    revalidatePath("/admin/guru");
    return { success: "Password berhasil diperbarui." };
  } catch (error) {
    return { error: "Gagal memperbarui password." };
  }
}

import { getSession } from "@/lib/auth";

export async function updateSettingsAction(formData) {
  const latitude = parseFloat(formData.get("latitude"));
  const longitude = parseFloat(formData.get("longitude"));
  const radius = parseInt(formData.get("radius"));
  const adminPassword = formData.get("adminPassword");

  if (isNaN(latitude) || isNaN(longitude) || isNaN(radius)) {
    return { error: "Data koordinat tidak valid." };
  }

  // Verify Admin Password
  const session = await getSession();
  if (!session || session.user.role !== "ADMIN") {
    return { error: "Akses ditolak." };
  }

  if (!adminPassword) {
    return { error: "Konfirmasi password admin diperlukan." };
  }

  const admin = await prisma.user.findUnique({
    where: { id: session.user.id }
  });

  const isValid = await bcrypt.compare(adminPassword, admin.password);
  if (!isValid) {
    return { error: "Password admin salah." };
  }

  try {
    await prisma.settings.upsert({
      where: { id: "global" },
      update: { latitude, longitude, radius },
      create: { id: "global", latitude, longitude, radius },
    });
    revalidatePath("/admin/geofence");
    return { success: "Pengaturan berhasil diperbarui." };
  } catch (error) {
    return { error: "Gagal menyimpan pengaturan." };
  }
}

export async function enrollFaceAction(userId, descriptorArray) {
  if (!userId || !descriptorArray) {
    return { error: "Data tidak lengkap." };
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        face_descriptor: descriptorArray, // Prisma Json field
      },
    });
    revalidatePath("/admin/enrollment");
    return { success: true };
  } catch (error) {
    return { error: "Gagal menyimpan data wajah." };
  }
}
export async function updateAdminProfileAction(formData) {
  const session = await getSession();
  if (!session || session.user.role !== "ADMIN") return { error: "Akses ditolak." };

  const nama_lengkap = formData.get("nama_lengkap")?.toString().trim();
  const email = formData.get("email")?.toString().trim().toLowerCase();

  if (!nama_lengkap || !email) {
    return { error: "Nama dan Email wajib diisi." };
  }

  try {
    // Check if email already exists for another user
    const existingUser = await prisma.user.findFirst({
      where: {
        email,
        NOT: { id: session.user.id }
      }
    });

    if (existingUser) {
      return { error: "Email sudah digunakan oleh akun lain." };
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { nama_lengkap, email }
    });

    revalidatePath("/admin/profile");
    return { success: "Profil berhasil diperbarui." };
  } catch (error) {
    return { error: "Gagal memperbarui profil." };
  }
}

export async function updateAdminPasswordAction(formData) {
  const session = await getSession();
  if (!session || session.user.role !== "ADMIN") return { error: "Akses ditolak." };

  const currentPassword = formData.get("currentPassword")?.toString();
  const newPassword = formData.get("newPassword")?.toString();

  if (!currentPassword || !newPassword) {
    return { error: "Password lama dan baru wajib diisi." };
  }

  if (newPassword.length < 6) {
    return { error: "Password baru minimal 6 karakter." };
  }

  try {
    const admin = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!admin) {
      return { error: "Pengguna tidak ditemukan." };
    }

    const isValid = await bcrypt.compare(currentPassword, admin.password);
    if (!isValid) {
      return { error: "Password lama salah." };
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: session.user.id },
      data: { password: hashedPassword }
    });

    return { success: "Password berhasil diperbarui." };
  } catch (error) {
    console.error("Update Password Error:", error);
    return { error: "Gagal memperbarui password." };
  }
}

export async function deleteFaceAction(userId, adminPassword) {
  const session = await getSession();
  if (!session || session.user.role !== "ADMIN") return { error: "Akses ditolak." };

  if (!adminPassword) return { error: "Password admin diperlukan." };

  try {
    const admin = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    const isValid = await bcrypt.compare(adminPassword, admin.password);
    if (!isValid) return { error: "Password admin salah." };

    await prisma.user.update({
      where: { id: userId },
      data: { face_descriptor: null }
    });

    revalidatePath("/admin/enrollment");
    return { success: "Data wajah berhasil dihapus." };
  } catch (error) {
    console.error("Delete Face Error:", error);
    return { error: "Gagal menghapus data wajah." };
  }
}

export async function updateSystemSettingsAction(prevState, formData) {
  const session = await getSession();
  if (!session || session.user.role !== "ADMIN") return { error: "Akses ditolak." };

  const nama_sistem = formData.get("nama_sistem")?.toString().trim();
  const jam_masuk = formData.get("jam_masuk")?.toString().trim();

  if (!nama_sistem || !jam_masuk) {
    return { error: "Nama Sistem dan Jam Masuk wajib diisi." };
  }

  try {
    await prisma.settings.upsert({
      where: { id: "global" },
      update: { nama_sistem, jam_masuk },
      create: { 
        id: "global", 
        nama_sistem, 
        jam_masuk, 
        latitude: -7.0, // Default fallback
        longitude: 110.0,
        radius: 100
      },
    });
    revalidatePath("/admin/settings");
    revalidatePath("/guru");
    revalidatePath("/login");
    return { success: "Pengaturan sistem berhasil diperbarui." };
  } catch (error) {
    console.error("Update System Settings Error:", error);
    return { error: "Gagal memperbarui pengaturan sistem." };
  }
}

export async function deleteAttendanceAction(ids) {
  const session = await getSession();
  if (!session || session.user.role !== "ADMIN") return { error: "Akses ditolak." };

  if (!ids || ids.length === 0) return { error: "Tidak ada data yang dipilih." };

  try {
    await prisma.attendance.deleteMany({
      where: {
        id: { in: ids }
      }
    });

    revalidatePath("/admin/presensi/bulanan");
    revalidatePath("/admin/presensi/detail");
    return { success: "Data presensi berhasil dihapus." };
  } catch (error) {
    console.error("Delete Attendance Error:", error);
    return { error: "Gagal menghapus data presensi." };
  }
}
