const { GoogleGenAI } = require('@google/genai');
const { CATEGORIES } = require('../utils/constants');

exports.parseExpense = async (req, res) => {
  const text = String(req.body.text || '').trim().slice(0, 200);
  if (!text) return res.status(400).json({ message: 'Text required' });
  if (!process.env.GEMINI_API_KEY) return res.status(503).json({ message: 'AI not configured' });

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

  const prompt = `Extract one expense from the text. Today is ${today}.
Return ONLY JSON: {"title": string, "amount": number, "category": one of [${CATEGORIES.join(', ')}], "date": "YYYY-MM-DD"}.
Amount is in INR. If no date is mentioned, use today.
Text: """${text}"""`;

  let out;
  try {
    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || 'gemini-3.5-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' },
    });
    out = JSON.parse(response.text);
  } catch (err) {
    console.error('Gemini error:', err.message);
    return res.status(502).json({ message: 'Could not understand that, try again' });
  }

  const amount = Number(out.amount);
  if (!out.title || !(amount > 0)) {
    return res.status(422).json({ message: 'Could not find a title and amount' });
  }
  const date = new Date(out.date);

  res.json({
    title: String(out.title).slice(0, 100),
    amount,
    category: CATEGORIES.includes(out.category) ? out.category : 'Other',
    date: isNaN(date) ? new Date() : date,
  });
};