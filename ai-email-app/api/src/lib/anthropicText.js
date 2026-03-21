/**
 * Extract plain text from Anthropic Messages API response (handles mixed content blocks).
 * @param {{ content?: Array<{ type?: string, text?: string }> }} message
 * @returns {string}
 */
function getAnthropicMessageText(message) {
  const blocks = message?.content;
  if (!Array.isArray(blocks)) return '';
  const parts = [];
  for (const block of blocks) {
    if (block?.type === 'text' && typeof block.text === 'string') {
      parts.push(block.text);
    }
  }
  return parts.join('\n').trim();
}

module.exports = { getAnthropicMessageText };
