const Anthropic = require('@anthropic-ai/sdk');

const client = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022';

/**
 * Summarize each article into 2–3 neutral bullet points (Claude).
 * @param {Array<{title: string, description: string, url: string, source: string}>} articles
 * @returns {Promise<Array<{title: string, description: string, url: string, source: string, bullets: string[]}>>}
 */
async function summarizeArticlesAsBullets(articles) {
  if (!articles.length) return [];

  if (!client) {
    console.warn('[newsSummarizer] ANTHROPIC_API_KEY not set; using trimmed descriptions.');
    return articles.map((a) => ({
      ...a,
      bullets: fallbackBullets(a),
    }));
  }

  const bundle = articles.map((a, i) => ({
    i,
    title: a.title,
    description: (a.description || '').slice(0, 800),
    source: a.source,
  }));

  const prompt = `You are a careful news editor. For EACH article below, write exactly 2 or 3 bullet points.

Rules:
- Neutral, factual tone — no opinions, no hype, no moralizing
- Use only information inferable from the title and description (do not invent facts)
- Each bullet is one short sentence
- No markdown, no numbering inside strings — plain sentences only

Articles (JSON):
${JSON.stringify(bundle)}

Respond with ONLY valid JSON (no markdown fences), shape:
[{"i":0,"bullets":["...","...","..."]},{"i":1,"bullets":["...","..."]}, ...]
Include one object per article index i in the same order as provided.`;

  try {
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = message.content[0].text.trim();
    const jsonStr = extractJsonArray(text);
    const parsed = JSON.parse(jsonStr);
    if (!Array.isArray(parsed)) throw new Error('Expected array');

    const byIndex = new Map(parsed.map((row) => [row.i, normalizeBullets(row.bullets)]));
    return articles.map((a, i) => ({
      ...a,
      bullets: byIndex.get(i)?.length ? byIndex.get(i) : fallbackBullets(a),
    }));
  } catch (err) {
    console.error('[newsSummarizer] Claude error:', err.message);
    return articles.map((a) => ({ ...a, bullets: fallbackBullets(a) }));
  }
}

function extractJsonArray(text) {
  const start = text.indexOf('[');
  const end = text.lastIndexOf(']');
  if (start >= 0 && end > start) return text.slice(start, end + 1);
  return text;
}

function normalizeBullets(bullets) {
  if (!Array.isArray(bullets)) return [];
  return bullets
    .map((b) => String(b).replace(/^[-*•\d.)]+\s*/i, '').trim())
    .filter(Boolean)
    .slice(0, 3);
}

function fallbackBullets(a) {
  const d = (a.description || '').replace(/\s+/g, ' ').trim();
  if (d.length > 20) {
    const sentence = d.split(/\.\s+/)[0] || d.slice(0, 160);
    return [sentence + (sentence.endsWith('.') ? '' : '.')];
  }
  return [`Headline: ${a.title}`];
}

module.exports = { summarizeArticlesAsBullets };
