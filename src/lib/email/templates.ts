/**
 * Transactional email templates as self-contained HTML strings (inline styles
 * for maximum client compatibility). On-brand: deep navy, champagne gold.
 */

export function otpEmail(code: string): { subject: string; html: string; text: string } {
  const spaced = code.split("").join(" ");
  return {
    subject: `${code} is your Renew verification code`,
    text: `Your Renew verification code is ${code}. It expires in 10 minutes. If you didn't request this, you can ignore this email.`,
    html: `
<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#0b0e14;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0b0e14;padding:40px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:440px;background:#10141d;border:1px solid rgba(214,202,172,0.12);border-radius:20px;overflow:hidden;">
            <tr>
              <td style="padding:40px 40px 8px;text-align:center;">
                <div style="font-size:13px;letter-spacing:6px;text-transform:uppercase;color:#d4af6a;font-weight:600;">Renew</div>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 40px 0;text-align:center;">
                <h1 style="margin:16px 0 4px;font-size:20px;line-height:1.4;color:#f4f1e9;font-weight:500;">Verify your email</h1>
                <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#a2a7b3;">Enter this code in Renew to continue. It expires in 10 minutes.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 40px;text-align:center;">
                <div style="display:inline-block;padding:18px 28px;border-radius:14px;background:rgba(212,175,106,0.10);border:1px solid rgba(212,175,106,0.30);font-size:30px;letter-spacing:10px;font-weight:600;color:#ecd199;">${spaced}</div>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 40px 40px;text-align:center;">
                <p style="margin:0;font-size:12px;line-height:1.6;color:#6c7280;">If you didn't request this, you can safely ignore this email.</p>
              </td>
            </tr>
          </table>
          <p style="margin:20px 0 0;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#3f4550;">A Zap product</p>
        </td>
      </tr>
    </table>
  </body>
</html>`,
  };
}
