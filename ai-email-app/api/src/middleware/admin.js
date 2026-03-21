/**
 * Admin authentication middleware.
 * Expects: X-Admin-Key: <ADMIN_SECRET>
 * On success: continues
 * On failure: returns 401
 */
function requireAdmin(req, res, next) {
  const key = req.headers['x-admin-key'];
  const secret = process.env.ADMIN_SECRET;

  if (!secret) {
    return res.status(500).json({ error: 'Admin not configured. Set ADMIN_SECRET in .env' });
  }
  if (!key || key !== secret) {
    return res.status(401).json({ error: 'Invalid or missing admin key.' });
  }

  next();
}

module.exports = { requireAdmin };
