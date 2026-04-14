import nodemailer from "nodemailer";
import mailchecker from "mailchecker";

// Email configuration
const EMAIL_HOST = process.env.EMAIL_HOST || "smtp.gmail.com";
const EMAIL_PORT = parseInt(process.env.EMAIL_PORT || "587");
const EMAIL_USER = process.env.EMAIL_USER || "";
const EMAIL_PASS = process.env.EMAIL_PASS || "";
const EMAIL_FROM = process.env.EMAIL_FROM || "True Beauty <noreply@truebeauty.com>";
const APP_URL = process.env.APP_URL || "http://localhost:3000";

// Create transporter
const transporter = nodemailer.createTransport({
  host: EMAIL_HOST,
  port: EMAIL_PORT,
  secure: EMAIL_PORT === 465,
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

// Validate email domain using mailchecker
export function isDisposableEmail(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return true;

  // mailchecker returns list of disposable domains
  const disposableDomains = mailchecker.getList();
  return disposableDomains.includes(domain);
}

// Validate email format and domain
export function validateEmail(email: string): { valid: boolean; error?: string } {
  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, error: "Invalid email format" };
  }

  // Check for disposable email
  if (isDisposableEmail(email)) {
    return {
      valid: false,
      error: "Disposable email addresses are not allowed. Please use a valid email like gmail.com or yahoo.com"
    };
  }

  return { valid: true };
}

// Email templates
const templates = {
  verifyEmail: (name: string, verifyUrl: string) => `
<!DOCTYPE html>
<html style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email - True Beauty</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">True Beauty</h1>
      <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 16px;">Welcome to our platform!</p>
    </div>

    <!-- Content -->
    <div style="padding: 40px 30px;">
      <h2 style="color: #333333; margin: 0 0 20px; font-size: 24px;">Verify Your Email Address</h2>

      <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
        Hi ${name},
      </p>

      <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
        Thank you for registering with True Beauty! Please click the button below to verify your email address and complete your registration.
      </p>

      <!-- Verify Button -->
      <div style="text-align: center; margin: 30px 0;">
        <a href="${verifyUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
          Verify Email Address
        </a>
      </div>

      <!-- Fallback Link -->
      <p style="color: #999999; font-size: 14px; line-height: 1.6; margin: 20px 0;">
        Or copy and paste this link into your browser:<br>
        <a href="${verifyUrl}" style="color: #667eea; word-break: break-all;">${verifyUrl}</a>
      </p>

      <!-- Info Box -->
      <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 30px 0;">
        <p style="color: #666666; font-size: 14px; margin: 0; line-height: 1.6;">
          <strong>Important:</strong> This verification link will expire in 24 hours. If you didn't create an account with True Beauty, please ignore this email.
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div style="background: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #eeeeee;">
      <p style="color: #999999; font-size: 14px; margin: 0;">
        © ${new Date().getFullYear()} True Beauty. All rights reserved.
      </p>
      <p style="color: #cccccc; font-size: 12px; margin: 10px 0 0;">
        This is an automated email. Please do not reply.
      </p>
    </div>
  </div>
</body>
</html>
`,

  resendVerification: (name: string, verifyUrl: string) => `
<!DOCTYPE html>
<html style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email - True Beauty</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 40px 30px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">True Beauty</h1>
      <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 16px;">Email Verification Resent</p>
    </div>

    <!-- Content -->
    <div style="padding: 40px 30px;">
      <h2 style="color: #333333; margin: 0 0 20px; font-size: 24px;">Please Verify Your Email</h2>

      <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
        Hi ${name},
      </p>

      <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
        You requested a new verification email. Please click the button below to verify your email address.
      </p>

      <!-- Verify Button -->
      <div style="text-align: center; margin: 30px 0;">
        <a href="${verifyUrl}" style="display: inline-block; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 15px rgba(245, 87, 108, 0.4);">
          Verify Email Now
        </a>
      </div>

      <!-- Fallback Link -->
      <p style="color: #999999; font-size: 14px; line-height: 1.6; margin: 20px 0;">
        Or copy and paste:<br>
        <a href="${verifyUrl}" style="color: #f5576c; word-break: break-all;">${verifyUrl}</a>
      </p>
    </div>

    <!-- Footer -->
    <div style="background: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #eeeeee;">
      <p style="color: #999999; font-size: 14px; margin: 0;">
        © ${new Date().getFullYear()} True Beauty. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
`,

  passwordReset: (name: string, resetUrl: string) => `
<!DOCTYPE html>
<html style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Password - True Beauty</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); padding: 40px 30px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">True Beauty</h1>
      <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 16px;">Password Reset Request</p>
    </div>

    <!-- Content -->
    <div style="padding: 40px 30px;">
      <h2 style="color: #333333; margin: 0 0 20px; font-size: 24px;">Reset Your Password</h2>

      <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
        Hi ${name},
      </p>

      <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
        We received a request to reset your password. Click the button below to create a new password.
      </p>

      <!-- Reset Button -->
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 15px rgba(250, 112, 154, 0.4);">
          Reset Password
        </a>
      </div>

      <!-- Fallback Link -->
      <p style="color: #999999; font-size: 14px; line-height: 1.6; margin: 20px 0;">
        Or copy and paste:<br>
        <a href="${resetUrl}" style="color: #fa709a; word-break: break-all;">${resetUrl}</a>
      </p>

      <!-- Security Notice -->
      <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 20px; margin: 30px 0;">
        <p style="color: #856404; font-size: 14px; margin: 0; line-height: 1.6;">
          <strong>⚠️ Security Notice:</strong> If you didn't request a password reset, please ignore this email. Your password will remain unchanged.
        </p>
      </div>

      <p style="color: #999999; font-size: 14px; line-height: 1.6; margin: 20px 0 0;">
        This link will expire in 1 hour.
      </p>
    </div>

    <!-- Footer -->
    <div style="background: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #eeeeee;">
      <p style="color: #999999; font-size: 14px; margin: 0;">
        © ${new Date().getFullYear()} True Beauty. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
`,
};

// Send email function
async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  // Skip if no email credentials configured (development mode)
  if (!EMAIL_USER || !EMAIL_PASS) {
    console.log("📧 [DEV MODE] Email would be sent to:", to);
    console.log("📧 [DEV MODE] Subject:", subject);
    return true;
  }

  try {
    await transporter.sendMail({
      from: EMAIL_FROM,
      to,
      subject,
      html,
    });
    console.log("✅ Email sent to:", to);
    return true;
  } catch (error) {
    console.error("❌ Email send error:", error);
    return false;
  }
}

// Email sending functions
export async function sendVerificationEmail(
  email: string,
  name: string,
  token: string
): Promise<boolean> {
  const verifyUrl = `${APP_URL}/users/verify-email?token=${token}`;
  const html = templates.verifyEmail(name, verifyUrl);
  return sendEmail(email, "Verify Your Email - True Beauty", html);
}

export async function sendResendVerificationEmail(
  email: string,
  name: string,
  token: string
): Promise<boolean> {
  const verifyUrl = `${APP_URL}/users/verify-email?token=${token}`;
  const html = templates.resendVerification(name, verifyUrl);
  return sendEmail(email, "Verify Your Email - True Beauty", html);
}

export async function sendPasswordResetEmail(
  email: string,
  name: string,
  token: string
): Promise<boolean> {
  const resetUrl = `${APP_URL}/users/reset-password?token=${token}`;
  const html = templates.passwordReset(name, resetUrl);
  return sendEmail(email, "Reset Your Password - True Beauty", html);
}

export { transporter };
