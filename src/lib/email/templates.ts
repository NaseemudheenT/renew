import "server-only";

/**
 * Branded, email-client-safe HTML (inline styles, simple layout).
 * Champagne-on-ivory to match the Renew world, high-contrast for legibility.
 * Localized into the common languages; unknown languages fall back to English.
 */

interface OtpStrings {
  subject: (code: string) => string;
  greetingNamed: (name: string) => string;
  greetingPlain: string;
  intro: string;
  ignore: string;
  footer: string;
  textLead: string;
  textExpiry: string;
  textIgnore: string;
}

const OTP_STRINGS: Record<string, OtpStrings> = {
  en: {
    subject: (c) => `${c} is your Renew verification code`,
    greetingNamed: (n) => `Hi ${n},`,
    greetingPlain: "Hi,",
    intro: "Use this code to verify your email and finish setting up Renew. It expires in 10 minutes.",
    ignore: "If you didn’t request this, you can safely ignore this email — no changes will be made to your account.",
    footer: "Renew · your money, beautifully clear",
    textLead: "Your Renew verification code is:",
    textExpiry: "It expires in 10 minutes.",
    textIgnore: "If you didn’t request this, you can ignore this email.",
  },
  es: {
    subject: (c) => `${c} es tu código de verificación de Renew`,
    greetingNamed: (n) => `Hola ${n}:`,
    greetingPlain: "Hola:",
    intro: "Usa este código para verificar tu correo y terminar de configurar Renew. Caduca en 10 minutos.",
    ignore: "Si no lo solicitaste, puedes ignorar este correo con tranquilidad — no se hará ningún cambio en tu cuenta.",
    footer: "Renew · tu dinero, con total claridad",
    textLead: "Tu código de verificación de Renew es:",
    textExpiry: "Caduca en 10 minutos.",
    textIgnore: "Si no lo solicitaste, puedes ignorar este correo.",
  },
  fr: {
    subject: (c) => `${c} est votre code de vérification Renew`,
    greetingNamed: (n) => `Bonjour ${n},`,
    greetingPlain: "Bonjour,",
    intro: "Utilisez ce code pour vérifier votre e-mail et terminer la configuration de Renew. Il expire dans 10 minutes.",
    ignore: "Si vous n’êtes pas à l’origine de cette demande, vous pouvez ignorer cet e-mail — aucun changement ne sera apporté à votre compte.",
    footer: "Renew · vos finances, en toute clarté",
    textLead: "Votre code de vérification Renew est :",
    textExpiry: "Il expire dans 10 minutes.",
    textIgnore: "Si vous n’êtes pas à l’origine de cette demande, ignorez cet e-mail.",
  },
  de: {
    subject: (c) => `${c} ist dein Renew-Bestätigungscode`,
    greetingNamed: (n) => `Hallo ${n},`,
    greetingPlain: "Hallo,",
    intro: "Verwende diesen Code, um deine E-Mail zu bestätigen und die Einrichtung von Renew abzuschließen. Er läuft in 10 Minuten ab.",
    ignore: "Falls du das nicht angefordert hast, kannst du diese E-Mail ignorieren — an deinem Konto wird nichts geändert.",
    footer: "Renew · deine Finanzen, klar im Blick",
    textLead: "Dein Renew-Bestätigungscode lautet:",
    textExpiry: "Er läuft in 10 Minuten ab.",
    textIgnore: "Falls du das nicht angefordert hast, ignoriere diese E-Mail.",
  },
};

function stringsFor(lang: string): OtpStrings {
  return OTP_STRINGS[lang.split("-")[0]?.toLowerCase() ?? "en"] ?? OTP_STRINGS.en!;
}

export function otpEmail(code: string, name?: string | null, lang = "en") {
  const s = stringsFor(lang);
  const greetingHtml = name ? s.greetingNamed(escapeHtml(name)) : s.greetingPlain;
  const greetingText = name ? s.greetingNamed(name) : s.greetingPlain;
  const spaced = code.split("").join(" ");
  const subject = s.subject(code);
  const htmlLang = escapeHtml(lang.split("-")[0] ?? "en");

  const html = `<!doctype html>
<html lang="${htmlLang}"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;background:#efe8dc;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#4a4741;">
  <div style="max-width:480px;margin:0 auto;padding:40px 24px;">
    <div style="text-align:center;margin-bottom:28px;">
      <span style="font-size:22px;letter-spacing:0.42em;text-transform:uppercase;font-weight:300;color:#a5824a;">Renew</span>
    </div>
    <div style="background:#ffffff;border-radius:20px;padding:36px 32px;box-shadow:0 10px 40px rgba(70,58,34,0.12);">
      <p style="margin:0 0 8px;font-size:16px;color:#2b2b2f;">${greetingHtml}</p>
      <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#4a4741;">
        ${escapeHtml(s.intro)}
      </p>
      <div style="text-align:center;margin:8px 0 24px;">
        <div style="display:inline-block;background:linear-gradient(180deg,#f4e9cf,#e9d3a3);color:#2a2113;font-size:30px;font-weight:600;letter-spacing:8px;padding:16px 28px;border-radius:14px;">
          ${spaced}
        </div>
      </div>
      <p style="margin:0;font-size:13px;line-height:1.6;color:#7c7669;">
        ${escapeHtml(s.ignore)}
      </p>
    </div>
    <p style="text-align:center;margin:24px 0 0;font-size:12px;color:#7c7669;">
      ${escapeHtml(s.footer)}
    </p>
  </div>
</body></html>`;

  const text = `${greetingText}\n\n${s.textLead} ${code}\n${s.textExpiry}\n\n${s.textIgnore}\n\n— Renew`;

  return { subject, html, text };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
