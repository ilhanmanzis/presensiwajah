"use client";

import { Trash2 } from "lucide-react";
import { deleteGuruAction } from "@/app/actions/admin";

export default function DeleteGuruButton({ id }) {
  const handleDelete = async (e) => {
    if (!confirm("Yakin ingin menghapus guru ini? Seluruh data presensi guru tersebut juga akan dihapus.")) {
      e.preventDefault();
      return;
    }
  };

  return (
    <form action={deleteGuruAction} onSubmit={handleDelete}>
      <input type="hidden" name="id" value={id} />
      <button 
        type="submit" 
        className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors" 
        title="Hapus Guru"
      >
        <Trash2 size={18} />
      </button>
    </form>
  );
}
