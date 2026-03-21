const Anthropic = require('@anthropic-ai/sdk');
const { getAnthropicMessageText } = require('../lib/anthropicText');

const client = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022';

/**
 * Generate a personalized daily lesson (300–400 words).
 * @param {Object} profile - User profile from DB
 * @returns {Promise<string>}
 */
async function generateLesson(profile) {
  if (!client) {
    return `Good morning. Your personalized lesson will appear here once ANTHROPIC_API_KEY is configured. Your focus today: ${profile.main_goal || 'keep showing up consistently'}. Take one small step toward that goal before noon.`;
  }

  const prompt = `You are a personal growth and learning coach. Write a 300–400 word personalized daily lesson for this person:

- Age: ${profile.age}
- Hobbies: ${profile.hobbies}
- Job/Role: ${profile.position}
- 5-year goal: ${profile.goal_5yr}
- 10-year goal: ${profile.goal_10yr}
- Main current goal: ${profile.main_goal}
- About them: ${profile.about_me}
${profile.feedback_prefs ? `- Their feedback/preferences from yesterday: ${profile.feedback_prefs}` : ''}

Rules:
- Be specific to their situation — mention their field, goals, or hobbies directly
- Include one actionable insight or exercise they can do today
- Be encouraging but grounded — no empty platitudes
- Keep it 300–400 words
- Write in second person ("you")
- Do NOT include a title or subject line — just the lesson body`;

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 900,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = getAnthropicMessageText(message);
  if (!text) {
    throw new Error('Empty response from Claude');
  }
  return text;
}

module.exports = { generateLesson };
