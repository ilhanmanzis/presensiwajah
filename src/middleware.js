import { NextResponse } from "next/server";
import { decrypt } from "@/lib/auth";

export async function middleware(request) {
  const sessionCookie = request.cookies.get("session")?.value;
  const parsedSession = sessionCookie ? await decrypt(sessionCookie) : null;

  const isAuthPage = request.nextUrl.pathname.startsWith("/login");
  const isAdminPage = request.nextUrl.pathname.startsWith("/admin");
  const isGuruPage = request.nextUrl.pathname.startsWith("/guru");

  // Jika tidak ada session dan mencoba akses halaman terproteksi
  if (!parsedSession && (isAdminPage || isGuruPage)) {
    return NextResponse.redirect(new URL("/login", request.nextUrl));
  }

  if (parsedSession) {
    const { role } = parsedSession.user;

    // Jika sudah login mencoba ke halaman auth, redirect sesuai role
    if (isAuthPage || request.nextUrl.pathname === "/") {
      if (role === "ADMIN") {
        return NextResponse.redirect(new URL("/admin", request.nextUrl));
      } else {
        return NextResponse.redirect(new URL("/guru", request.nextUrl));
      }
    }

    // Role-based routing protection
    if (isAdminPage && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/guru", request.nextUrl));
    }

    if (isGuruPage && role !== "GURU") {
      return NextResponse.redirect(new URL("/admin", request.nextUrl));
    }
  } else if (request.nextUrl.pathname === "/") {
    // Arahkan root ke login jika belum login
    return NextResponse.redirect(new URL("/login", request.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|models|.*\\.png|.*\\.jpg|.*\\.jpeg).*)"],
};
