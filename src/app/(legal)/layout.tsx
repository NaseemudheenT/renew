import Link from "next/link";
import { RenewMark } from "@/components/brand/RenewMark";
import { Wordmark } from "@/components/brand/Wordmark";
import { LegalBackButton } from "@/components/legal/LegalBackButton";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative mx-auto min-h-dvh max-w-2xl px-5 py-10 sm:px-6">
      <LegalBackButton />
      <Link href="/" className="mb-8 flex items-center gap-2.5" aria-label="Renew home">
        <RenewMark size={34} />
        <Wordmark sizeClassName="text-lg" />
      </Link>
      <article className="prose-renew">{children}</article>
      <div className="mt-10 flex gap-4 border-t border-[var(--glass-border)] pt-6 text-sm text-[var(--text-muted)]">
        <Link href="/privacy" className="hover:text-[var(--text-strong)]">Privacy</Link>
        <Link href="/terms" className="hover:text-[var(--text-strong)]">Terms</Link>
        <Link href="/" className="hover:text-[var(--text-strong)]">Home</Link>
      </div>
    </div>
  );
}
