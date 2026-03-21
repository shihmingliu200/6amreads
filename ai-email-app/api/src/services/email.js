const sgMail = require('@sendgrid/mail');
const crypto = require('crypto');
const { query } = require('../db');

const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@example.com';
const FROM_NAME = process.env.FROM_NAME || 'Morning Paper';

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

/**
 * Build HTML email for a user's morning digest.
 * Uses profile for personalization; AI lesson and news are placeholders until configured.
 */
function buildMorningEmail(user, profile) {
  const name = user.email.split('@')[0];
  const lesson = profile?.main_goal
    ? `Today's focus: ${profile.main_goal}. Keep taking small steps—progress compounds over time.`
    : 'Your personalized lesson will appear here once you complete onboarding.';
  const news = 'News section: Configure NewsAPI.org in .env to fetch real-world headlines.';
  const feedbackUrl = `${process.env.APP_URL || 'http://localhost:3000'}/feedback`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Morning Paper</title>
</head>
<body style="margin:0;font-family:Georgia,serif;background:#f5ebe0;padding:24px">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06)">
    <div style="background:linear-gradient(135deg,#2c1810,#3d2914);color:#fff;padding:32px 24px;text-align:center">
      <h1 style="margin:0;font-size:1.5rem">☀️ Your Morning Paper</h1>
      <p style="margin:8px 0 0;opacity:0.9;font-size:0.95rem">Good morning, ${name}.</p>
    </div>
    <div style="padding:32px 24px;color:#2c1810;line-height:1.7">
      <h2 style="font-size:1.1rem;margin:0 0 12px;border-bottom:1px solid #eee;padding-bottom:8px">📚 Today's Lesson</h2>
      <p style="margin:0 0 24px">${lesson}</p>
      <h2 style="font-size:1.1rem;margin:0 0 12px;border-bottom:1px solid #eee;padding-bottom:8px">📰 World News</h2>
      <p style="margin:0 0 24px">${news}</p>
      <h2 style="font-size:1.1rem;margin:0 0 12px;border-bottom:1px solid #eee;padding-bottom:8px">💬 Feedback</h2>
      <p style="margin:0 0 8px">What would you like more of tomorrow?</p>
      <a href="${feedbackUrl}" style="display:inline-block;background:#2c1810;color:#fff;padding:10px 20px;text-decoration:none;border-radius:8px;font-size:0.9rem">Share feedback →</a>
    </div>
    <div style="padding:16px 24px;background:#faf8f5;font-size:0.8rem;color:#6b5344">
      <p style="margin:0">Sources: Configure AI + News APIs for full content.</p>
      <p style="margin:8px 0 0">© Morning Paper · Unsubscribe in settings</p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Send morning email to a user and log it.
 */
async function sendMorningEmail(user, profile) {
  if (!process.env.SENDGRID_API_KEY) {
    console.warn('[email] SENDGRID_API_KEY not set. Skipping send.');
    return { sent: false, reason: 'SendGrid not configured' };
  }

  const html = buildMorningEmail(user, profile);
  const subject = `☀️ Your Morning Paper — ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}`;
  const contentHash = crypto.createHash('sha256').update(html).digest('hex');

  try {
    await sgMail.send({
      to: user.email,
      from: { email: FROM_EMAIL, name: FROM_NAME },
      subject,
      html,
    });

    await query(
      'INSERT INTO email_logs (user_id, subject, content_hash) VALUES ($1, $2, $3)',
      [user.id, subject, contentHash]
    );

    return { sent: true };
  } catch (err) {
    console.error('[email] Send failed for', user.email, err.message);
    return { sent: false, reason: err.message };
  }
}

module.exports = { buildMorningEmail, sendMorningEmail };
