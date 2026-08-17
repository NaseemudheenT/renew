import Link from "next/link";
import { SocialAuth } from "@/components/auth/SocialAuth";

export default function SignUpPage() {
  return (
    <div>
      <SocialAuth title="Create your account" subtitle="Start keeping life's renewals in one calm place." />
      <p className="text-muted mt-5 text-center text-sm">
        Already have an account?{" "}
        <Link href="/sign-in" className="font-medium text-[var(--color-gold-600)] hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
