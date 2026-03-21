const cron = require('node-cron');
const { query } = require('../db');
const { sendMorningEmail } = require('./email');

/**
 * Run the morning email job: fetch all users with profiles and send.
 */
async function runMorningEmailJob() {
  console.log('[cron] Running morning email job...');

  try {
    const result = await query(
      `SELECT
         u.id, u.email, u.timezone, u.created_at,
         p.age, p.hobbies, p.position, p.goal_5yr, p.goal_10yr,
         p.main_goal, p.about_me
       FROM users u
       INNER JOIN profiles p ON p.user_id = u.id
       ORDER BY u.created_at`
    );

    const users = result.rows.map((row) => ({
      id: row.id,
      email: row.email,
      timezone: row.timezone,
      created_at: row.created_at,
    }));

    const profiles = result.rows.reduce((acc, row) => {
      acc[row.id] = {
        age: row.age,
        hobbies: row.hobbies,
        position: row.position,
        goal_5yr: row.goal_5yr,
        goal_10yr: row.goal_10yr,
        main_goal: row.main_goal,
        about_me: row.about_me,
      };
      return acc;
    }, {});

    let sent = 0;
    let failed = 0;

    for (const user of users) {
      const profile = profiles[user.id] || null;
      const result = await sendMorningEmail(user, profile);
      if (result.sent) sent++;
      else failed++;
    }

    console.log(`[cron] Done. Sent: ${sent}, Failed: ${failed}`);
    return { sent, failed, total: users.length };
  } catch (err) {
    console.error('[cron] Morning email job error:', err);
    throw err;
  }
}

/**
 * Start the cron job. Runs daily at 5:30 AM (server timezone).
 * Override with CRON_SCHEDULE env var (e.g. "30 5 * * *" for 5:30 AM).
 */
function startMorningCron() {
  const schedule = process.env.CRON_SCHEDULE || '30 5 * * *';
  cron.schedule(schedule, runMorningEmailJob);
  console.log(`[cron] Morning email scheduled: ${schedule} (5:30 AM daily)`);
}

module.exports = { runMorningEmailJob, startMorningCron };
