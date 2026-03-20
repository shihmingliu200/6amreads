const express = require('express');
const { query } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

/**
 * POST /profile/onboarding
 * Auth required.
 * Body: { age, hobbies, position, goal_5yr, goal_10yr, main_goal, about_me }
 * Returns: saved profile
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
 * Auth required.
 * Returns: user info + profile answers
 */
router.get('/', requireAuth, async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await query(
      `SELECT
         u.id, u.email, u.timezone, u.created_at,
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

module.exports = router;
