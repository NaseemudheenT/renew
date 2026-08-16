import Link from "next/link";
import { RenewMark } from "@/components/brand/RenewMark";
import { Wordmark } from "@/components/brand/Wordmark";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import {
  StaggerContainer,
  StaggerItem,
  AnimatedButton,
} from "@/components/motion";

/**
 * The Renew entry — a calm, cinematic first impression. Auth wiring arrives in
 * Part 2; the "Begin" action already points at the (upcoming) sign-in route.
 */
export default function Home() {
  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center gap-12 p-6">
      <div className="absolute right-5 top-5 sm:right-8 sm:top-8">
        <ThemeToggle />
      </div>

      <StaggerContainer
        className="flex max-w-xl flex-col items-center gap-7 text-center"
        stagger={0.12}
        delayChildren={0.15}
      >
        <StaggerItem>
          <RenewMark size={120} className="drop-shadow-[0_8px_30px_rgba(160,120,50,0.25)]" />
        </StaggerItem>

        <StaggerItem>
          <Wordmark sizeClassName="text-4xl sm:text-5xl" />
        </StaggerItem>

        <StaggerItem>
          <h1 className="text-strong text-balance text-2xl font-light leading-snug sm:text-3xl">
            Never lose money, documents, or peace of mind
            <br className="hidden sm:block" /> to a forgotten renewal.
          </h1>
        </StaggerItem>

        <StaggerItem>
          <p className="text-muted mx-auto max-w-md text-balance text-base leading-relaxed">
            Renew is a calm companion for life&apos;s commitments — passports,
            insurance, licenses, subscriptions and bills — so the important
            things simply never slip.
          </p>
        </StaggerItem>

        <StaggerItem className="mt-2 flex flex-col items-center gap-3 sm:flex-row">
          <Link href="/sign-up" aria-label="Create your Renew account">
            <AnimatedButton size="lg">Begin</AnimatedButton>
          </Link>
          <Link href="/sign-in" aria-label="Sign in to Renew">
            <AnimatedButton size="lg" variant="glass">
              I already have an account
            </AnimatedButton>
          </Link>
        </StaggerItem>
      </StaggerContainer>
    </main>
  );
}
