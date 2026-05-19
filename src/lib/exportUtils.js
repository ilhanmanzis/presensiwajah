import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { formatWIB } from "@/lib/dateUtils";

/**
 * Export Individual Attendance Report to PDF
 */
export const exportIndividualPDF = (teacher, month, year, data, settings) => {
  try {
    const doc = new jsPDF();
    const monthName = formatWIB(new Date(year, month - 1, 1), "MMMM");
    const namaSekolah = settings?.nama_sistem || "Sistem Presensi";

    // 1. Kop Surat
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("LAPORAN PRESENSI GURU", 105, 15, { align: "center" });

    doc.setFontSize(12);
    doc.text(namaSekolah, 105, 22, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text("Laporan Harian Kehadiran Guru", 105, 27, { align: "center" });

    doc.setLineWidth(0.5);
    doc.line(15, 32, 195, 32);

    // 2. Metadata
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.text("Informasi Guru:", 15, 42);
    
    doc.setFont("helvetica", "normal");
    const labelX = 15;
    const colonX = 35;
    const valueX = 38;
    
    doc.text("Nama", labelX, 48);
    doc.text(":", colonX, 48);
    doc.text(teacher.nama_lengkap, valueX, 48);
    
    doc.text("NIP", labelX, 53);
    doc.text(":", colonX, 53);
    doc.text(teacher.nip || "-", valueX, 53);
    
    doc.text("Periode", labelX, 58);
    doc.text(":", colonX, 58);
    doc.text(`${monthName} ${year}`, valueX, 58);

    // 3. Table
    const tableColumn = ["No", "Tanggal", "Masuk", "Ket Masuk", "Pulang", "Ket Pulang"];
    const tableRows = [];

    let totalHadir = 0;
    let totalSakit = 0;
    let totalIzin = 0;

    data.forEach((row, index) => {
      if (row.status === "Hadir") totalHadir++;
      if (row.status === "Sakit") totalSakit++;
      if (row.status === "Izin") totalIzin++;

      if (row.status === "Sakit" || row.status === "Izin") {
        const reason = row.keterangan ? `\n(${row.keterangan})` : "";
        tableRows.push([
          index + 1,
          row.dateStr,
          { 
            content: `${row.status.toUpperCase()}${reason}`, 
            colSpan: 4, 
            styles: { halign: "center", fontStyle: "bold", fillColor: row.status === "Sakit" ? [254, 240, 138] : [191, 219, 254] } 
          }
        ]);
      } else {
        const ketMasukItems = [];
        if (row.masuk?.keterangan) ketMasukItems.push(`- ${row.masuk.keterangan}`);
        if (row.masuk?.catatan) ketMasukItems.push(`- ${row.masuk.catatan}`);
        
        tableRows.push([
          index + 1,
          row.dateStr,
          row.masuk ? formatWIB(row.masuk.waktu, "HH:mm") : "-",
          ketMasukItems.length > 0 ? ketMasukItems.join("\n") : "-",
          row.pulang ? formatWIB(row.pulang.waktu, "HH:mm") : "-",
          row.pulang?.catatan ? `- ${row.pulang.catatan}` : "-"
        ]);
      }
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 65,
      theme: "grid",
      headStyles: { fillColor: [30, 41, 59], halign: "center", textColor: [255, 255, 255] },
      styles: { fontSize: 8, cellPadding: 3 },
      columnStyles: {
        0: { halign: "center", cellWidth: 10 },
        1: { halign: "center", cellWidth: 30 },
        2: { halign: "center" },
        3: { halign: "left" },
        4: { halign: "center" },
        5: { halign: "left" },
      }
    });

    // 4. Summary Table (Footer)
    const finalY = (doc.lastAutoTable ? doc.lastAutoTable.finalY : 70) + 15;
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Ringkasan Kehadiran", 15, finalY);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const sumLabelX = 15;
    const sumColonX = 40;
    const sumValueX = 43;

    doc.text("Total Hadir", sumLabelX, finalY + 7);
    doc.text(":", sumColonX, finalY + 7);
    doc.text(`${totalHadir} Hari`, sumValueX, finalY + 7);

    doc.text("Total Sakit", sumLabelX, finalY + 13);
    doc.text(":", sumColonX, finalY + 13);
    doc.text(`${totalSakit} Hari`, sumValueX, finalY + 13);

    doc.text("Total Izin", sumLabelX, finalY + 19);
    doc.text(":", sumColonX, finalY + 19);
    doc.text(`${totalIzin} Hari`, sumValueX, finalY + 19);

    // 5. Download
    doc.save(`Laporan-Presensi_${teacher.nama_lengkap.replace(/\s+/g, "-")}_${monthName}-${year}.pdf`);
  } catch (err) {
    console.error("PDF Export Error:", err);
    throw new Error("Gagal membuat PDF. Silakan coba lagi.");
  }
};

/**
 * Export Individual Attendance Report to Excel
 */
export const exportIndividualExcel = async (teacher, month, year, data, settings) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Laporan Presensi");
  const monthName = formatWIB(new Date(year, month - 1, 1), "MMMM");
  const namaSekolah = settings?.nama_sistem || "Sistem Presensi";

  // Header & Styling
  worksheet.mergeCells("A1:F1");
  worksheet.getCell("A1").value = "LAPORAN PRESENSI GURU";
  worksheet.getCell("A1").font = { bold: true, size: 14 };
  worksheet.getCell("A1").alignment = { horizontal: "center" };

  worksheet.mergeCells("A2:F2");
  worksheet.getCell("A2").value = namaSekolah;
  worksheet.getCell("A2").font = { bold: true, size: 12 };
  worksheet.getCell("A2").alignment = { horizontal: "center" };

  worksheet.addRow([]); // Blank row

  worksheet.addRow(["Nama", teacher.nama_lengkap]);
  worksheet.addRow(["NIP", teacher.nip || "-"]);
  worksheet.addRow(["Periode", `${monthName} ${year}`]);

  worksheet.addRow([]); // Blank row

  // Table Head
  const headerRow = worksheet.addRow(["No", "Tanggal", "Masuk", "Ket Masuk", "Pulang", "Ket Pulang"]);
  headerRow.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E293B" } };
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.alignment = { horizontal: "center" };
    cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
  });

  let totalHadir = 0, totalSakit = 0, totalIzin = 0;

  data.forEach((row, index) => {
    if (row.status === "Hadir") totalHadir++;
    if (row.status === "Sakit") totalSakit++;
    if (row.status === "Izin") totalIzin++;

    if (row.status === "Sakit" || row.status === "Izin") {
      const reason = row.keterangan ? ` (${row.keterangan})` : "";
      const newRow = worksheet.addRow([index + 1, row.dateStr, row.status.toUpperCase() + reason, "", "", ""]);
      worksheet.mergeCells(`C${newRow.number}:F${newRow.number}`);
      const cell = worksheet.getCell(`C${newRow.number}`);
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: row.status === "Sakit" ? "FFFEF08A" : "FFBFDBFE" } };
      cell.font = { bold: true };
      cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    } else {
      const ketMasukItems = [];
      if (row.masuk?.keterangan) ketMasukItems.push(`- ${row.masuk.keterangan}`);
      if (row.masuk?.catatan) ketMasukItems.push(`- ${row.masuk.catatan}`);

      const newRow = worksheet.addRow([
        index + 1,
        row.dateStr,
        row.masuk ? formatWIB(row.masuk.waktu, "HH:mm") : "-",
        ketMasukItems.length > 0 ? ketMasukItems.join("\n") : "-",
        row.pulang ? formatWIB(row.pulang.waktu, "HH:mm") : "-",
        row.pulang?.catatan ? `- ${row.pulang.catatan}` : "-"
      ]);
      
      // Enable wrap text and left alignment for the description columns
      newRow.getCell(4).alignment = { wrapText: true, vertical: "middle", horizontal: "left" };
      newRow.getCell(6).alignment = { wrapText: true, vertical: "middle", horizontal: "left" };
    }
  });

  // Table Borders & Alignment
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber >= 8) {
      row.eachCell((cell) => {
        cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
        // Global vertical middle, horizontal as per current state (center or left)
        const currentAlign = cell.alignment || {};
        cell.alignment = { ...currentAlign, vertical: "middle" };
        if (!cell.alignment.horizontal && rowNumber >= 9) cell.alignment.horizontal = "center";
      });
    }
  });

  worksheet.addRow([]);
  worksheet.addRow(["RINGKASAN"]);
  worksheet.addRow(["Total Hadir", totalHadir + " Hari"]);
  worksheet.addRow(["Total Sakit", totalSakit + " Hari"]);
  worksheet.addRow(["Total Izin", totalIzin + " Hari"]);

  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buffer]), `Laporan-Presensi_${teacher.nama_lengkap.replace(/\s+/g, "-")}_${monthName}-${year}.xlsx`);
};

