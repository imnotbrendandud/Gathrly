/**
 * Send a test authentication email to prove SMTP is wired up.
 *
 *   npm run mail:test -- you@example.com
 */
const { sendOtpEmail, verifyTransport } = require('../lib/mailer');

async function main() {
  const to = process.argv[2];
  if (!to || !to.includes('@')) {
    console.error('usage: npm run mail:test -- you@example.com');
    process.exit(1);
  }

  const ok = await verifyTransport();
  if (!ok) {
    console.error('SMTP is not configured or failed to verify - see the message above.');
    process.exit(1);
  }

  await sendOtpEmail(to, '123456');
  console.log(`Test code sent to ${to}. Check the inbox (and the spam folder).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
