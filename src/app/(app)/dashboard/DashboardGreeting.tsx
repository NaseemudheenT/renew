"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { AnimatedButton, StaggerContainer, StaggerItem } from "@/components/motion";
import { RenewMark } from "@/components/brand/RenewMark";
import { signOutUser } from "@/lib/auth/client";

export function DashboardGreeting({ firstName }: { firstName: string }) {
  const router = useRouter();

  async function onSignOut() {
    await signOutUser();
    router.replace("/sign-in");
  }

  return (
    <StaggerContainer className="flex flex-col items-center gap-6" stagger={0.1}>
      <StaggerItem>
        <RenewMark size={72} />
      </StaggerItem>
      <StaggerItem>
        <h1 className="text-strong text-2xl font-light">
          Welcome, {firstName}.
        </h1>
      </StaggerItem>
      <StaggerItem>
        <GlassCard padded className="max-w-md">
          <p className="text-muted text-sm">
            You&apos;re signed in and verified. Your calm command center — today&apos;s
            reminders, upcoming renewals, and everything that matters — arrives next.
          </p>
        </GlassCard>
      </StaggerItem>
      <StaggerItem>
        <AnimatedButton variant="glass" onClick={onSignOut}>
          <LogOut className="size-4" />
          Sign out
        </AnimatedButton>
      </StaggerItem>
    </StaggerContainer>
  );
}
