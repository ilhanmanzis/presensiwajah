-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'GURU');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "nama_lengkap" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'GURU',
    "nip" TEXT,
    "nuptk" TEXT,
    "nik" TEXT,
    "gelar_depan" TEXT,
    "gelar_belakang" TEXT,
    "status_pegawai" TEXT,
    "pangkat_golongan" TEXT,
    "tempat_lahir" TEXT,
    "tanggal_lahir" TIMESTAMP(3),
    "jenis_kelamin" TEXT,
    "agama" TEXT,
    "alamat_lengkap" TEXT,
    "no_hp" TEXT,
    "face_descriptor" JSONB,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attendance" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "tanggal" TIMESTAMP(3) NOT NULL,
    "jam_masuk" TIMESTAMP(3),
    "lat_masuk" DOUBLE PRECISION,
    "lng_masuk" DOUBLE PRECISION,
    "dist_masuk" DOUBLE PRECISION,
    "catatan_masuk" TEXT,
    "ket_masuk" TEXT,
    "jam_pulang" TIMESTAMP(3),
    "lat_pulang" DOUBLE PRECISION,
    "lng_pulang" DOUBLE PRECISION,
    "dist_pulang" DOUBLE PRECISION,
    "catatan_pulang" TEXT,
    "status" TEXT NOT NULL,
    "keterangan" TEXT,
    "tipe_input" TEXT NOT NULL DEFAULT 'Wajah',

    CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Settings" (
    "id" TEXT NOT NULL DEFAULT 'global',
    "nama_sistem" TEXT NOT NULL DEFAULT 'Sistem Presensi',
    "jam_masuk" TEXT NOT NULL DEFAULT '07:00',
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "radius" INTEGER NOT NULL,

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Attendance_user_id_tanggal_key" ON "Attendance"("user_id", "tanggal");

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
