import "server-only";

/**
 * Branded, email-client-safe HTML (inline styles, table-free simple layout).
 * Champagne-on-ivory to match the Renew world, but high-contrast for legibility.
 */
export function otpEmail(code: string, name?: string | null) {
  const greeting = name ? `Hi ${escapeHtml(name)},` : "Hi,";
  const spaced = code.split("").join(" ");
  const subject = `${code} is your Renew verification code`;

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;background:#efe8dc;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#4a4741;">
  <div style="max-width:480px;margin:0 auto;padding:40px 24px;">
    <div style="text-align:center;margin-bottom:28px;">
      <span style="font-size:22px;letter-spacing:0.42em;text-transform:uppercase;font-weight:300;color:#a5824a;">Renew</span>
    </div>
    <div style="background:#ffffff;border-radius:20px;padding:36px 32px;box-shadow:0 10px 40px rgba(70,58,34,0.12);">
      <p style="margin:0 0 8px;font-size:16px;color:#2b2b2f;">${greeting}</p>
      <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#4a4741;">
        Use this code to verify your email and finish setting up Renew. It expires in 10 minutes.
      </p>
      <div style="text-align:center;margin:8px 0 24px;">
        <div style="display:inline-block;background:linear-gradient(180deg,#f4e9cf,#e9d3a3);color:#2a2113;font-size:30px;font-weight:600;letter-spacing:8px;padding:16px 28px;border-radius:14px;">
          ${spaced}
        </div>
      </div>
      <p style="margin:0;font-size:13px;line-height:1.6;color:#7c7669;">
        If you didn’t request this, you can safely ignore this email — no changes will be made to your account.
      </p>
    </div>
    <p style="text-align:center;margin:24px 0 0;font-size:12px;color:#7c7669;">
      Renew · a calm companion for life’s renewals
    </p>
  </div>
</body></html>`;

  const text = `${greeting}\n\nYour Renew verification code is: ${code}\nIt expires in 10 minutes.\n\nIf you didn't request this, you can ignore this email.\n\n— Renew`;

  return { subject, html, text };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
