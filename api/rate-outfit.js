export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const body =
      typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    const { imageBase64, imageMimeType } = body || {};

    if (!imageBase64) {
      return res.status(400).json({ error: "No image provided" });
    }

    const prompt = `
You are a fashion critic AI.

Analyze this outfit image and respond ONLY in valid JSON:

{
  "score": number from 1-10,
  "verdict": short opinion (1 sentence),
  "subtitle": "AI Style Analysis",
  "feedback": detailed critique (2-4 sentences),
  "good_tags": array of 2-4 strengths,
  "bad_tags": array of 2-4 weaknesses
}

Be brutally honest but not rude.
`;

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inline_data: {
                    mime_type: imageMimeType,
                    data: imageBase64,
                  },
                },
              ],
            },
          ],
        }),
      }
    );

    const data = await geminiRes.json();

    if (!geminiRes.ok) {
      return res.status(500).json({
        error: "Gemini API failed",
        details: data,
      });
    }

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return res.status(500).json({
        error: "No AI response",
        raw: data,
      });
    }

    // clean JSON from AI output
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      return res.status(500).json({
        error: "AI returned invalid JSON",
        raw: text,
      });
    }

    return res.status(200).json(parsed);
  } catch (err) {
    return res.status(500).json({
      error: "Server error",
      details: err.message,
    });
  }
}
