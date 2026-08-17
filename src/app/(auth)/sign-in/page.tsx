import Link from "next/link";
import { SocialAuth } from "@/components/auth/SocialAuth";

export default function SignInPage() {
  return (
    <div>
      <SocialAuth title="Welcome back" subtitle="Sign in to pick up where you left off." />
      <p className="text-muted mt-5 text-center text-sm">
        New to Renew?{" "}
        <Link href="/sign-up" className="font-medium text-[var(--color-gold-600)] hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