/**
 * Export Summary (Rekap) Report to PDF
 */
export const exportRekapPDF = (month, year, data, settings) => {
  try {
    const doc = new jsPDF();
    const monthName = formatWIB(new Date(year, month - 1, 1), "MMMM");
    const namaSekolah = settings?.nama_sistem || "Sistem Presensi";

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("REKAPITULASI PRESENSI GURU", 105, 15, { align: "center" });

    doc.setFontSize(12);
    doc.text(namaSekolah, 105, 22, { align: "center" });

    doc.setLineWidth(0.5);
    doc.line(15, 28, 195, 28);

    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
    const labelX = 15;
    const colonX = 35;
    const valueX = 38;

    doc.text("Periode", labelX, 38);
    doc.text(":", colonX, 38);
    doc.text(`${monthName} ${year}`, valueX, 38);

    doc.text("Total Guru", labelX, 43);
    doc.text(":", colonX, 43);
    doc.text(`${data.length} Orang`, valueX, 43);

    const tableColumn = ["No", "NIP", "Nama Lengkap", "Hadir", "Sakit", "Izin"];
    const tableRows = data.map((row, index) => [
      index + 1,
      row.nip || "-",
      row.nama_lengkap,
      row.hadir,
      row.sakit,
      row.izin
    ]);

    doc.setTextColor(0, 0, 0);
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 50,
      theme: "grid",
      headStyles: { fillColor: [30, 41, 59], halign: "center", textColor: [255, 255, 255] },
      styles: { fontSize: 9, cellPadding: 4, textColor: [0, 0, 0] },
      columnStyles: {
        0: { halign: "center", cellWidth: 12 },
        1: { halign: "center", cellWidth: 35 },
        2: { halign: "left" },
        3: { halign: "center", cellWidth: 20 },
        4: { halign: "center", cellWidth: 20 },
        5: { halign: "center", cellWidth: 20 },
      }
    });

    doc.save(`Rekap-Presensi-Guru_${monthName}-${year}.pdf`);
  } catch (err) {
    console.error("Rekap PDF Error:", err);
    throw new Error("Gagal membuat Rekap PDF.");
  }
};

