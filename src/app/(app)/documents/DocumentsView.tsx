"use client";

import { useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { FileText, Search } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { UploadZone } from "@/components/documents/UploadZone";
import { DocumentCard } from "@/components/documents/DocumentCard";
import { DocumentDetail } from "@/components/documents/DocumentDetail";
import { useUserCollection } from "@/hooks/useUserCollection";
import { CATEGORIES } from "@/lib/categories";
import type { DocItem, Category } from "@/lib/types";
import { cn } from "@/lib/utils";

export function DocumentsView() {
  const { data, loading, uid } = useUserCollection<DocItem>("documents");
  const [queryText, setQueryText] = useState("");
  const [filter, setFilter] = useState<Category | "all">("all");
  const [openDoc, setOpenDoc] = useState<DocItem | null>(null);

  const filtered = useMemo(() => {
    const q = queryText.trim().toLowerCase();
    return data
      .filter((d) => (filter === "all" ? true : d.category === filter))
      .filter((d) => (q ? d.name.toLowerCase().includes(q) : true))
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [data, filter, queryText]);
  const liveOpenDoc = openDoc ? data.find((d) => d.id === openDoc.id) ?? null : null;
  const usedCategories = useMemo(() => {
    const set = new Set(data.map((d) => d.category));
    return CATEGORIES.filter((c) => set.has(c.id));
  }, [data]);

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="Documents" subtitle="One secure home for the papers that matter." />
      {uid && <div className="mb-6"><UploadZone uid={uid} /></div>}

      {data.length > 0 && (
        <div className="mb-5 flex flex-col gap-3">
          <div className="glass flex items-center gap-2 p-2 pl-4">
            <Search className="size-4.5 shrink-0 text-[var(--text-muted)]" />
            <input value={queryText} onChange={(e) => setQueryText(e.target.value)} placeholder="Search documents…" aria-label="Search documents" className="h-9 flex-1 bg-transparent text-sm text-[var(--text-strong)] placeholder:text-[var(--text-muted)] focus:outline-none" />
          </div>
          {usedCategories.length > 1 && (
            <div className="flex flex-wrap gap-2">
              <FilterChip label="All" active={filter === "all"} onClick={() => setFilter("all")} />
              {usedCategories.map((c) => <FilterChip key={c.id} label={c.label} active={filter === c.id} onClick={() => setFilter(c.id)} />)}
            </div>
          )}
        </div>
      )}

      {!loading && data.length === 0 ? (
        <GlassCard padded><EmptyState icon={FileText} title="No documents yet" description="Upload passports, insurance policies, licenses — anything you want kept safe and easy to find. Drag a file above to begin." /></GlassCard>
      ) : filtered.length === 0 && !loading ? (
        <GlassCard padded><EmptyState compact icon={Search} title="No matches" description="Try a different search or filter." /></GlassCard>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <AnimatePresence>{filtered.map((doc) => <DocumentCard key={doc.id} doc={doc} onOpen={() => setOpenDoc(doc)} />)}</AnimatePresence>
        </div>
      )}

      {uid && <DocumentDetail uid={uid} doc={liveOpenDoc} open={Boolean(liveOpenDoc)} onClose={() => setOpenDoc(null)} />}
    </div>
  );
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={cn("rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors", active ? "border-[var(--focus-ring)] bg-[var(--glass-bg-strong)] text-[var(--text-strong)]" : "border-[var(--field-border)] bg-[var(--field-bg)] text-[var(--text-muted)] hover:text-[var(--text-strong)]")}>{label}</button>
  );
}
