import Link from "next/link";
import { RenewMark } from "@/components/brand/RenewMark";
import { Wordmark } from "@/components/brand/Wordmark";

/** Centered, cinematic frame shared by every entry screen. */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center px-5 py-10 sm:px-6">
      <Link href="/" className="mb-8 flex flex-col items-center gap-3" aria-label="Renew home">
        <RenewMark size={60} />
        <Wordmark sizeClassName="text-xl" />
      </Link>

      <div className="w-full max-w-md">{children}</div>

      <footer className="mt-8 flex items-center gap-4 text-xs text-[var(--text-muted)]">
        <Link href="/privacy" className="hover:text-[var(--text-strong)]">Privacy</Link>
        <span aria-hidden="true">·</span>
        <Link href="/terms" className="hover:text-[var(--text-strong)]">Terms</Link>
      </footer>
    </div>
  );
}
