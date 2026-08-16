export const metadata = {
  title: "Terms of Service",
  description: "The terms for using Renew.",
};

export default function TermsPage() {
  return (
    <>
      <h1>Terms of Service</h1>
      <p className="lead">Last updated: 16 August 2026</p>

      <p>
        These terms govern your use of Renew (&ldquo;the service&rdquo;), a product by Zap. By
        creating an account you agree to them.
      </p>

      <h2>Your account</h2>
      <ul>
        <li>You&apos;re responsible for keeping your login secure and for activity on your account.</li>
        <li>Provide accurate information and keep it up to date.</li>
        <li>You must be old enough to form a binding contract in your jurisdiction.</li>
      </ul>

      <h2>Acceptable use</h2>
      <p>
        Use Renew for your own personal life management. Don&apos;t upload unlawful content,
        attempt to breach security, or disrupt the service for others.
      </p>

      <h2>Your content</h2>
      <p>
        You own the content you add. You grant us only the limited permission needed to store
        and display it back to you. You can export by downloading your documents and can delete
        your data at any time.
      </p>

      <h2>The service</h2>
      <ul>
        <li>Renew is provided &ldquo;as is&rdquo;; we work to keep it reliable but can&apos;t guarantee it will always be available or error-free.</li>
        <li>Renew helps you remember — it is a tool, not a guarantee. You remain responsible for your own renewals, payments and deadlines.</li>
        <li>Paid plans, if offered, will be described clearly before you&apos;re charged; you&apos;ll never be billed without opting in.</li>
      </ul>

      <h2>Ending your use</h2>
      <p>
        You can delete your account at any time from Settings. We may suspend accounts that
        violate these terms.
      </p>

      <h2>Changes</h2>
      <p>
        We may update these terms; we&apos;ll reflect the date above and, for material changes,
        let you know in the app.
      </p>

      <p className="lead">
        This document is a plain-language starting point and not legal advice; adapt it to your
        jurisdiction before launch.
      </p>
    </>
  );
}
