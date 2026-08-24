"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

/**
 * Back arrow for the legal pages — returns the person to wherever they opened
 * Privacy/Terms from (onboarding, settings, the footer). Falls back to home if
 * there's no in-app history (e.g. the page was opened directly).
 */
export function LegalBackButton() {
  const router = useRouter();

  function goBack() {
    if (typeof window !== "undefined" && window.history.length > 1) router.back();
    else router.push("/");
  }

  return (
    <button
      type="button"
      onClick={goBack}
      aria-label="Go back"
      className="mb-6 inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] transition-colors hover:text-[var(--text-strong)]"
    >
      <ArrowLeft className="size-4" />
      Back
    </button>
  );
}
