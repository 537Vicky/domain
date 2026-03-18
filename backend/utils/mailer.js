// utils/mailer.js — Nodemailer helper for sending OTP emails
const nodemailer = require('nodemailer');

/* ── Credential check ─────────────────────────────────────────────
   If SMTP_USER / SMTP_PASS are blank we operate in "dev / console"
   mode: skip actual email sending and print the OTP to the terminal.
   Fill in both values in .env to switch to real email delivery.
────────────────────────────────────────────────────────────────── */
const smtpUser = (process.env.SMTP_USER || '').trim();
const smtpPass = (process.env.SMTP_PASS || '').trim();
const hasCredentials = smtpUser.length > 0 && smtpPass.length > 0;

/* ── Transporter (only built when credentials exist) ────────────── */
let transporter = null;

if (hasCredentials) {
    transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: false, // use STARTTLS on port 587
        auth: {
            user: smtpUser,
            pass: smtpPass,
        },
    });
}

/**
 * Generic mail sender.
 * Falls back to a console log when SMTP credentials are not configured.
 *
 * @param {string} to       - recipient email address
 * @param {string} subject  - email subject
 * @param {string} html     - HTML body
 */
const sendMail = async (to, subject, html) => {
    if (!hasCredentials) {
        // ── DEV / NO-CREDENTIALS MODE ──────────────────────────────
        console.log('\n' + '─'.repeat(60));
        console.log('📧  [MAILER — DEV MODE]  Real email NOT sent.');
        console.log(`    To      : ${to}`);
        console.log(`    Subject : ${subject}`);
        // Extract OTP from HTML for quick copy-paste during testing
        const otpMatch = html.match(/class="otp-code">(\d{6})<\/div>/);
        if (otpMatch) {
            console.log(`    OTP Code: ${otpMatch[1]}   ← use this to verify`);
        }
        console.log('    To send real emails set SMTP_USER & SMTP_PASS in .env');
        console.log('─'.repeat(60) + '\n');
        return { dev: true };
    }

    // ── PRODUCTION / REAL EMAIL MODE ──────────────────────────────
    const info = await transporter.sendMail({
        from: `"RenewX" <${smtpUser}>`,
        to,
        subject,
        html,
    });
    return info;
};

/**
 * Sends an OTP verification email (or logs it to console in dev mode).
 *
 * @param {string} to   - recipient email
 * @param {string} otp  - 6-digit OTP string
 */
const sendOtpEmail = async (to, otp) => {
    const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; background: #f4f6fb; margin: 0; padding: 0; }
          .wrapper { max-width: 480px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
          .header { background: linear-gradient(135deg, #4f46e5, #7c3aed); padding: 32px 32px 24px; text-align: center; }
          .header h1 { color: #fff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
          .header p  { color: rgba(255,255,255,0.8); margin: 6px 0 0; font-size: 14px; }
          .body { padding: 32px; text-align: center; }
          .body p  { color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 24px; }
          .otp-box { display: inline-block; background: #f0f0ff; border: 2px dashed #6366f1; border-radius: 12px; padding: 18px 40px; margin: 0 auto 28px; }
          .otp-code { font-size: 42px; font-weight: 800; letter-spacing: 12px; color: #4f46e5; font-family: 'Courier New', monospace; }
          .note { font-size: 13px; color: #9ca3af; }
          .footer { background: #f9fafb; border-top: 1px solid #e5e7eb; padding: 20px 32px; text-align: center; font-size: 12px; color: #9ca3af; }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="header">
            <h1>🔐 RenewX</h1>
            <p>Email Verification</p>
          </div>
          <div class="body">
            <p>Hi there! Use the code below to verify your email address. <br/>This code expires in <strong>3 minutes</strong>.</p>
            <div class="otp-box">
              <div class="otp-code">${otp}</div>
            </div>
            <p class="note">If you did not create a RenewX account, you can safely ignore this email.</p>
          </div>
          <div class="footer">© ${new Date().getFullYear()} RenewX — All rights reserved.</div>
        </div>
      </body>
    </html>`;

    return sendMail(to, 'Your RenewX Verification Code', html);
};

module.exports = { sendMail, sendOtpEmail };
