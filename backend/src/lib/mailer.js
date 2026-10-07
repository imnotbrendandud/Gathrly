const nodemailer = require('nodemailer');
const env = require('../config/env');
const { renderOtpEmail } = require('./otpEmail');

let transporter;

function getTransporter() {
  if (transporter) return transporter;

  if (!env.email.host) {
    // No SMTP configured: log to console so local dev still works.
    transporter = {
      sendMail: async (msg) => {
        console.log('[mailer] SMTP not configured, would send:', {
          to: msg.to,
          subject: msg.subject,
          text: msg.text,
        });
        return { messageId: 'dev-noop' };
      },
    };
    return transporter;
  }

  transporter = nodemailer.createTransport({
    host: env.email.host,
    port: env.email.port,
    secure: env.email.secure,
    auth: env.email.user ? { user: env.email.user, pass: env.email.pass } : undefined,
  });
  return transporter;
}

async function sendOtpEmail(to, code) {
  const { subject, text, html, attachments } = renderOtpEmail({ code, minutes: env.otp.ttlMinutes });
  await getTransporter().sendMail({ from: env.email.from, to, subject, text, html, attachments });
}

/**
 * Check the SMTP credentials actually work. Called at boot so a bad
 * configuration surfaces immediately instead of on a user's first login.
 * Never throws - a mail outage should not stop the server from starting.
 */
async function verifyTransport() {
  if (!env.email.host) {
    console.warn('[mailer] SMTP_HOST not set - OTP codes will be logged to the console, not emailed');
    return false;
  }
  try {
    await getTransporter().verify();
    console.log(`[mailer] SMTP ready (${env.email.host}:${env.email.port})`);
    return true;
  } catch (err) {
    console.error(`[mailer] SMTP verification FAILED (${env.email.host}:${env.email.port}):`, err.message);
    return false;
  }
}

module.exports = { sendOtpEmail, verifyTransport };
