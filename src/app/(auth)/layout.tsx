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
      {/* Privacy & Terms are accepted during onboarding and linked in Settings —
          intentionally not shown on these entry screens (see punch-list #2). */}
    </div>
  );
}
