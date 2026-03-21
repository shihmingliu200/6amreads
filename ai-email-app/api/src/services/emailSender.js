const https = require('https');
const { feedbackSignature } = require('../lib/emailFeedbackCrypto');

/**
 * @typedef {Object} NewsItemEmail
 * @property {string} title
 * @property {string} url
 * @property {string} source
 * @property {string[]} bullets
 */

/**
 * Send the 6amreads morning email via SendGrid.
 * @param {Object} opts
 * @param {string} opts.toEmail
 * @param {string} opts.displayName - First name or local part of email
 * @param {string} opts.userId - UUID for feedback links
 * @param {string} opts.lesson - Plain text lesson (paragraphs separated by newlines)
 * @param {NewsItemEmail[]} opts.newsItems
 */
async function sendDailyEmail(opts) {
  const { toEmail, displayName, userId, lesson, newsItems } = opts;

  const subject = `6amreads — ${formatDate()}`;
  const html = buildEmailHtml({ displayName, userId, lesson, newsItems });
  const text = buildEmailText({ displayName, lesson, newsItems });

  const body = JSON.stringify({
    personalizations: [{ to: [{ email: toEmail }] }],
    from: {
      email: process.env.SENDGRID_FROM_EMAIL,
      name: process.env.SENDGRID_FROM_NAME || '6amreads',
    },
    subject,
    content: [
      { type: 'text/plain', value: text },
      { type: 'text/html', value: html },
    ],
  });

  if (!process.env.SENDGRID_API_KEY) {
    throw new Error('SENDGRID_API_KEY not configured');
  }
  if (!process.env.SENDGRID_FROM_EMAIL) {
    throw new Error('SENDGRID_FROM_EMAIL not configured');
  }

  return new Promise((resolve, reject) => {
    const reqOptions = {
      hostname: 'api.sendgrid.com',
      path: '/v3/mail/send',
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(reqOptions, (res) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        resolve();
      } else {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => reject(new Error(`SendGrid error ${res.statusCode}: ${data}`)));
      }
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function publicApiBase() {
  return (
    process.env.PUBLIC_API_URL ||
    process.env.API_PUBLIC_URL ||
    `http://localhost:${process.env.PORT || 3001}`
  );
}

function feedbackUrl(userId, choice) {
  const dayYmd = new Date().toISOString().slice(0, 10);
  const s = feedbackSignature(userId, choice, dayYmd);
  const base = publicApiBase().replace(/\/$/, '');
  const q = new URLSearchParams({ u: userId, c: choice, s });
  return `${base}/public/email-feedback?${q}`;
}

function formatDate() {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

function logoBlock() {
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
    <tr>
      <td style="background:linear-gradient(135deg,#2c2419,#1a1510); padding:28px 24px; text-align:center; border-radius:12px 12px 0 0;">
        <div style="font-family:Georgia,serif; font-size:26px; font-weight:600; color:#fdfbf7; letter-spacing:-0.02em;">
          6am<span style="font-weight:400; opacity:0.9;">reads</span><span style="font-family:system-ui,sans-serif; font-size:14px; font-weight:400; opacity:0.75;">.com</span>
        </div>
        <p style="margin:10px 0 0; font-family:system-ui,sans-serif; font-size:12px; color:#e0d4bc; letter-spacing:0.12em; text-transform:uppercase;">Your personalized morning newspaper</p>
      </td>
    </tr>
  </table>`;
}

function buildEmailHtml({ displayName, userId, lesson, newsItems }) {
  const name = escapeHtml(displayName || 'there');
  const lessonHtml = escapeHtml(lesson)
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p style="margin:0 0 16px; line-height:1.75; font-size:16px; color:#2c2419;">${p}</p>`)
    .join('');

  const newsBlocks = (newsItems || []).map((item, idx) => {
    const bullets = (item.bullets || []).map(
      (b) =>
        `<li style="margin:0 0 8px; line-height:1.6; font-size:15px; color:#3d3429;">${escapeHtml(b)}</li>`
    );
    return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse; margin-bottom:24px;">
      <tr>
        <td style="padding-bottom:8px;">
          <a href="${escapeAttr(item.url)}" style="font-family:Georgia,serif; font-size:17px; font-weight:600; color:#1a1510; text-decoration:none;">
            ${escapeHtml(item.title)}
          </a>
          <span style="font-family:system-ui,sans-serif; font-size:12px; color:#8b7355; margin-left:8px;">${escapeHtml(item.source)}</span>
        </td>
      </tr>
      <tr>
        <td>
          <ul style="margin:0; padding-left:20px;">${bullets.join('')}</ul>
        </td>
      </tr>
      <tr>
        <td style="padding-top:8px;">
          <a href="${escapeAttr(item.url)}" style="font-family:system-ui,sans-serif; font-size:13px; color:#8b6914;">Read full article →</a>
        </td>
      </tr>
    </table>
    ${idx < newsItems.length - 1 ? '<div style="height:1px; background:#e8dfc8; margin:8px 0 20px;"></div>' : ''}`;
  });

  const sourcesList = (newsItems || [])
    .map(
      (item) =>
        `<li style="margin:0 0 8px; font-size:13px; line-height:1.5;"><a href="${escapeAttr(item.url)}" style="color:#5c4d3d;">${escapeHtml(item.title)}</a> — ${escapeHtml(item.source)}</li>`
    )
    .join('');

  const moreUrl = userId ? feedbackUrl(userId, 'more') : '#';
  const lessUrl = userId ? feedbackUrl(userId, 'less') : '#';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <meta http-equiv="x-ua-compatible" content="ie=edge"/>
  <title>6amreads</title>
</head>
<body style="margin:0; padding:0; background-color:#f0ebe3; font-family:Georgia, 'Times New Roman', serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse; background-color:#f0ebe3; padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse; max-width:600px; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 24px rgba(26,21,16,0.08);">
          <tr>
            <td>${logoBlock()}</td>
          </tr>
          <tr>
            <td style="padding:28px 28px 8px; font-family:Georgia,serif;">
              <p style="margin:0; font-size:20px; color:#1a1510;">Good morning, ${name}</p>
              <p style="margin:8px 0 0; font-size:14px; color:#6b5c4d; font-family:system-ui,sans-serif;">${escapeHtml(formatDate())}</p>
            </td>
          </tr>

          <tr>
            <td style="padding:8px 28px 4px;">
              <div style="height:1px; background:linear-gradient(90deg, transparent, #d9cbb0, transparent);"></div>
            </td>
          </tr>

          <tr>
            <td style="padding:20px 28px 8px;">
              <p style="margin:0; font-family:system-ui,sans-serif; font-size:11px; font-weight:600; letter-spacing:0.14em; text-transform:uppercase; color:#8b6914;">Section 1 · Your daily lesson</p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 28px;">
              ${lessonHtml}
            </td>
          </tr>

          <tr>
            <td style="padding:0 28px;">
              <div style="height:1px; background:#ede4d3;"></div>
            </td>
          </tr>

          <tr>
            <td style="padding:24px 28px 8px;">
              <p style="margin:0; font-family:system-ui,sans-serif; font-size:11px; font-weight:600; letter-spacing:0.14em; text-transform:uppercase; color:#8b6914;">Section 2 · Today&apos;s news</p>
              <p style="margin:8px 0 0; font-size:14px; color:#5c4d3d; font-family:system-ui,sans-serif; line-height:1.5;">Neutral summaries tailored to your interests. Tap a headline to read the full story.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 28px;">
              ${newsBlocks.join('') || '<p style="color:#6b5c4d;">No headlines available this morning — we’ll be back tomorrow.</p>'}
            </td>
          </tr>

          <tr>
            <td style="padding:0 28px;">
              <div style="height:1px; background:#ede4d3;"></div>
            </td>
          </tr>

          <tr>
            <td style="padding:24px 28px;">
              <p style="margin:0; font-family:system-ui,sans-serif; font-size:11px; font-weight:600; letter-spacing:0.14em; text-transform:uppercase; color:#8b6914;">Section 3 · Shape tomorrow&apos;s paper</p>
              <p style="margin:10px 0 16px; font-size:14px; color:#3d3429; font-family:system-ui,sans-serif; line-height:1.55;">One tap — we&apos;ll fold this into your profile for the next edition.</p>
              <table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                <tr>
                  <td style="padding-right:12px;">
                    <a href="${escapeAttr(moreUrl)}" style="display:inline-block; background:#1a1510; color:#fdfbf7; font-family:system-ui,sans-serif; font-size:14px; font-weight:600; text-decoration:none; padding:12px 22px; border-radius:999px;">More like this</a>
                  </td>
                  <td>
                    <a href="${escapeAttr(lessUrl)}" style="display:inline-block; background:#fdfbf7; color:#1a1510; font-family:system-ui,sans-serif; font-size:14px; font-weight:600; text-decoration:none; padding:12px 22px; border-radius:999px; border:2px solid #1a1510;">Less like this</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:0 28px 32px;">
              <div style="background:#f7f0e6; border-radius:10px; padding:20px 22px; border:1px solid #e8dfc8;">
                <p style="margin:0; font-family:system-ui,sans-serif; font-size:11px; font-weight:600; letter-spacing:0.12em; text-transform:uppercase; color:#6b5c4d;">Section 4 · Sources</p>
                <ul style="margin:12px 0 0; padding-left:18px; color:#3d3429;">
                  ${sourcesList}
                  <li style="margin:0 0 8px; font-size:13px;">Personalized lesson generated with <a href="https://www.anthropic.com" style="color:#8b6914;">Anthropic Claude</a></li>
                  <li style="margin:0; font-size:13px;">Headlines via <a href="https://newsapi.org" style="color:#8b6914;">NewsAPI.org</a></li>
                </ul>
              </div>
            </td>
          </tr>

          <tr>
            <td style="padding:16px 28px 28px; text-align:center;">
              <p style="margin:0; font-size:12px; color:#9a8b7a; font-family:system-ui,sans-serif; line-height:1.6;">
                You receive 6amreads because you signed up at 6amreads.com.<br/>
                Prefer the web? Open your <a href="${escapeAttr(process.env.APP_URL || 'https://6amreads.com')}/dashboard" style="color:#8b6914;">dashboard</a>.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildEmailText({ displayName, lesson, newsItems }) {
  const name = displayName || 'there';
  let news = '';
  (newsItems || []).forEach((item, i) => {
    news += `\n${i + 1}. ${item.title} (${item.source})\n`;
    (item.bullets || []).forEach((b) => {
      news += `   • ${b}\n`;
    });
    news += `   ${item.url}\n`;
  });

  const sources = (newsItems || [])
    .map((item, i) => `${i + 1}. ${item.title} — ${item.source}\n   ${item.url}`)
    .join('\n');

  return `6AMREADS — ${formatDate()}
${'='.repeat(52)}

Good morning, ${name}

SECTION 1 — YOUR DAILY LESSON
${'-'.repeat(36)}
${lesson}

SECTION 2 — TODAY'S NEWS
${'-'.repeat(36)}
${news || '(No articles this morning.)'}

SECTION 3 — FEEDBACK
${'-'.repeat(36)}
Reply from the HTML email using "More like this" / "Less like this", or update preferences in your dashboard.

SECTION 4 — SOURCES
${'-'.repeat(36)}
${sources}
• Lesson: Anthropic Claude
• Headlines: NewsAPI.org
`;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeAttr(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');
}

module.exports = { sendDailyEmail };
