export const metadata = { title: "Privacy Policy", description: "How Renew handles your personal data." };

export default function PrivacyPage() {
  return (
    <>
      <h1>Privacy Policy</h1>
      <p className="lead">Last updated: 16 August 2026</p>
      <p>Renew, a product by Zap, helps you keep track of life&apos;s renewals, tasks, documents and payments. This policy explains what we collect, why, and the control you have. We aim to collect as little as possible.</p>
      <h2>What we collect</h2>
      <ul>
        <li><strong>Account details</strong> — your name and email, shared by Google or Apple when you sign in.</li>
        <li><strong>Your content</strong> — the reminders, tasks, payments, documents and notifications you create. Documents you upload are stored with our file provider (Cloudinary).</li>
        <li><strong>Basic technical data</strong> — information needed to keep your session secure and the service reliable.</li>
      </ul>
      <h2>How we use it</h2>
      <ul>
        <li>To provide the service — storing and syncing your data across devices.</li>
        <li>To send due-date notifications if you enable them.</li>
        <li>To keep the service secure and prevent abuse.</li>
      </ul>
      <p>We do not sell your personal data, and we do not use your content for advertising.</p>
      <h2>Where your data lives</h2>
      <p>Your account and content are stored in Google Firebase and, for uploaded files, Cloudinary. Access is restricted so that only you can read or write your own data.</p>
      <h2>Your choices</h2>
      <ul>
        <li>Edit or delete any reminder, task, payment or document at any time.</li>
        <li>Turn notification types on or off in Settings.</li>
        <li><strong>Delete your account</strong> from Settings — this permanently removes your profile, content and uploaded files.</li>
      </ul>
      <h2>Contact</h2>
      <p>Questions about your privacy, or need help with any service? Email us at <a href="mailto:meetzapstudio@gmail.com">meetzapstudio@gmail.com</a>.</p>
      <p className="lead">This document is a plain-language starting point and not legal advice; adapt it to your jurisdiction before launch.</p>
    </>
  );
}
