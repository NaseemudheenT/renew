"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, FileText, ArrowRight, Info, Camera, ImageUp, ScanLine } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { Select } from "@/components/ui/Select";
import { AnimatedButton } from "@/components/motion";
import { toast } from "@/components/ui/toast-store";
import { useScopedUserCollection } from "@/hooks/useScopedUserCollection";
import { useLocale } from "@/components/providers/LocaleProvider";
import { parseCSV, parseStatement, parseReceipt, detectMapping, buildDrafts, type DraftRow, type ColumnMapping } from "@/lib/import";
import { getOcrEngine } from "@/lib/ocr";
import { extractPdfText } from "@/lib/pdf";
import { importTransactions, type TransactionInput } from "@/lib/firestore/transactions";
import { categoriesFor } from "@/lib/finance";
import { toDateInput } from "@/lib/dates";
import type { Transaction, TxType } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ImportView() {
  const router = useRouter();
  const { prefs, money } = useLocale();
  const { data: existing, uid } = useScopedUserCollection<Transaction>("transactions");
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const photoRef = useRef<HTMLInputElement>(null);

  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping | null>(null);
  const [drafts, setDrafts] = useState<DraftRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [parsing, setParsing] = useState(false);
  const [scanPct, setScanPct] = useState<number | null>(null);
  const [importing, setImporting] = useState(false);

  const included = useMemo(() => drafts.filter((d) => d.include), [drafts]);
  const dupCount = useMemo(() => drafts.filter((d) => d.duplicate).length, [drafts]);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setFileName(file.name);
    setParsing(true);
    try {
      const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
      let parsed: Record<string, string>[];
      if (isPdf) {
        const text = await extractPdfText(file);
        parsed = parseStatement(text);
      } else {
        parsed = parseCSV(await file.text());
      }
      if (parsed.length === 0) {
        toast({ title: isPdf ? "Couldn't find transactions in that PDF" : "Couldn't read any rows from that file", description: isPdf ? "It may be a scanned image — try the CSV export instead." : undefined, variant: "error" });
        return;
      }
      const hdrs = Object.keys(parsed[0]!);
      const map = detectMapping(hdrs);
      setHeaders(hdrs);
      setRows(parsed);
      setMapping(map);
      setDrafts(buildDrafts(parsed, map, existing, prefs.currency));
    } catch {
      toast({ title: "That file couldn't be read", variant: "error" });
    } finally {
      setParsing(false);
    }
  }

  async function onImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setFileName(file.name || "Photo");
    setScanPct(0);
    setParsing(true);
    try {
      const text = await getOcrEngine().recognize(file, (p) => setScanPct(Math.round(p * 100)));
      // A receipt/bill first (one total); if that finds nothing, try reading it
      // as a photographed statement (many rows). Both go through review.
      let parsed = parseReceipt(text);
      if (parsed.length === 0) parsed = parseStatement(text);
      if (parsed.length === 0) {
        toast({ title: "Couldn't read an amount from that photo", description: "Try a clearer, well-lit shot of the whole receipt.", variant: "error" });
        return;
      }
      const hdrs = Object.keys(parsed[0]!);
      const map = detectMapping(hdrs);
      setHeaders(hdrs);
      setRows(parsed);
      setMapping(map);
      setDrafts(buildDrafts(parsed, map, existing, prefs.currency));
    } catch {
      toast({ title: "That photo couldn't be scanned", variant: "error" });
    } finally {
      setParsing(false);
      setScanPct(null);
    }
  }

  function remap(patch: Partial<ColumnMapping>) {
    if (!mapping) return;
    const next = { ...mapping, ...patch };
    setMapping(next);
    setDrafts(buildDrafts(rows, next, existing, prefs.currency));
  }

  function editDraft(id: string, patch: Partial<DraftRow>) {
    setDrafts((ds) => ds.map((d) => (d.id === id ? { ...d, ...patch } : d)));
  }

  async function doImport() {
    if (!uid || included.length === 0) return;
    setImporting(true);
    try {
      const inputs: TransactionInput[] = included.map((d) => ({
        type: d.type,
        amount: d.amount,
        currency: d.currency,
        category: d.category,
        note: d.note || undefined,
        date: d.date,
      }));
      const count = await importTransactions(uid, inputs);
      toast({ title: `Imported ${count} transaction${count === 1 ? "" : "s"}`, variant: "success" });
      router.push("/transactions");
    } catch {
      toast({ title: "Import failed — please try again", variant: "error" });
    } finally {
      setImporting(false);
    }
  }

  const colOptions = [{ value: "", label: "—" }, ...headers.map((h) => ({ value: h, label: h }))];

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Add money in seconds" subtitle="Snap a receipt, or drop in a statement — Renew reads it and lines up every transaction for you to confirm. Only real data, always." />

      {drafts.length === 0 ? (
        parsing ? (
          <GlassCard padded>
            <div className="flex flex-col items-center gap-4 px-6 py-10 text-center">
              <span className="relative grid size-16 place-items-center rounded-3xl bg-[var(--glass-bg-strong)]">
                <ScanLine className="size-7 text-[var(--color-gold-500)]" />
                <span className="absolute inset-0 animate-ping rounded-3xl border border-[var(--color-gold-500)]/40" />
              </span>
              <span className="text-strong text-sm font-medium">{scanPct === null ? "Reading your file…" : "Reading your receipt…"}</span>
              {scanPct !== null && (
                <div className="w-full max-w-xs">
                  <div className="h-1.5 overflow-hidden rounded-full bg-[var(--field-bg)]">
                    <div className="h-full rounded-full bg-[var(--color-gold-500)] transition-all duration-300" style={{ width: `${Math.max(6, scanPct)}%` }} />
                  </div>
                  <span className="text-muted mt-2 block text-xs tabular-nums">{scanPct}% · on your device, privately</span>
                </div>
              )}
            </div>
          </GlassCard>
        ) : (
        <div className="flex flex-col gap-3">
          {/* Hero path — scan a receipt or bill with the camera/photo (on-device OCR). */}
          <GlassCard padded>
            <div className="flex items-center gap-2 text-sm">
              <span className="grid size-9 place-items-center rounded-xl bg-[var(--glass-bg-strong)]"><Camera className="size-4.5 text-[var(--color-gold-500)]" /></span>
              <div>
                <p className="text-strong font-medium">Scan a receipt or bill</p>
                <p className="text-muted text-xs">Point your camera or pick a photo — Renew reads the total.</p>
              </div>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <AnimatedButton size="lg" fullWidth onClick={() => cameraRef.current?.click()}>
                <Camera className="size-4" /> Take a photo
              </AnimatedButton>
              <AnimatedButton size="lg" variant="glass" fullWidth onClick={() => photoRef.current?.click()}>
                <ImageUp className="size-4" /> Choose a photo
              </AnimatedButton>
            </div>
          </GlassCard>

          {/* Statement path — CSV / PDF export. */}
          <GlassCard padded>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex w-full items-center gap-3 rounded-2xl border border-dashed border-[var(--field-border)] bg-[var(--field-bg)] px-4 py-5 text-start transition-colors hover:border-[var(--focus-ring)]/60"
            >
              <span className="grid size-10 place-items-center rounded-xl bg-[var(--glass-bg-strong)]"><Upload className="size-5 text-[var(--color-gold-500)]" /></span>
              <span className="min-w-0">
                <span className="text-strong block text-sm font-medium">Upload a statement</span>
                <span className="text-muted block text-xs">CSV or PDF export from your bank.</span>
              </span>
            </button>
          </GlassCard>

          <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onImage} />
          <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={onImage} />
          <input ref={fileRef} type="file" accept=".csv,text/csv,.pdf,application/pdf" className="hidden" onChange={onFile} />
          <p className="text-muted flex items-start gap-2 px-1 text-xs"><Info className="mt-0.5 size-3.5 shrink-0" />Everything is processed on your device and shown for review before anything is saved.</p>
        </div>
        )
      ) : (
        <div className="flex flex-col gap-4">
          <GlassCard padded>
            <div className="flex items-center gap-2 text-sm"><FileText className="size-4 text-[var(--color-gold-500)]" /><span className="text-body truncate">{fileName}</span><button type="button" onClick={() => { setDrafts([]); setRows([]); setMapping(null); }} className="text-muted ml-auto text-xs hover:text-[var(--text-strong)]">Change file</button></div>
            <p className="text-muted mt-3 mb-2 text-xs">If a column looks wrong, fix it here:</p>
            <div className="grid gap-2 sm:grid-cols-2">
              <Select label="Date column" value={mapping?.date ?? ""} onChange={(e) => remap({ date: e.target.value || null })} options={colOptions} />
              <Select label="Description column" value={mapping?.description ?? ""} onChange={(e) => remap({ description: e.target.value || null })} options={colOptions} />
              <Select label="Amount column (signed)" value={mapping?.amount ?? ""} onChange={(e) => remap({ amount: e.target.value || null })} options={colOptions} />
              <div className="grid grid-cols-2 gap-2">
                <Select label="Debit / out" value={mapping?.debit ?? ""} onChange={(e) => remap({ debit: e.target.value || null })} options={colOptions} />
                <Select label="Credit / in" value={mapping?.credit ?? ""} onChange={(e) => remap({ credit: e.target.value || null })} options={colOptions} />
              </div>
              <Select label="Type column (CR/DR)" value={mapping?.type ?? ""} onChange={(e) => remap({ type: e.target.value || null })} options={colOptions} />
            </div>
          </GlassCard>

          <div className="flex items-center justify-between px-1 text-sm">
            <span className="text-body"><span className="text-strong font-medium">{included.length}</span> to import{dupCount > 0 && <span className="text-muted"> · {dupCount} duplicate{dupCount === 1 ? "" : "s"} skipped</span>}</span>
          </div>

          <div className="flex flex-col gap-2">
            {drafts.map((d) => (
              <div key={d.id} className={cn("glass flex flex-col gap-2 p-3 sm:flex-row sm:items-center", !d.include && "opacity-50")}>
                <label className="flex items-center gap-2 sm:w-32">
                  <input type="checkbox" checked={d.include} onChange={(e) => editDraft(d.id, { include: e.target.checked })} className="size-4 accent-[var(--color-gold-500)]" />
                  <span className="text-muted text-xs tabular-nums">{toDateInput(d.date)}</span>
                  {d.duplicate && <span className="rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[0.6rem] text-amber-600 dark:text-amber-300">dup</span>}
                </label>
                <input value={d.note} onChange={(e) => editDraft(d.id, { note: e.target.value })} placeholder="Description" className="min-w-0 flex-1 rounded-lg border border-[var(--field-border)] bg-[var(--field-bg)] px-2.5 py-1.5 text-sm text-[var(--text-strong)] focus:outline-none" />
                <div className="inline-flex shrink-0 rounded-lg border border-[var(--field-border)] bg-[var(--field-bg)] p-0.5 text-xs">
                  {(["expense", "income"] as TxType[]).map((tt) => (
                    <button key={tt} type="button" onClick={() => editDraft(d.id, { type: tt })} className={cn("rounded-md px-2 py-1 capitalize", d.type === tt ? (tt === "income" ? "bg-emerald-500/20 text-emerald-500" : "bg-rose-500/20 text-rose-500") : "text-[var(--text-muted)]")}>{tt === "income" ? "In" : "Out"}</button>
                  ))}
                </div>
                <select value={d.category} onChange={(e) => editDraft(d.id, { category: e.target.value })} className="shrink-0 rounded-lg border border-[var(--field-border)] bg-[var(--field-bg)] px-2 py-1.5 text-xs text-[var(--text-strong)] focus:outline-none">
                  {categoriesFor(d.type).map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
                <span className={cn("shrink-0 text-end text-sm font-medium tabular-nums sm:w-24", d.type === "income" ? "text-emerald-500" : "text-rose-500")}>{d.type === "income" ? "+" : "−"}{money(d.amount, d.currency)}</span>
              </div>
            ))}
          </div>

          <div className="sticky bottom-20 z-10 lg:bottom-4">
            <AnimatedButton size="lg" fullWidth loading={importing} disabled={included.length === 0} onClick={doImport}>
              Import {included.length} transaction{included.length === 1 ? "" : "s"} <ArrowRight className="size-4" />
            </AnimatedButton>
          </div>
        </div>
      )}
    </div>
  );
}
