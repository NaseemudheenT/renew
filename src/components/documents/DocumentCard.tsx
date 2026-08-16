"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { FileText, AlertTriangle } from "lucide-react";
import { categoryMeta } from "@/lib/categories";
import { daysUntil, shortDate } from "@/lib/dates";
import { formatBytes, isImageFormat, cn } from "@/lib/utils";
import type { DocItem } from "@/lib/types";

export function DocumentCard({
  doc,
  onOpen,
}: {
  doc: DocItem;
  onOpen: () => void;
}) {
  const meta = categoryMeta(doc.category);
  const Icon = meta.icon;
  const isImage = isImageFormat(doc.format);
  const expiringSoon =
    doc.expiresAt != null && daysUntil(doc.expiresAt) <= 30;

  return (
    <motion.button
      type="button"
      onClick={onOpen}
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ type: "spring", stiffness: 320, damping: 30 }}
      whileHover={{ y: -3 }}
      className="glass group flex flex-col overflow-hidden p-0 text-left"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[var(--glass-bg-soft)]">
        {isImage ? (
          <Image
            src={doc.url}
            alt={doc.name}
            fill
            sizes="(max-width: 640px) 50vw, 240px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full place-items-center">
            <FileText className="size-12 text-[var(--color-gold-500)]/70" />
            <span className="absolute bottom-2 right-2 rounded-md bg-[var(--glass-bg-strong)] px-1.5 py-0.5 text-[10px] font-semibold uppercase text-[var(--text-body)]">
              {doc.format}
            </span>
          </div>
        )}
        {expiringSoon && (
          <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-rose-500/90 px-2 py-0.5 text-[10px] font-medium text-white">
            <AlertTriangle className="size-3" />
            Expiring
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3">
        <span className="text-strong truncate text-sm font-medium">{doc.name}</span>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted inline-flex items-center gap-1">
            <Icon className="size-3.5" />
            {meta.label}
          </span>
          <span className="text-muted">{formatBytes(doc.bytes)}</span>
        </div>
        {doc.expiresAt != null && (
          <span className={cn("text-xs", expiringSoon ? "text-rose-500" : "text-[var(--text-muted)]")}>
            Expires {shortDate(doc.expiresAt)}
          </span>
        )}
      </div>
    </motion.button>
  );
}
