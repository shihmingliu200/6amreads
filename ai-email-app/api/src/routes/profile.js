const express = require('express');
const { query } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

/**
 * POST /profile/onboarding
 * Body: { age, hobbies, position, goal_5yr, goal_10yr, main_goal, about_me }
 */
router.post('/onboarding', requireAuth, async (req, res) => {
  const { age, hobbies, position, goal_5yr, goal_10yr, main_goal, about_me } = req.body;
  const userId = req.user.id;

  if (!age || !hobbies || !position || !goal_5yr || !goal_10yr || !main_goal || !about_me) {
    return res.status(400).json({ error: 'All 7 onboarding fields are required.' });
  }
  if (typeof age !== 'number' || age < 1 || age > 120) {
    return res.status(400).json({ error: 'Age must be a valid number.' });
  }

  try {
    const result = await query(
      `INSERT INTO profiles (user_id, age, hobbies, position, goal_5yr, goal_10yr, main_goal, about_me, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
       ON CONFLICT (user_id)
       DO UPDATE SET
         age = EXCLUDED.age,
         hobbies = EXCLUDED.hobbies,
         position = EXCLUDED.position,
         goal_5yr = EXCLUDED.goal_5yr,
         goal_10yr = EXCLUDED.goal_10yr,
         main_goal = EXCLUDED.main_goal,
         about_me = EXCLUDED.about_me,
         updated_at = NOW()
       RETURNING *`,
      [userId, age, hobbies, position, goal_5yr, goal_10yr, main_goal, about_me]
    );

    return res.status(200).json({ profile: result.rows[0] });
  } catch (err) {
    console.error('Onboarding error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

/**
 * GET /profile
 */
router.get('/', requireAuth, async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await query(
      `SELECT
         u.id, u.email, u.timezone, u.created_at, u.paused, u.delivery_hour,
         p.age, p.hobbies, p.position, p.goal_5yr, p.goal_10yr,
         p.main_goal, p.about_me, p.feedback_prefs, p.updated_at AS profile_updated_at
       FROM users u
       LEFT JOIN profiles p ON p.user_id = u.id
       WHERE u.id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    return res.status(200).json({ profile: result.rows[0] });
  } catch (err) {
    console.error('Get profile error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

/**
 * PATCH /profile
 * Partial update: user prefs + profile fields + feedback_prefs
 */
router.patch('/', requireAuth, async (req, res) => {
  const userId = req.user.id;
  const {
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
    feedback_more,
    feedback_less,
  } = req.body;

  try {
    const userFields = [];
    const userValues = [];
    let i = 1;

    if (timezone !== undefined) {
      userFields.push(`timezone = $${i++}`);
      userValues.push(String(timezone));
    }
    if (paused !== undefined) {
      userFields.push(`paused = $${i++}`);
      userValues.push(Boolean(paused));
    }
    if (delivery_hour !== undefined) {
      const h = Number(delivery_hour);
      if (!Number.isInteger(h) || h < 0 || h > 23) {
        return res.status(400).json({ error: 'delivery_hour must be an integer 0–23.' });
      }
      userFields.push(`delivery_hour = $${i++}`);
      userValues.push(h);
    }

    if (userFields.length > 0) {
      userValues.push(userId);
      await query(`UPDATE users SET ${userFields.join(', ')} WHERE id = $${i}`, userValues);
    }

    let feedbackMerged;
    if (feedback_more !== undefined || feedback_less !== undefined) {
      const parts = [];
      if (feedback_more != null && String(feedback_more).trim()) {
        parts.push(`More: ${String(feedback_more).trim()}`);
      }
      if (feedback_less != null && String(feedback_less).trim()) {
        parts.push(`Less: ${String(feedback_less).trim()}`);
      }
      feedbackMerged = parts.length ? parts.join(' · ') : undefined;
    } else if (feedback_prefs !== undefined) {
      feedbackMerged = feedback_prefs;
    }

    const profileFields = [];
    const profileValues = [];
    let j = 1;

    const setText = (col, val) => {
      if (val !== undefined) {
        profileFields.push(`${col} = $${j++}`);
        profileValues.push(val);
      }
    };

    if (age !== undefined) {
      const a = Number(age);
      if (!Number.isFinite(a) || a < 1 || a > 120) {
        return res.status(400).json({ error: 'Age must be between 1 and 120.' });
      }
      profileFields.push(`age = $${j++}`);
      profileValues.push(a);
    }
    setText('hobbies', hobbies);
    setText('position', position);
    setText('goal_5yr', goal_5yr);
    setText('goal_10yr', goal_10yr);
    setText('main_goal', main_goal);
    setText('about_me', about_me);
    if (feedbackMerged !== undefined) {
      profileFields.push(`feedback_prefs = $${j++}`);
      profileValues.push(feedbackMerged === '' ? null : feedbackMerged);
    }

    if (profileFields.length > 0) {
      profileFields.push('updated_at = NOW()');
      profileValues.push(userId);
      const up = await query(
        `UPDATE profiles SET ${profileFields.join(', ')} WHERE user_id = $${j} RETURNING *`,
        profileValues
      );
      if (up.rowCount === 0) {
        return res.status(400).json({ error: 'Complete onboarding before editing profile answers.' });
      }
    }

    const result = await query(
      `SELECT
         u.id, u.email, u.timezone, u.created_at, u.paused, u.delivery_hour,
         p.age, p.hobbies, p.position, p.goal_5yr, p.goal_10yr,
         p.main_goal, p.about_me, p.feedback_prefs, p.updated_at AS profile_updated_at
       FROM users u
       LEFT JOIN profiles p ON p.user_id = u.id
       WHERE u.id = $1`,
      [userId]
    );

    return res.status(200).json({ profile: result.rows[0] });
  } catch (err) {
    console.error('Patch profile error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
