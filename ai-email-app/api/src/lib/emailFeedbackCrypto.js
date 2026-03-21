const crypto = require('crypto');

function getSecret() {
  return process.env.EMAIL_FEEDBACK_SECRET || process.env.JWT_SECRET || 'change-me';
}

function feedbackSignature(userId, choice, dayYmd) {
  return crypto.createHmac('sha256', getSecret()).update(`${userId}:${choice}:${dayYmd}`).digest('hex');
}

function verifyFeedbackSignature(userId, choice, dayYmd, sig) {
  if (!sig || typeof sig !== 'string' || !/^[a-f0-9]{64}$/i.test(sig)) return false;
  const expected = feedbackSignature(userId, choice, dayYmd);
  try {
    return crypto.timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expected, 'hex'));
  } catch {
    return false;
  }
}

module.exports = { feedbackSignature, verifyFeedbackSignature };
