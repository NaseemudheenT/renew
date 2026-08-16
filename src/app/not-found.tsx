import Link from "next/link";
import { RenewMark } from "@/components/brand/RenewMark";
import { Wordmark } from "@/components/brand/Wordmark";

export const metadata = { title: "Not found" };

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 p-6 text-center">
      <RenewMark size={64} />
      <Wordmark sizeClassName="text-xl" />
      <div className="glass max-w-sm p-6 sm:p-8">
        <h1 className="text-strong text-lg font-medium">Page not found</h1>
        <p className="text-muted mt-2 text-sm">
          The page you&apos;re looking for doesn&apos;t exist or has moved.
        </p>
        <Link
          href="/"
          className="mt-5 inline-flex h-11 items-center rounded-full bg-gradient-to-b from-gold-200 to-gold-400 px-6 text-sm font-medium text-[var(--text-onGold)]"
        >
          Back to Renew
        </Link>
      </div>
    </main>
  );
}
