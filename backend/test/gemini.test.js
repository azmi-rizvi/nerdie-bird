const test = require('node:test');
const assert = require('node:assert/strict');
process.env.GEMINI_API_KEY = '';
const { extractJSON, toGeminiServiceError, GeminiServiceError, generateAIContent } = require('../utils/gemini');

test('AI requests fail clearly when the backend key is missing', async () => {
  await assert.rejects(
    generateAIContent({ contents: 'test' }),
    error => error.code === 'AI_NOT_CONFIGURED' && error.status === 503
  );
});

test('extracts valid JSON and JSON fenced in markdown', () => {
  assert.deepEqual(extractJSON('{"bird":"cockatiel"}'), { bird: 'cockatiel' });
  assert.deepEqual(extractJSON('```json\n{"bird":"budgie"}\n```'), { bird: 'budgie' });
});

test('malformed provider output becomes a safe, readable error', () => {
  assert.throws(
    () => extractJSON('private bird notes that are not json'),
    error => error.code === 'MALFORMED_RESPONSE' && !error.message.includes('private bird notes')
  );
});

test('normalizes missing key, quota, timeout, malformed output, and provider failures', () => {
  const missingKey = toGeminiServiceError(
    new GeminiServiceError('AI_NOT_CONFIGURED', 'Set GEMINI_API_KEY in the backend environment.', 503)
  );
  assert.equal(missingKey.status, 503);

  const quota = toGeminiServiceError(new Error('resource_exhausted: quota exceeded'));
  assert.equal(quota.status, 429);

  assert.equal(toGeminiServiceError(new Error('API key not valid')).status, 503);

  const timeoutError = new Error('request timeout');
  timeoutError.name = 'TimeoutError';
  assert.equal(toGeminiServiceError(timeoutError).status, 504);

  const malformed = new Error('invalid response');
  malformed.code = 'MALFORMED_RESPONSE';
  assert.equal(toGeminiServiceError(malformed).status, 502);

  assert.equal(toGeminiServiceError(new Error('provider unavailable')).status, 502);
});
