const { query } = require('../db');
const { verifyFeedbackSignature } = require('../lib/emailFeedbackCrypto');

/**
 * GET /public/email-feedback?u=<userId>&c=more|less&s=<hmac>
 */
async function handleEmailFeedback(req, res) {
  const userId = req.query.u;
  const choice = req.query.c;
  const sig = req.query.s;
  const dayYmd = new Date().toISOString().slice(0, 10);

  if (!userId || !choice || !sig) {
    return res.status(400).send(htmlPage('Invalid link', 'This feedback link is incomplete.'));
  }
  if (choice !== 'more' && choice !== 'less') {
    return res.status(400).send(htmlPage('Invalid option', 'Unknown feedback type.'));
  }
  if (!verifyFeedbackSignature(userId, choice, dayYmd, sig)) {
    return res
      .status(403)
      .send(
        htmlPage(
          'Link expired',
          'This link is only valid on the day the email was sent. Open today’s edition or use your dashboard.'
        )
      );
  }

  try {
    const line =
      choice === 'more'
        ? `[Email ${dayYmd}] One-tap: More content like today’s edition.`
        : `[Email ${dayYmd}] One-tap: Less content like today’s edition.`;

    const upd = await query(
      `UPDATE profiles
       SET feedback_prefs = CASE
         WHEN feedback_prefs IS NULL OR feedback_prefs = '' THEN $2
         ELSE feedback_prefs || E'\n' || $2
       END,
       updated_at = NOW()
       WHERE user_id = $1`,
      [userId, line]
    );

    if (upd.rowCount === 0) {
      return res
        .status(404)
        .send(
          htmlPage(
            'Profile not found',
            'We could not find a reader profile for this account. Complete onboarding on 6amreads.com first.'
          )
        );
    }

    const appUrl = process.env.APP_URL || 'https://6amreads.com';
    return res
      .status(200)
      .send(
        htmlPage(
          'Thanks — noted for tomorrow',
          'We’ll use this to tune your next morning paper.',
          `<p style="margin:24px 0 0;"><a href="${escapeAttr(appUrl)}/dashboard" style="color:#8b6914;">Open your dashboard →</a></p>`
        )
      );
  } catch (err) {
    console.error('[email-feedback]', err);
    return res.status(500).send(htmlPage('Something went wrong', 'Please try again from your latest email.'));
  }
}

function escapeAttr(s) {
  return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

function htmlPage(title, message, extraHtml = '') {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>${escapeAttr(title)} — 6amreads</title>
  <style>
    body { font-family: Georgia, 'Times New Roman', serif; background:#fdfbf7; color:#1a1510; margin:0; min-height:100vh; display:flex; align-items:center; justify-content:center; padding:24px; }
    .card { max-width:420px; background:#fff; border:1px solid #e0d4bc; border-radius:16px; padding:32px; box-shadow:0 12px 40px rgba(26,21,16,.08); text-align:center; }
    h1 { font-size:1.35rem; margin:0 0 12px; }
    p { margin:0; color:#3d3429; line-height:1.6; font-size:1rem; }
    .mark { font-family: system-ui, sans-serif; font-weight:600; letter-spacing:-0.02em; margin-bottom:20px; display:block; color:#1a1510; }
  </style>
</head>
<body>
  <div class="card">
    <span class="mark">6am<span style="color:#8b6914;">reads</span></span>
    <h1>${escapeAttr(title)}</h1>
    <p style="margin-top:12px;">${escapeAttr(message)}</p>
    ${extraHtml}
  </div>
</body>
</html>`;
}

module.exports = { handleEmailFeedback };
