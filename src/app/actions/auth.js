"use server";

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { createSession, deleteSession } from "@/lib/auth";
import { redirect } from "next/navigation";

const prisma = new PrismaClient();

export async function loginAction(prevState, formData) {
  const email = formData.get("email")?.toString().toLowerCase();
  const password = formData.get("password");

  if (!email || !password) {
    return { error: "Email dan Password wajib diisi." };
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return { error: "Email atau password salah." };
  }

  const isValidPassword = await bcrypt.compare(password, user.password);

  if (!isValidPassword) {
    return { error: "Email atau password salah." };
  }

  // Create JWT session payload
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    nama_lengkap: user.nama_lengkap,
  };

  await createSession(payload);

  // Return success to client, then client will redirect (or server can redirect)
  return { success: true, role: user.role };
}

export async function logoutAction() {
  await deleteSession();
  redirect("/login");
}
