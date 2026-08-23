export const metadata = { title: "Privacy Policy", description: "How Renew handles your personal data." };

export default function PrivacyPage() {
  return (
    <>
      <h1>Privacy Policy</h1>
      <p className="lead">Last updated: 21 August 2026</p>
      <p>Renew helps you see and manage your money — accounts, transactions, budgets, savings, bills and payments — in one private place. This policy explains what we collect, why, and the control you have. We aim to collect as little as possible.</p>
      <h2>What we collect</h2>
      <ul>
        <li><strong>Account details</strong> — your name, and the phone number or email you use to sign in.</li>
        <li><strong>Your money data</strong> — the accounts, transactions, budgets, savings, investments and bills you add. This lets Renew show what you have, what you spent, and what&apos;s coming.</li>
        <li><strong>Payment records</strong> — when you pay through Renew, we store the amount, date and a reference id. Card and bank details are handled by our payment provider (Razorpay); <strong>Renew never sees or stores your full card number or CVV.</strong></li>
        <li><strong>Basic technical data</strong> — information needed to keep your session secure and the service reliable.</li>
      </ul>
      <h2>How we use it</h2>
      <ul>
        <li>To provide the service — storing and syncing your data across devices, and showing your money clearly.</li>
        <li>To carry out payments you ask us to make, through our payment provider.</li>
        <li>To send due-date and activity notifications if you enable them.</li>
        <li>To keep the service secure and prevent abuse.</li>
      </ul>
      <p>We do not sell your personal data, and we do not use your money data for advertising.</p>
      <h2>Where your data lives</h2>
      <p>Your account and content are stored in Google Firebase, and any files you upload in Cloudinary. Renew is a tracking tool — it does not connect to your bank, hold, move, or process money, so we never handle payment or banking credentials. Access is restricted so that only you can read or write your own data.</p>
      <h2>Your choices</h2>
      <ul>
        <li>Edit or delete any account, transaction, budget or bill at any time.</li>
        <li>Turn notification types on or off in Settings.</li>
        <li><strong>Delete your account</strong> from Settings — this permanently removes your profile, money data and any uploaded files.</li>
      </ul>
      <h2>Contact</h2>
      <p>Questions about your privacy, or need help? Email us at <a href="mailto:meetzapstudio@gmail.com">meetzapstudio@gmail.com</a>.</p>
      <p className="lead">This document is a plain-language starting point and not legal advice; adapt it to your jurisdiction before launch.</p>
    </>
  );
}
