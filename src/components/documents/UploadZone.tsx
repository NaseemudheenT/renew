"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { UploadCloud, FileText, CheckCircle2, AlertCircle, X } from "lucide-react";
import { Select } from "@/components/ui/Select";
import { toast } from "@/components/ui/toast-store";
import { uploadAndSaveDocument } from "@/lib/firestore/documents";
import { CATEGORIES } from "@/lib/categories";
import { formatBytes, cn } from "@/lib/utils";
import type { Category } from "@/lib/types";

const MAX_BYTES = 15 * 1024 * 1024;

interface QueueItem { id: string; name: string; size: number; pct: number; status: "uploading" | "done" | "error" }

export function UploadZone({ uid }: { uid: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [category, setCategory] = useState<Category>("documents");
  const [queue, setQueue] = useState<QueueItem[]>([]);

  function patch(id: string, p: Partial<QueueItem>) {
    setQueue((q) => q.map((it) => (it.id === id ? { ...it, ...p } : it)));
  }
  async function handleFiles(files: FileList | File[]) {
    for (const file of Array.from(files)) {
      if (file.size > MAX_BYTES) {
        toast({ title: "File too large", description: `${file.name} exceeds 15 MB.`, variant: "error" });
        continue;
      }
      const id = Math.random().toString(36).slice(2);
      setQueue((q) => [...q, { id, name: file.name, size: file.size, pct: 0, status: "uploading" }]);
      try {
        await uploadAndSaveDocument(uid, file, { category }, (pct) => patch(id, { pct }));
        patch(id, { pct: 100, status: "done" });
        setTimeout(() => setQueue((q) => q.filter((it) => it.id !== id)), 1400);
      } catch (err) {
        patch(id, { status: "error" });
        toast({ title: "Upload failed", description: err instanceof Error ? err.message : undefined, variant: "error" });
      }
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="sm:w-56">
        <Select label="Upload as" value={category} onChange={(e) => setCategory(e.target.value as Category)} options={CATEGORIES.map((c) => ({ value: c.id, label: c.label }))} />
      </div>
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files); }}
        className={cn("glass flex cursor-pointer flex-col items-center justify-center gap-2 border-2 border-dashed p-8 text-center transition-all", dragging ? "border-[var(--focus-ring)] bg-[var(--glass-bg-strong)] scale-[1.01]" : "border-[var(--field-border)] hover:border-[var(--focus-ring)]/60")}
      >
        <motion.span animate={dragging ? { y: -4 } : { y: 0 }} className="glass grid size-14 place-items-center !rounded-full"><UploadCloud className="size-6 text-[var(--color-gold-500)]" /></motion.span>
        <p className="text-strong text-sm font-medium">{dragging ? "Drop to upload" : "Drag files here, or click to browse"}</p>
        <p className="text-muted text-xs">PDFs, images and documents up to 15 MB</p>
        <input ref={inputRef} type="file" multiple className="hidden" onChange={(e) => { if (e.target.files?.length) handleFiles(e.target.files); e.target.value = ""; }} />
      </div>
      <AnimatePresence>
        {queue.map((it) => (
          <motion.div key={it.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98 }} className="glass flex items-center gap-3 p-3">
            <FileText className="size-5 shrink-0 text-[var(--color-gold-500)]" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2"><span className="text-body truncate text-sm">{it.name}</span><span className="text-muted shrink-0 text-xs">{formatBytes(it.size)}</span></div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[var(--glass-bg-soft)]">
                <motion.div className={cn("h-full rounded-full", it.status === "error" ? "bg-rose-400" : "bg-gradient-to-r from-gold-300 to-gold-500")} initial={false} animate={{ width: `${it.pct}%` }} transition={{ ease: "easeOut" }} />
              </div>
            </div>
            {it.status === "done" ? <CheckCircle2 className="size-5 shrink-0 text-emerald-500" /> : it.status === "error" ? <AlertCircle className="size-5 shrink-0 text-rose-500" /> : (
              <button type="button" onClick={() => setQueue((q) => q.filter((x) => x.id !== it.id))} aria-label="Dismiss" className="shrink-0 text-[var(--text-muted)] hover:text-[var(--text-strong)]"><X className="size-4" /></button>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
