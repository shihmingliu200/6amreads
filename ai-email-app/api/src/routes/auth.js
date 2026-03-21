const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const { query } = require('../db');

const router = express.Router();

function signUserToken(user) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured');
  }
  return jwt.sign({ id: user.id, email: user.email }, secret, { expiresIn: '7d' });
}

/**
 * POST /auth/signup
 * Body: { email, password }
 * Returns: { token, user: { id, email } }
 */
router.post('/signup', async (req, res) => {
  const { email, password } = req.body;

  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ error: 'Server misconfiguration: JWT_SECRET is not set.' });
  }

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email address.' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  }

  try {
    // Check if email already exists
    const existing = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email',
      [email.toLowerCase(), passwordHash]
    );

    const user = result.rows[0];
    let token;
    try {
      token = signUserToken(user);
    } catch (e) {
      console.error('Signup token error:', e);
      return res.status(500).json({ error: 'Server misconfiguration.' });
    }

    return res.status(201).json({ token, user: { id: user.id, email: user.email } });
  } catch (err) {
    console.error('Signup error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

/**
 * POST /auth/login
 * Body: { email, password }
 * Returns: { token, user: { id, email } }
 */
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ error: 'Server misconfiguration: JWT_SECRET is not set.' });
  }

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const result = await query(
      'SELECT id, email, password_hash FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const user = result.rows[0];
    if (!user.password_hash) {
      return res.status(401).json({ error: 'This account uses Google sign-in.' });
    }
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    let token;
    try {
      token = signUserToken(user);
    } catch (e) {
      console.error('Login token error:', e);
      return res.status(500).json({ error: 'Server misconfiguration.' });
    }

    return res.status(200).json({ token, user: { id: user.id, email: user.email } });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

/**
 * POST /auth/google
 * Body: { credential } — Google ID token (JWT) from Sign-In button
 */
router.post('/google', async (req, res) => {
  const { credential } = req.body;
  const clientId = process.env.GOOGLE_CLIENT_ID;

  if (!credential) {
    return res.status(400).json({ error: 'Google credential is required.' });
  }
  if (!clientId) {
    return res.status(503).json({ error: 'Google sign-in is not configured on the server.' });
  }
  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ error: 'Server misconfiguration.' });
  }

  try {
    const client = new OAuth2Client(clientId);
    const ticket = await client.verifyIdToken({ idToken: credential, audience: clientId });
    const payload = ticket.getPayload();
    if (!payload?.email) {
      return res.status(401).json({ error: 'Google account did not return an email.' });
    }
    // Some Workspace accounts omit email_verified; reject only when Google explicitly says false.
    if (payload.email_verified === false) {
      return res.status(401).json({ error: 'Google account email is not verified.' });
    }

    const email = payload.email.toLowerCase();
    const sub = payload.sub;

    let userRow = await query('SELECT id, email, google_sub, password_hash FROM users WHERE google_sub = $1', [sub]);
    let user = userRow.rows[0];

    if (!user) {
      userRow = await query('SELECT id, email, google_sub, password_hash FROM users WHERE email = $1', [email]);
      user = userRow.rows[0];
      if (user) {
        if (user.google_sub && user.google_sub !== sub) {
          return res.status(409).json({ error: 'This email is linked to a different Google account.' });
        }
        await query('UPDATE users SET google_sub = $1 WHERE id = $2', [sub, user.id]);
        user.google_sub = sub;
      }
    }

    if (!user) {
      const ins = await query(
        'INSERT INTO users (email, password_hash, google_sub) VALUES ($1, NULL, $2) RETURNING id, email',
        [email, sub]
      );
      user = ins.rows[0];
    }

    let token;
    try {
      token = signUserToken(user);
    } catch (e) {
      console.error('Google token error:', e);
      return res.status(500).json({ error: 'Server misconfiguration.' });
    }
    return res.status(200).json({ token, user: { id: user.id, email: user.email } });
  } catch (err) {
    console.error('Google auth error:', err);
    return res.status(401).json({ error: 'Could not verify Google sign-in.' });
  }
});

module.exports = router;