/**
 * Export Summary (Rekap) Report to Excel
 */
export const exportRekapExcel = async (month, year, data, settings) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Rekapitulasi Presensi");
  const monthName = formatWIB(new Date(year, month - 1, 1), "MMMM");
  const namaSekolah = settings?.nama_sistem || "Sistem Presensi";

  worksheet.mergeCells("A1:F1");
  worksheet.getCell("A1").value = "REKAPITULASI PRESENSI GURU";
  worksheet.getCell("A1").font = { bold: true, size: 14 };
  worksheet.getCell("A1").alignment = { horizontal: "center" };

  worksheet.mergeCells("A2:F2");
  worksheet.getCell("A2").value = namaSekolah;
  worksheet.getCell("A2").font = { bold: true, size: 12 };
  worksheet.getCell("A2").alignment = { horizontal: "center" };

  worksheet.addRow([]);
  worksheet.addRow(["Periode", `${monthName} ${year}`]);
  worksheet.addRow(["Total Guru", data.length + " Orang"]);
  worksheet.addRow([]);

  const headerRow = worksheet.addRow(["No", "NIP", "Nama Lengkap", "Hadir", "Sakit", "Izin"]);
  headerRow.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEEEEEE" } };
    cell.font = { bold: true };
    cell.alignment = { horizontal: "center" };
    cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
  });

  data.forEach((row, index) => {
    worksheet.addRow([
      index + 1,
      row.nip || "-",
      row.nama_lengkap,
      row.hadir,
      row.sakit,
      row.izin
    ]);
  });

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber >= 7) {
      row.eachCell((cell) => {
        cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
        cell.alignment = { vertical: "middle", horizontal: cell.address.includes('C') ? "left" : "center" };
      });
    }
  });

  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buffer]), `Rekap-Presensi-Guru_${monthName}-${year}.xlsx`);
};
