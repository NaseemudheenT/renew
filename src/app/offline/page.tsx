import { RenewMark } from "@/components/brand/RenewMark";
import { Wordmark } from "@/components/brand/Wordmark";

export const metadata = { title: "Offline" };

export default function OfflinePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 p-6 text-center">
      <RenewMark size={72} />
      <Wordmark sizeClassName="text-2xl" />
      <div className="glass max-w-sm p-6 sm:p-8">
        <h1 className="text-strong text-lg font-medium">You&apos;re offline</h1>
        <p className="text-muted mt-2 text-sm">
          Renew needs a connection to load your latest money data. Reconnect and it&apos;ll pick up right where you left off.
        </p>
      </div>
    </main>
  );
}
