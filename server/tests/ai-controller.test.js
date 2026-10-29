const test = require('node:test');
const assert = require('node:assert/strict');

let generateContent;
let requestedModel;
const genaiPath = require.resolve('@google/genai');
const originalGenai = require.cache[genaiPath];
require.cache[genaiPath] = {
  id: genaiPath,
  filename: genaiPath,
  loaded: true,
  exports: {
    GoogleGenAI: class {
      constructor() {
        this.models = {
          generateContent: (options) => {
            requestedModel = options.model;
            return generateContent(options);
          },
        };
      }
    },
  },
};

const { parseExpense } = require('../controllers/aiController');
process.env.GEMINI_API_KEY = 'test-key';

const invoke = async (text) => {
  const response = {
    statusCode: 200,
    body: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
  await parseExpense({ body: { text } }, response);
  return response;
};

test('parses JSON wrapped in markdown and uses the supported Flash model', async () => {
  generateContent = async () => ({
    text: '```json\n{"title":"Lunch","amount":125.5,"category":"Food","date":"2026-10-05"}\n```',
  });

  const response = await invoke('lunch 125.50');
  assert.equal(requestedModel, 'gemini-3.1-flash-lite');
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.title, 'Lunch');
  assert.equal(response.body.amount, 125.5);
});

test('returns a validation response for malformed model JSON', async () => {
  generateContent = async () => ({ text: '```json\n{not valid}\n```' });

  const response = await invoke('lunch');
  assert.equal(response.statusCode, 422);
  assert.equal(response.body.message, 'Could not find a title and amount');
});

test('falls back to the basic parser when the provider request fails', async () => {
  const originalError = console.error;
  console.error = () => {};
  generateContent = async () => {
    throw new Error('upstream unavailable');
  };

  try {
    const ok = await invoke('lunch 125');
    assert.equal(ok.statusCode, 200);
    assert.equal(ok.body.amount, 125);

    const bad = await invoke('lunch');
    assert.equal(bad.statusCode, 422);
  } finally {
    console.error = originalError;
  }
});