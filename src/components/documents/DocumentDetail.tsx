"use client";

import { useState } from "react";
import Image from "next/image";
import { ExternalLink, Download, Trash2, FileText, Save } from "lucide-react";
import { AnimatedModal, AnimatedButton } from "@/components/motion";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { toast } from "@/components/ui/toast-store";
import { CATEGORIES } from "@/lib/categories";
import { updateDocument, deleteDocument } from "@/lib/firestore/documents";
import { toDateInput, fromDateTimeInputs } from "@/lib/dates";
import { formatBytes, isImageFormat } from "@/lib/utils";
import type { DocItem, Category } from "@/lib/types";

export function DocumentDetail({ uid, doc, open, onClose }: { uid: string; doc: DocItem | null; open: boolean; onClose: () => void }) {
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<Category>("documents");
  const [hasExpiry, setHasExpiry] = useState(false);
  const [expiry, setExpiry] = useState("");
  const [notes, setNotes] = useState("");
  const [initialised, setInitialised] = useState<string | null>(null);

  if (doc && initialised !== doc.id) {
    setInitialised(doc.id);
    setName(doc.name);
    setCategory(doc.category);
    setHasExpiry(doc.expiresAt != null);
    setExpiry(toDateInput(doc.expiresAt ?? doc.createdAt));
    setNotes(doc.notes ?? "");
  }
  if (!doc) return null;
  const isImage = isImageFormat(doc.format);

  async function onSave() {
    if (!doc) return;
    setSaving(true);
    try {
      await updateDocument(uid, doc.id, { name: name.trim() || doc.name, category, notes: notes.trim(), expiresAt: hasExpiry ? fromDateTimeInputs(expiry) : null });
      toast({ title: "Document updated", variant: "success" });
      onClose();
    } catch {
      toast({ title: "Couldn't save changes", variant: "error" });
    } finally {
      setSaving(false);
    }
  }
  async function onDelete() {
    if (!doc) return;
    setDeleting(true);
    try {
      await deleteDocument(doc.id);
      toast({ title: "Document deleted" });
      onClose();
    } catch (err) {
      toast({ title: "Couldn't delete", description: err instanceof Error ? err.message : undefined, variant: "error" });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AnimatedModal open={open} onClose={onClose} title="Document">
      <div className="flex flex-col gap-4">
        <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-[var(--glass-bg-soft)]">
          {isImage ? (
            <Image src={doc.url} alt={doc.name} fill sizes="(max-width: 640px) 90vw, 32rem" className="object-contain" />
          ) : (
            <div className="grid h-full place-items-center gap-2"><FileText className="size-14 text-[var(--color-gold-500)]/70" /><span className="text-muted text-xs uppercase">{doc.format} · {formatBytes(doc.bytes)}</span></div>
          )}
        </div>
        <div className="flex gap-2">
          <a href={doc.url} target="_blank" rel="noopener noreferrer" className="flex-1"><AnimatedButton variant="glass" fullWidth type="button"><ExternalLink className="size-4" />Open</AnimatedButton></a>
          <a href={doc.url} download className="flex-1"><AnimatedButton variant="glass" fullWidth type="button"><Download className="size-4" />Download</AnimatedButton></a>
        </div>
        <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <div className="grid grid-cols-2 gap-3">
          <Select label="Category" value={category} onChange={(e) => setCategory(e.target.value as Category)} options={CATEGORIES.map((c) => ({ value: c.id, label: c.label }))} />
          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--text-body)]">Expiry</label>
            {hasExpiry ? (
              <Input type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)} />
            ) : (
              <button type="button" onClick={() => setHasExpiry(true)} className="h-12 w-full rounded-2xl border border-[var(--field-border)] bg-[var(--field-bg)] text-sm text-[var(--text-muted)] transition-colors hover:text-[var(--text-strong)]">Add expiry</button>
            )}
          </div>
        </div>
        {hasExpiry && <button type="button" onClick={() => setHasExpiry(false)} className="-mt-2 self-start text-xs text-[var(--text-muted)] hover:text-[var(--text-strong)]">Remove expiry</button>}
        <Textarea label="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
        <div className="mt-1 flex items-center justify-between gap-3">
          <AnimatedButton variant="danger" type="button" onClick={onDelete} loading={deleting}><Trash2 className="size-4" />Delete</AnimatedButton>
          <AnimatedButton type="button" onClick={onSave} loading={saving}><Save className="size-4" />Save</AnimatedButton>
        </div>
      </div>
    </AnimatedModal>
  );
}
