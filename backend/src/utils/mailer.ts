import "dotenv/config";
import nodemailer from "nodemailer";

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : undefined;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_SECURE = process.env.SMTP_SECURE === "true";
const FROM_EMAIL = process.env.MAIL_FROM || SMTP_USER;
const FROM_NAME = process.env.MAIL_FROM_NAME || "True Beauty";

export type SendMailInput = {
  to: string;
  subject: string;
  html: string;
};

function isConfigured(): boolean {
  return Boolean(SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS && FROM_EMAIL);
}

function getTransport() {
  if (!isConfigured()) return null;
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT!,
    secure: SMTP_SECURE,
    auth: { user: SMTP_USER!, pass: SMTP_PASS! },
  });
}

export async function sendMail(input: SendMailInput) {
  const transport = getTransport();
  if (!transport) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "[mailer] SMTP not configured. Set SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS/MAIL_FROM. Skipping send."
      );
    }
    return { skipped: true as const };
  }

  const from = `${FROM_NAME} <${FROM_EMAIL}>`;
  await transport.sendMail({
    from,
    to: input.to,
    subject: input.subject,
    html: input.html,
  });
  return { skipped: false as const };
}

export function buildVerifyEmailHtml(params: { name: string; verifyUrl: string }) {
  const safeName = params.name?.trim() || "there";
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f6f7fb;font-family:Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:28px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #f0e4ea;box-shadow:0 6px 24px rgba(17,24,39,.06);">
            <tr>
              <td style="padding:22px 24px;background:linear-gradient(90deg,#ff3c8c,#ff0066);color:#fff;">
                <div style="font-size:18px;font-weight:800;letter-spacing:.2px;">True Beauty</div>
                <div style="font-size:12px;opacity:.92;margin-top:4px;">Verify your email address</div>
              </td>
            </tr>
            <tr>
              <td style="padding:24px;color:#111827;">
                <p style="margin:0 0 10px 0;font-size:16px;font-weight:700;">Hi ${safeName},</p>
                <p style="margin:0 0 18px 0;font-size:14px;line-height:1.7;color:#374151;">
                  Thanks for creating your account. Please confirm this email address to activate your True Beauty account.
                </p>

                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 18px 0;">
                  <tr>
                    <td align="center">
                      <a href="${params.verifyUrl}" style="display:inline-block;background:#ff0066;color:#fff;text-decoration:none;padding:13px 18px;border-radius:12px;font-weight:800;font-size:14px;">
                        Verify email
                      </a>
                    </td>
                  </tr>
                </table>

                <div style="background:#f9fafb;border:1px solid #eef2f7;border-radius:12px;padding:12px 14px;margin:0 0 14px 0;">
                  <p style="margin:0;font-size:12px;line-height:1.6;color:#6b7280;">
                    This link expires in <strong>24 hours</strong>. If you didn’t create this account, you can safely ignore this email.
                  </p>
                </div>

                <p style="margin:0;font-size:12px;color:#6b7280;word-break:break-all;line-height:1.6;">
                  Having trouble with the button? Copy and paste this URL into your browser:<br/>
                  <a href="${params.verifyUrl}" style="color:#2563eb;text-decoration:none;">${params.verifyUrl}</a>
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:14px 24px;background:#fafafa;color:#9ca3af;font-size:12px;line-height:1.5;">
                © ${new Date().getFullYear()} True Beauty • Please do not reply to this email
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

