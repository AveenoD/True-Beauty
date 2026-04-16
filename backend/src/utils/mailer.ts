import nodemailer from "nodemailer";

const required = (name: string, value: string | undefined): string => {
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
};

export const mailer = nodemailer.createTransport({
  host: required("EMAIL_HOST", process.env.EMAIL_HOST),
  port: parseInt(required("EMAIL_PORT", process.env.EMAIL_PORT), 10),
  secure: false,
  auth: {
    user: required("EMAIL_USER", process.env.EMAIL_USER),
    pass: required("EMAIL_PASS", process.env.EMAIL_PASS),
  },
});

export async function sendVerificationEmail(params: {
  to: string;
  name: string;
  verifyUrl: string;
}) {
  const from = process.env.EMAIL_FROM || params.to;

  const html = baseEmailTemplate({
    title: "Verify your email",
    preheader: "Verify your email to activate your True Beauty account.",
    greetingName: params.name,
    bodyHtml: `
      <p style="margin:0 0 16px 0;">
        Please verify your email to activate your True Beauty account.
      </p>
      <p style="margin:0 0 16px 0; color:#374151; font-size:14px;">
        This link is valid for <strong>24 hours</strong>.
      </p>
    `,
    cta: { label: "Verify Email", url: params.verifyUrl },
    fallbackUrl: params.verifyUrl,
    securityNote:
      "If you didn’t create an account with True Beauty, you can safely ignore this email.",
  });

  await mailer.sendMail({
    from,
    to: params.to,
    subject: "Verify your True Beauty account",
    html,
  });
}

export async function sendPasswordResetEmail(params: {
  to: string;
  name: string;
  resetUrl: string;
  expiryMinutes: number;
}) {
  const from = process.env.EMAIL_FROM || params.to;

  const html = baseEmailTemplate({
    title: "Reset your password",
    preheader: "Use the link below to reset your True Beauty password.",
    greetingName: params.name,
    bodyHtml: `
      <p style="margin:0 0 16px 0;">
        We received a request to reset your password. Click the button below to set a new password.
      </p>
      <p style="margin:0 0 16px 0; color:#374151; font-size:14px;">
        This link is valid for <strong>${params.expiryMinutes} minutes</strong>.
      </p>
    `,
    cta: { label: "Reset Password", url: params.resetUrl },
    fallbackUrl: params.resetUrl,
    securityNote:
      "If you didn’t request a password reset, you can ignore this email. Your password will not change.",
  });

  await mailer.sendMail({
    from,
    to: params.to,
    subject: "Reset your True Beauty password",
    html,
  });
}

function escapeHtml(s: string) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function baseEmailTemplate(params: {
  title: string;
  preheader: string;
  greetingName: string;
  bodyHtml: string;
  cta: { label: string; url: string };
  fallbackUrl: string;
  securityNote: string;
}) {
  const brand = "True Beauty";
  const title = escapeHtml(params.title);
  const greetingName = escapeHtml(params.greetingName);
  const ctaLabel = escapeHtml(params.cta.label);
  const ctaUrl = params.cta.url;
  const fallbackUrl = params.fallbackUrl;

  return `
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
</head>

<body style="margin:0; padding:0; background:#f3f4f6;">

  <!-- Preheader -->
  <div style="display:none; max-height:0; overflow:hidden; opacity:0; color:transparent;">
    ${escapeHtml(params.preheader)}
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6; padding:20px 10px;">
    <tr>
      <td align="center">

        <!-- Main Container -->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0"
          style="max-width:600px; width:100%; background:#ffffff; border-radius:14px; overflow:hidden; box-shadow:0 4px 12px rgba(0,0,0,0.05);">

          <!-- Header -->
          <tr>
            <td style="padding:18px 24px; font-family: Arial, sans-serif; font-size:20px; font-weight:700; color:#111827; border-bottom:1px solid #e5e7eb;">
              ${brand}
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:28px 24px; font-family: Arial, sans-serif; color:#111827;">

              <h2 style="margin:0 0 14px 0; font-size:22px; font-weight:700; line-height:1.4;">
                ${title}
              </h2>

              <p style="margin:0 0 16px 0; font-size:15px; color:#374151;">
                Hi ${greetingName},
              </p>

              <div style="font-size:15px; color:#374151; line-height:1.6;">
                ${params.bodyHtml}
              </div>

              <!-- CTA Button -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
                <tr>
                  <td align="center">
                    <a href="${ctaUrl}"
                      style="background:#2563EB; color:#ffffff; text-decoration:none; padding:14px 22px; font-size:14px; font-weight:600; border-radius:8px; display:inline-block;">
                      ${ctaLabel}
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Fallback -->
              <p style="margin:0 0 6px 0; font-size:12px; color:#6b7280;">
                If the button doesn’t work, use this link:
              </p>

              <p style="margin:0 0 18px 0; font-size:12px; color:#2563EB; word-break:break-all;">
                ${fallbackUrl}
              </p>

              <!-- Security Note -->
              <p style="margin:0; font-size:12px; color:#9ca3af;">
                ${escapeHtml(params.securityNote)}
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:16px 24px; font-family: Arial, sans-serif; font-size:12px; color:#6b7280; border-top:1px solid #e5e7eb; text-align:center;">
              © ${new Date().getFullYear()} ${brand}. All rights reserved.
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
`;
}

