const { GoogleGenAI } = require('@google/genai');
const { CATEGORIES } = require('../utils/constants');
const { isPlainObject, parseDate, parseMoney } = require('../utils/validation');

const busyMessage = 'AI service is currently busy. Please try again in a moment.';
const invalidResponseMessage =
  'The AI returned an invalid response. Please enter the expense manually.';

exports.parseExpense = async (req, res) => {
  console.log('>>> [/api/expenses/parse] Endpoint hit');

  if (!isPlainObject(req.body) || typeof req.body.text !== 'string') {
    return res.status(400).json({ success: false, message: 'Text required' });
  }

  const text = req.body.text.trim();
  if (!text) {
    return res.status(400).json({ success: false, message: 'Text required' });
  }

  if (text.length > 200) {
    return res.status(400).json({ success: false, message: 'Text must be at most 200 characters' });
  }

  if (!process.env.GEMINI_API_KEY) {
    console.error('CRITICAL: GEMINI_API_KEY missing');
    return res.status(503).json({ success: false, message: 'AI service is not configured.' });
  }

  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  const prompt = `Extract one expense from the text. Today is ${today}.
Return raw JSON only, with no markdown fences or surrounding explanation:
{"title": string, "amount": number, "category": one of [${CATEGORIES.join(', ')}], "date": "YYYY-MM-DD"}.
Amount is in INR. If no date is mentioned, use today.
Expense description: """${text}"""`;

  let response;
  const abortController = new AbortController();
  const timeout = setTimeout(() => abortController.abort(), 12_000);

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    // Fallback to gemini-3.8-flash
    const targetModel = process.env.GEMINI_MODEL || 'gemini-3.8-flash';

    response = await ai.models.generateContent({
      model: targetModel,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        abortSignal: abortController.signal,
        maxOutputTokens: 256,
      },
    });
  } catch (error) {
    console.error('\n================ GEMINI API FAILURE ================');
    console.error('Error details:', error.message || error);
    console.error('====================================================\n');
    return res.status(503).json({ success: false, message: busyMessage });
  } finally {
    clearTimeout(timeout);
  }

  if (typeof response?.text !== 'string' || response.text.length > 2_000) {
    return res.status(422).json({ success: false, message: invalidResponseMessage });
  }

  let result;
  try {
    const jsonText = response.text
      .trim()
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/, '')
      .trim();
    result = JSON.parse(jsonText);
  } catch {
    return res.status(422).json({ success: false, message: invalidResponseMessage });
  }

  if (!isPlainObject(result) || typeof result.title !== 'string' || !result.title.trim()) {
    return res.status(422).json({ success: false, message: 'Could not find a valid expense title.' });
  }

  const amount = parseMoney(result.amount);
  if (amount === null) {
    return res.status(422).json({ success: false, message: 'Could not find a valid expense amount.' });
  }

  const date = parseDate(result.date) || today;

  return res.json({
    title: result.title.trim(),
    amount,
    category: CATEGORIES.includes(result.category) ? result.category : 'Other',
    date,
  });
};