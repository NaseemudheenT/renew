import Link from "next/link";
import { AuthBrand } from "@/components/brand/AuthBrand";

/** Centered, cinematic frame shared by every entry screen. */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center px-5 py-10 sm:px-6">
      <Link href="/" aria-label="Renew home">
        <AuthBrand />
      </Link>

      <div className="w-full max-w-md">{children}</div>
      {/* Privacy & Terms are accepted during onboarding and linked in Settings —
          intentionally not shown on these entry screens (see punch-list #2). */}
    </div>
  );
}
