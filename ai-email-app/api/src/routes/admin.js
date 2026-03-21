const express = require('express');
const { query } = require('../db');
const { requireAdmin } = require('../middleware/admin');
const { runDailyEmailJob, getCronStatus } = require('../cron/dailyEmail');

const router = express.Router();

router.use(requireAdmin);

/**
 * GET /admin/members
 */
router.get('/members', async (req, res) => {
  try {
    const result = await query(
      `SELECT
         u.id, u.email, u.timezone, u.created_at, u.paused, u.delivery_hour, u.google_sub,
         p.age, p.hobbies, p.position, p.goal_5yr, p.goal_10yr,
         p.main_goal, p.about_me, p.updated_at AS profile_updated_at
       FROM users u
       LEFT JOIN profiles p ON p.user_id = u.id
       ORDER BY u.created_at DESC`
    );

    return res.status(200).json({ members: result.rows });
  } catch (err) {
    console.error('Admin members error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

/**
 * GET /admin/members/:id
 */
router.get('/members/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const userResult = await query(
      `SELECT
         u.id, u.email, u.timezone, u.created_at, u.paused, u.delivery_hour, u.google_sub,
         p.age, p.hobbies, p.position, p.goal_5yr, p.goal_10yr,
         p.main_goal, p.about_me, p.feedback_prefs, p.updated_at AS profile_updated_at
       FROM users u
       LEFT JOIN profiles p ON p.user_id = u.id
       WHERE u.id = $1`,
      [id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Member not found.' });
    }

    const emailResult = await query(
      `SELECT id, sent_at, subject, content_hash, opened_at, clicked_at
       FROM email_logs
       WHERE user_id = $1
       ORDER BY sent_at DESC
       LIMIT 50`,
      [id]
    );

    return res.status(200).json({
      member: userResult.rows[0],
      emailLogs: emailResult.rows,
    });
  } catch (err) {
    console.error('Admin member detail error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

/**
 * PATCH /admin/members/:id
 */
router.patch('/members/:id', async (req, res) => {
  const { id } = req.params;
  const {
    email,
    timezone,
    paused,
    delivery_hour,
    age,
    hobbies,
    position,
    goal_5yr,
    goal_10yr,
    main_goal,
    about_me,
    feedback_prefs,
  } = req.body;

  try {
    const exists = await query('SELECT id FROM users WHERE id = $1', [id]);
    if (exists.rows.length === 0) {
      return res.status(404).json({ error: 'Member not found.' });
    }

    const userFields = [];
    const userVals = [];
    let i = 1;

    if (email !== undefined) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))) {
        return res.status(400).json({ error: 'Invalid email.' });
      }
      userFields.push(`email = $${i++}`);
      userVals.push(String(email).toLowerCase());
    }
    if (timezone !== undefined) {
      userFields.push(`timezone = $${i++}`);
      userVals.push(String(timezone));
    }
    if (paused !== undefined) {
      userFields.push(`paused = $${i++}`);
      userVals.push(Boolean(paused));
    }
    if (delivery_hour !== undefined) {
      const h = Number(delivery_hour);
      if (!Number.isInteger(h) || h < 0 || h > 23) {
        return res.status(400).json({ error: 'delivery_hour must be 0–23.' });
      }
      userFields.push(`delivery_hour = $${i++}`);
      userVals.push(h);
    }

    if (userFields.length > 0) {
      userVals.push(id);
      await query(`UPDATE users SET ${userFields.join(', ')} WHERE id = $${i}`, userVals);
    }

    const pFields = [];
    const pVals = [];
    let j = 1;

    const add = (col, val) => {
      if (val !== undefined) {
        pFields.push(`${col} = $${j++}`);
        pVals.push(val);
      }
    };

    if (age !== undefined) {
      const a = Number(age);
      if (!Number.isFinite(a) || a < 1 || a > 120) {
        return res.status(400).json({ error: 'Invalid age.' });
      }
      add('age', a);
    }
    add('hobbies', hobbies);
    add('position', position);
    add('goal_5yr', goal_5yr);
    add('goal_10yr', goal_10yr);
    add('main_goal', main_goal);
    add('about_me', about_me);
    add('feedback_prefs', feedback_prefs);

    if (pFields.length > 0) {
      pFields.push('updated_at = NOW()');
      pVals.push(id);
      const up = await query(
        `UPDATE profiles SET ${pFields.join(', ')} WHERE user_id = $${j} RETURNING *`,
        pVals
      );
      if (up.rowCount === 0 && Object.keys(req.body).some((k) =>
        ['age', 'hobbies', 'position', 'goal_5yr', 'goal_10yr', 'main_goal', 'about_me', 'feedback_prefs'].includes(k)
      )) {
        return res.status(400).json({ error: 'No profile row for this user; cannot update answers.' });
      }
    }

    const userResult = await query(
      `SELECT
         u.id, u.email, u.timezone, u.created_at, u.paused, u.delivery_hour, u.google_sub,
         p.age, p.hobbies, p.position, p.goal_5yr, p.goal_10yr,
         p.main_goal, p.about_me, p.feedback_prefs, p.updated_at AS profile_updated_at
       FROM users u
       LEFT JOIN profiles p ON p.user_id = u.id
       WHERE u.id = $1`,
      [id]
    );

    return res.status(200).json({ member: userResult.rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Email already in use.' });
    }
    console.error('Admin patch member error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

/**
 * DELETE /admin/members/:id
 */
router.delete('/members/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const del = await query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
    if (del.rowCount === 0) {
      return res.status(404).json({ error: 'Member not found.' });
    }
    return res.status(200).json({ deleted: true, id: del.rows[0].id });
  } catch (err) {
    console.error('Admin delete member error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

/**
 * GET /admin/stats
 */
router.get('/stats', async (req, res) => {
  try {
    const [
      users,
      profiles,
      emails,
      emailsToday,
      opened,
    ] = await Promise.all([
      query('SELECT COUNT(*) AS count FROM users'),
      query('SELECT COUNT(*) AS count FROM profiles'),
      query('SELECT COUNT(*) AS count FROM email_logs'),
      query(
        `SELECT COUNT(*) AS count FROM email_logs
         WHERE (sent_at AT TIME ZONE 'UTC')::date = (NOW() AT TIME ZONE 'UTC')::date`
      ),
      query('SELECT COUNT(*) AS count FROM email_logs WHERE opened_at IS NOT NULL'),
    ]);

    const totalEmailsSent = parseInt(emails.rows[0].count, 10);
    const openedCount = parseInt(opened.rows[0].count, 10);

    return res.status(200).json({
      totalUsers: parseInt(users.rows[0].count, 10),
      totalProfiles: parseInt(profiles.rows[0].count, 10),
      totalEmailsSent,
      emailsSentToday: parseInt(emailsToday.rows[0].count, 10),
      emailsOpened: openedCount,
      openRate: totalEmailsSent > 0 ? Math.round((openedCount / totalEmailsSent) * 1000) / 1000 : null,
      revenue: {
        mrrCents: 0,
        payingSubscribers: 0,
        note: 'Placeholder for future paid plans',
      },
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

/**
 * GET /admin/status — cron + last send
 */
router.get('/status', async (req, res) => {
  try {
    const last = await query(
      'SELECT MAX(sent_at) AS last_sent FROM email_logs'
    );
    const cron = getCronStatus();
    return res.status(200).json({
      cron: {
        scheduled: cron.scheduled,
        schedule: cron.schedule,
        timezone: cron.timezone,
        lastRunStartedAt: cron.lastRunStartedAt,
        lastRunFinishedAt: cron.lastRunFinishedAt,
        lastRunError: cron.lastRunError,
      },
      lastEmailSentAt: last.rows[0]?.last_sent || null,
    });
  } catch (err) {
    console.error('Admin status error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

/**
 * POST /admin/trigger-emails
 */
router.post('/trigger-emails', async (req, res) => {
  try {
    const result = await runDailyEmailJob();
    return res.status(200).json(result);
  } catch (err) {
    console.error('Admin trigger-emails error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error.' });
  }
});

module.exports = router;
