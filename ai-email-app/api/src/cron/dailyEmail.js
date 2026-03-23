const cron = require('node-cron');
const { query } = require('../db');
const { generateLesson } = require('../services/contentGenerator');
const { fetchMorningNewsPool, fetchNews, selectArticlesForUser } = require('../services/newsFetcher');
const { summarizeArticlesAsBullets } = require('../services/newsSummarizer');
const { sendDailyEmail } = require('../services/emailSender');

/** @type {{ scheduled: boolean, schedule: string, timezone: string, lastRunStartedAt: string|null, lastRunFinishedAt: string|null, lastRunError: string|null }} */
const cronStatus = {
  scheduled: false,
  schedule: '',
  timezone: '',
  lastRunStartedAt: null,
  lastRunFinishedAt: null,
  lastRunError: null,
};

function getCronStatus() {
  return { ...cronStatus };
}

function displayNameFromEmail(email) {
  if (!email || !email.includes('@')) return 'there';
  const local = email.split('@')[0];
  const cleaned = local.replace(/[._-]+/g, ' ').trim();
  if (!cleaned) return 'there';
  return cleaned.split(/\s+/).map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

/**
 * @param {Object} user - full row with profile fields joined
 * @param {Array<object>} newsPool - shared articles from NewsAPI (may be empty)
 */
async function processUser(user, newsPool) {
  console.log(`[daily-email] Processing user ${user.email}...`);

  try {
    const articles =
      newsPool.length > 0
        ? selectArticlesForUser(newsPool, user, 5)
        : await fetchNews(user);

    const language = user.language || 'en';
    const newsItems = await summarizeArticlesAsBullets(articles, language);
    const lesson = await generateLesson(user);
    const displayName = displayNameFromEmail(user.email);

    await sendDailyEmail({
      toEmail: user.email,
      displayName,
      userId: user.id,
      lesson,
      newsItems,
      language,
    });

    const contentHash = Buffer.from(lesson.slice(0, 100)).toString('base64');
    await query(
      `INSERT INTO email_logs (user_id, subject, content_hash) VALUES ($1, $2, $3)`,
      [user.id, `6amreads — ${new Date().toDateString()}`, contentHash]
    );

    console.log(`[daily-email] ✓ Sent to ${user.email}`);
    return true;
  } catch (err) {
    console.error(`[daily-email] ✗ Failed for ${user.email}:`, err.message);
    return false;
  }
}

/**
 * Run the full daily email pipeline for eligible users (onboarded, not paused).
 */
async function runDailyEmailJob() {
  console.log('[daily-email] Starting daily email job...');

  try {
    const newsPool = await fetchMorningNewsPool();
    console.log(`[daily-email] News pool: ${newsPool.length} article(s) from NewsAPI.`);

    const result = await query(`
      SELECT
        u.id, u.email, u.timezone, u.delivery_hour, u.language,
        p.age, p.hobbies, p.position,
        p.goal_5yr, p.goal_10yr, p.main_goal,
        p.about_me, p.feedback_prefs
      FROM users u
      INNER JOIN profiles p ON p.user_id = u.id
      WHERE p.age IS NOT NULL AND p.main_goal IS NOT NULL
        AND COALESCE(u.paused, false) = false
    `);

    const users = result.rows;
    console.log(`[daily-email] Found ${users.length} user(s) to email.`);

    let sent = 0;
    let failed = 0;
    for (const user of users) {
      const ok = await processUser(user, newsPool);
      if (ok) sent++;
      else failed++;
      await new Promise((r) => setTimeout(r, 1000));
    }

    console.log('[daily-email] Job complete.');
    return { sent, failed, total: users.length };
  } catch (err) {
    console.error('[daily-email] Job failed:', err);
    throw err;
  }
}

/**
 * Schedule: default 5:30 AM daily (override CRON_SCHEDULE + CRON_TIMEZONE).
 */
function scheduleDailyEmail() {
  const schedule = process.env.CRON_SCHEDULE || '30 5 * * *';
  const timezone = process.env.CRON_TIMEZONE || 'America/Chicago';

  cronStatus.schedule = schedule;
  cronStatus.timezone = timezone;

  console.log(`[daily-email] Scheduled: "${schedule}" (${timezone})`);

  cron.schedule(
    schedule,
    async () => {
      cronStatus.lastRunStartedAt = new Date().toISOString();
      cronStatus.lastRunError = null;
      try {
        await runDailyEmailJob();
      } catch (err) {
        cronStatus.lastRunError = err.message || String(err);
      } finally {
        cronStatus.lastRunFinishedAt = new Date().toISOString();
      }
    },
    { timezone }
  );

  cronStatus.scheduled = true;
}

module.exports = { scheduleDailyEmail, runDailyEmailJob, getCronStatus };
