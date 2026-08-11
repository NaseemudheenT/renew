import { RenewMark } from "@/components/brand/RenewMark";
import { Wordmark } from "@/components/brand/Wordmark";
import { GlassCard } from "@/components/ui/GlassCard";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

// Phase 0 foundation check — replaced by the cinematic intro in Phase 1.
export default function Home() {
  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center gap-10 p-6">
      <div className="absolute right-6 top-6">
        <ThemeToggle />
      </div>

      <div className="flex flex-col items-center gap-6">
        <RenewMark size={112} />
        <Wordmark sizeClassName="text-3xl" />
      </div>

      <GlassCard padded className="max-w-md text-center">
        <h1 className="text-strong text-lg font-medium">Foundation ready</h1>
        <p className="text-muted mt-2 text-sm">
          Floating liquid glass, champagne tokens, and theming are wired. The
          cinematic environment arrives next.
        </p>
      </GlassCard>
    </main>
  );
}
