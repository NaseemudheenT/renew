"use client";

import { useEffect } from "react";
import { RotateCcw } from "lucide-react";
import { RenewMark } from "@/components/brand/RenewMark";
import { AnimatedButton } from "@/components/motion";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 p-6 text-center">
      <RenewMark size={64} />
      <div className="glass max-w-sm p-6 sm:p-8">
        <h1 className="text-strong text-lg font-medium">Something went sideways</h1>
        <p className="text-muted mt-2 text-sm">A hiccup on our end — nothing you did. Try again, and if it keeps happening we&apos;re on it.</p>
        <div className="mt-5 flex justify-center">
          <AnimatedButton onClick={reset}><RotateCcw className="size-4" />Try again</AnimatedButton>
        </div>
      </div>
    </main>
  );
}
