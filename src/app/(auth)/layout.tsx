/**
 * Minimal entry frame — old auth presentation removed for the redesign. The new
 * Renew entry experience (intro, login, OTP, onboarding) will be built on top of
 * the preserved auth foundation (session cookies, Google/Apple, OTP).
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center p-6">
      {children}
    </div>
  );
}
