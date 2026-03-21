const https = require('https');

const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'as', 'is', 'was', 'are',
  'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
  'my', 'your', 'our', 'their', 'i', 'me', 'we', 'you', 'it', 'this', 'that', 'with', 'from', 'by',
  'about', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'under',
  'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'each',
  'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so',
  'than', 'too', 'very', 'just', 'also', 'now', 'learn', 'want', 'get', 'like', 'work', 'working',
]);

/**
 * Fetch a shared pool of real headlines once per morning job (saves NewsAPI quota).
 * @returns {Promise<Array<{title: string, description: string, url: string, source: string, publishedAt?: string}>>}
 */
async function fetchMorningNewsPool() {
  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) {
    console.warn('[news] NEWS_API_KEY not set.');
    return [];
  }

  const [headlines, extra] = await Promise.all([
    fetchTopHeadlines(apiKey, 'us', 30),
    fetchTopHeadlines(apiKey, 'gb', 15),
  ]);

  const merged = dedupeByUrl([...(headlines || []), ...(extra || [])]);
  return merged.slice(0, 40).map(normalizeArticle);
}

/**
 * Legacy: fetch for a single user without a pool (fallback).
 */
async function fetchNews(profile) {
  const apiKey = process.env.NEWS_API_KEY;
  const keywords = buildSearchQuery(profile);
  const articles =
    (keywords && (await fetchEverything(keywords, apiKey))) ||
    (await fetchTopHeadlines(apiKey, 'us', 15));

  return (articles || []).slice(0, 5).map(normalizeArticle);
}

/**
 * Pick up to `limit` articles from the pool best matching profile interests / hobbies.
 * @param {Array<object>} pool
 * @param {object} profile
 * @param {number} limit
 */
function selectArticlesForUser(pool, profile, limit = 5) {
  if (!pool?.length) return [];
  const tokens = extractInterestTokens(profile);
  if (!tokens.length) {
    return pool.slice(0, limit);
  }

  const scored = pool.map((article) => ({
    article,
    score: scoreArticle(article, tokens),
  }));

  scored.sort((a, b) => b.score - a.score);
  const top = scored.filter((s) => s.score > 0).slice(0, limit).map((s) => s.article);
  if (top.length >= limit) return top;

  const picked = new Set(top.map((a) => a.url));
  for (const a of pool) {
    if (top.length >= limit) break;
    if (!picked.has(a.url)) {
      top.push(a);
      picked.add(a.url);
    }
  }
  return top.slice(0, limit);
}

function normalizeArticle(a) {
  return {
    title: (a.title || '').replace(/<[^>]+>/g, '').trim(),
    description: (a.description || '').replace(/<[^>]+>/g, '').trim(),
    url: a.url,
    source: a.source?.name || 'News source',
    publishedAt: a.publishedAt,
  };
}

function dedupeByUrl(articles) {
  const seen = new Set();
  const out = [];
  for (const a of articles) {
    if (!a?.url || seen.has(a.url)) continue;
    seen.add(a.url);
    out.push(a);
  }
  return out;
}

function tokenize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
}

function extractInterestTokens(profile) {
  const raw = [
    profile.hobbies,
    profile.position,
    profile.main_goal,
    profile.about_me,
  ]
    .filter(Boolean)
    .join(' ');

  const words = tokenize(raw);
  const uniq = [...new Set(words)];
  return uniq.slice(0, 25);
}

function scoreArticle(article, tokens) {
  if (!tokens.length) return 0;
  const hay = tokenize(`${article.title} ${article.description}`).join(' ');
  let score = 0;
  for (const t of tokens) {
    if (hay.includes(t)) score += t.length >= 5 ? 3 : 2;
  }
  return score;
}

function buildSearchQuery(profile) {
  const terms = [];
  if (profile.hobbies) {
    terms.push(
      ...profile.hobbies
        .split(/[,;]+/)
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 4)
    );
  }
  if (profile.position) {
    terms.push(
      ...profile.position
        .split(/[\s,/]+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 2)
        .slice(0, 3)
    );
  }
  const q = [...new Set(terms)].slice(0, 5).join(' OR ');
  return q || null;
}

function fetchTopHeadlines(apiKey, country, pageSize) {
  const params = new URLSearchParams({
    apiKey,
    country,
    pageSize: String(pageSize),
    category: 'general',
  });
  return requestNews(`/v2/top-headlines?${params}`);
}

function fetchEverything(query, apiKey) {
  const from = new Date(Date.now() - 48 * 3600 * 1000).toISOString().slice(0, 10);
  const params = new URLSearchParams({
    apiKey,
    q: query,
    language: 'en',
    sortBy: 'publishedAt',
    pageSize: '15',
    from,
  });
  return requestNews(`/v2/everything?${params}`);
}

function requestNews(path) {
  return new Promise((resolve) => {
    const options = { hostname: 'newsapi.org', path, method: 'GET' };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.status === 'ok' && Array.isArray(parsed.articles)) {
            resolve(parsed.articles);
          } else {
            if (parsed.code || parsed.message) {
              console.warn('[news] NewsAPI:', parsed.code || '', parsed.message || '');
            }
            resolve(null);
          }
        } catch {
          resolve(null);
        }
      });
    });
    req.on('error', (e) => {
      console.warn('[news] Request error:', e.message);
      resolve(null);
    });
    req.end();
  });
}

module.exports = {
  fetchMorningNewsPool,
  fetchNews,
  selectArticlesForUser,
  extractInterestTokens,
};
