import { format } from "date-fns";
import { id } from "date-fns/locale";

/**
 * Mendapatkan komponen tanggal & waktu dalam zona Asia/Jakarta
 */
export function getJakartaParts(date = new Date()) {
  const d = new Date(date);
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  });
  
  const parts = formatter.formatToParts(d);
  const getValue = (type) => parts.find(p => p.type === type).value;
  
  return {
    year: parseInt(getValue("year"), 10),
    month: parseInt(getValue("month"), 10),
    day: parseInt(getValue("day"), 10),
    hour: parseInt(getValue("hour"), 10),
    minute: parseInt(getValue("minute"), 10),
    second: parseInt(getValue("second"), 10)
  };
}

/**
 * Membuat objek Date lokal yang komponen waktunya dicocokkan dengan zona Asia/Jakarta.
 * Bermanfaat agar formatting standard date-fns / JS Date mengabaikan timezone server/client.
 */
export function getJakartaDate(date = new Date()) {
  const { year, month, day, hour, minute, second } = getJakartaParts(date);
  return new Date(year, month - 1, day, hour, minute, second);
}

/**
 * Format date ke format string tertentu menggunakan zona Asia/Jakarta (WIB)
 */
export function formatWIB(date, formatStr, options = { locale: id }) {
  if (!date) return "";
  const jakartaDate = getJakartaDate(date);
  return format(jakartaDate, formatStr, options);
}

/**
 * Mengonversi input tanggal dan jam lokal WIB (Asia/Jakarta) menjadi objek Date UTC asli
 * yang siap disimpan ke database (mengurangi 7 jam karena WIB = UTC+7)
 */
export function toUTCfromWIB(tanggalStr, jamStr) {
  const d = new Date(`${tanggalStr}T${jamStr || "00:00"}:00.000Z`);
  d.setUTCHours(d.getUTCHours() - 7);
  return d;
}
