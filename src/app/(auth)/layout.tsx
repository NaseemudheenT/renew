import Link from "next/link";
import { RenewMark } from "@/components/brand/RenewMark";
import { Wordmark } from "@/components/brand/Wordmark";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

/** Centered, cinematic frame shared by every entry screen. */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center px-5 py-10 sm:px-6">
      <div className="absolute right-5 top-5 sm:right-8 sm:top-8">
        <ThemeToggle />
      </div>

      <Link
        href="/"
        className="mb-8 flex flex-col items-center gap-3"
        aria-label="Renew home"
      >
        <RenewMark size={64} />
        <Wordmark sizeClassName="text-xl" />
      </Link>

      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
