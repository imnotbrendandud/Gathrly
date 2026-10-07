const path = require('path');

/**
 * The sign-in code email, styled like the app: the teal logo and wordmark from
 * the welcome screen, and the code in a box like the verification screen's.
 *
 * Email clients ignore <style> blocks and SVG unevenly, so this is table
 * layout with inline styles, and the logo is a PNG attached inline (cid:)
 * rather than linked, which also works before the app has a website.
 */

const BRAND = {
  teal: '#0d9488',
  ink: '#171717',
  muted: '#605e5d',
  subtle: '#a0a0a0',
  page: '#f7fbfb',
  card: '#ffffff',
  border: '#e2e2e2',
  codeFill: '#f8f8f8',
  codeBorder: '#c7c7c7',
};

const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, Roboto, Helvetica, Arial, sans-serif";

const LOGO_CID = 'gathrly-logo';
const LOGO_PATH = path.join(__dirname, '../../assets/email/logo-mark.png');

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (ch) => `&#${ch.charCodeAt(0)};`);
}

/** Subject, plain text, HTML and the inline logo for a sign-in code. */
function renderOtpEmail({ code, minutes }) {
  const safeCode = escapeHtml(code);

  // The code stays in the subject so phones can offer to fill it in.
  const subject = `Your Gathrly verification code: ${code}`;

  const text = [
    `Your Gathrly verification code is ${code}.`,
    '',
    `Enter it in the app to sign in. It expires in ${minutes} minutes.`,
    '',
    "If you didn't try to sign in to Gathrly, you can ignore this email.",
  ].join('\n');

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${subject}</title>
</head>
<body style="margin:0;padding:0;background-color:${BRAND.page};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">Your code is ${safeCode}. It expires in ${minutes} minutes.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${BRAND.page};">
  <tr>
    <td align="center" style="padding:40px 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:480px;">
        <tr>
          <td style="padding:0 4px 20px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="vertical-align:middle;padding-right:8px;">
                  <img src="cid:${LOGO_CID}" width="23" height="22" alt="" style="display:block;border:0;">
                </td>
                <td style="vertical-align:middle;font-family:${FONT};font-size:22px;line-height:28px;font-weight:700;letter-spacing:-0.55px;color:${BRAND.teal};">Gathrly</td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="background-color:${BRAND.card};border:1px solid ${BRAND.border};border-radius:16px;padding:32px 28px;">
            <h1 style="margin:0 0 12px;font-family:${FONT};font-size:20px;line-height:25px;font-weight:700;color:${BRAND.ink};">Your verification code</h1>
            <p style="margin:0 0 24px;font-family:${FONT};font-size:14px;line-height:21px;color:${BRAND.muted};">Enter this code in the Gathrly app to finish signing in.</p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <!-- The extra left padding balances the letter-spacing after the last digit. -->
                <td align="center" style="background-color:${BRAND.codeFill};border:1px solid ${BRAND.codeBorder};border-radius:9px;padding:18px 12px 18px 22px;font-family:${FONT};font-size:32px;line-height:38px;font-weight:700;letter-spacing:10px;color:${BRAND.ink};">${safeCode}</td>
              </tr>
            </table>
            <p style="margin:16px 0 0;font-family:${FONT};font-size:13px;line-height:20px;color:${BRAND.muted};">This code expires in ${minutes} minutes.</p>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 4px 0;font-family:${FONT};font-size:12px;line-height:18px;color:${BRAND.subtle};">If you didn't try to sign in to Gathrly, you can ignore this email. Someone may have typed your address by mistake.</td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;

  const attachments = [{ filename: 'gathrly.png', path: LOGO_PATH, cid: LOGO_CID }];

  return { subject, text, html, attachments };
}

module.exports = { renderOtpEmail, LOGO_PATH };
