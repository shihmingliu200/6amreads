const { Pool } = require('pg');
require('dotenv').config();

const connString = process.env.DATABASE_URL;
const useSSL =
  connString &&
  (connString.includes('railway') || connString.includes('supabase.com'));

const pool = new Pool({
  connectionString: connString,
  ssl: useSSL ? { rejectUnauthorized: false } : false,
});

/**
 * Run a parameterized query.
 * @param {string} text - SQL query string
 * @param {Array} params - Query parameters
 * @returns {Promise<pg.QueryResult>}
 */
const query = (text, params) => pool.query(text, params);

module.exports = { pool, query };
