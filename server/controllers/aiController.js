const { GoogleGenAI } = require('@google/genai');
const { CATEGORIES } = require('../utils/constants');

const MODELS = (process.env.GEMINI_MODELS || 'gemini-3.1-flash-lite,gemini-3.5-flash-lite,gemini-3.5-flash')
  .split(',')
  .map((m) => m.trim())
  .filter(Boolean);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Har model ko 2 baar try karo, phir agle model pe jao
async function generateWithFallback(ai, prompt) {
  let lastErr;
  for (const model of MODELS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        return await ai.models.generateContent({
          model,
          contents: prompt,
          config: { responseMimeType: 'application/json' },
        });
      } catch (err) {
        lastErr = err;
        const status = err.status || err.code;
        console.error(`Gemini ${model} attempt ${attempt + 1} failed:`, status, String(err.message).slice(0, 100));
        if (status === 404 || status === 400) break; // model naam galat/unsupported, agla model
        if (![429, 500, 503].includes(status)) throw err;
        await sleep(600 * (attempt + 1));
      }
    }
  }
  throw lastErr;
}

// Backup: AI na chale tab bhi "auto 80", "pizza 250 kal" jaise simple text chal jaye
const KEYWORDS = {
  Food: /pizza|food|lunch|dinner|breakfast|chai|coffee|snack|burger|swiggy|zomato|khana/i,
  Travel: /auto|bus|cab|uber|ola|metro|petrol|train|ticket|rapido/i,
  Shopping: /shirt|shoes|amazon|flipkart|shopping|clothes/i,
  Bills: /bill|rent|recharge|electricity|wifi|internet/i,
  Entertainment: /movie|netflix|game|spotify|concert/i,
  Health: /medicine|doctor|gym|pharmacy|hospital/i,
  Education: /book|course|fees|exam|stationery/i,
};

const localParse = (text) => {
  const m = text.match(/\d+(\.\d+)?/);
  if (!m) return null;
  const lower = text.toLowerCase();
  const date = new Date();
  if (/\b(kal|yesterday)\b/.test(lower)) date.setDate(date.getDate() - 1);
  else if (/\bparso\b/.test(lower)) date.setDate(date.getDate() - 2);

  const title =
    text
      .replace(m[0], '')
      .replace(/\b(kal|yesterday|parso|today|aaj|rs|inr|rupees|for|on)\b|₹/gi, '')
      .replace(/\s+/g, ' ')
      .trim() || 'Expense';

  const category = CATEGORIES.find((c) => KEYWORDS[c]?.test(lower)) || 'Other';
  return { title: title.slice(0, 100), amount: Number(m[0]), category, date };
};

exports.parseExpense = async (req, res) => {
  const text = String(req.body.text || '').trim().slice(0, 200);
  if (!text) return res.status(400).json({ message: 'Text required' });

  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  let result = null;

  if (process.env.GEMINI_API_KEY) {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `Extract one expense from the text. Today is ${today}.
Return ONLY JSON: {"title": string, "amount": number, "category": one of [${CATEGORIES.join(', ')}], "date": "YYYY-MM-DD"}.
Amount is in INR. If no date is mentioned, use today. The Hindi word "kal" means yesterday.
Text: """${text}"""`;

      const response = await generateWithFallback(ai, prompt);
      const out = JSON.parse(response.text);
      const amount = Number(out.amount);
      if (out.title && amount > 0) {
        const date = new Date(out.date);
        result = {
          title: String(out.title).slice(0, 100),
          amount,
          category: CATEGORIES.includes(out.category) ? out.category : 'Other',
          date: isNaN(date) ? new Date() : date,
        };
      }
    } catch (err) {
      console.error('Gemini failed, using basic parser:', err.status || '', String(err.message).slice(0, 100));
    }
  }

  if (!result) result = localParse(text);
  if (!result) return res.status(422).json({ message: 'Could not find a title and amount' });

  res.json(result);
};