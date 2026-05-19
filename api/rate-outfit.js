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

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "Missing GEMINI_API_KEY on server" });
    }

    const prompt = `
Return ONLY valid JSON.

Analyze this outfit and respond:

{
  "score": 1-10 number,
  "verdict": "short opinion",
  "subtitle": "AI Style Analysis",
  "feedback": "2-3 sentences critique",
  "good_tags": ["..."],
  "bad_tags": ["..."]
}
`;
      if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({
      error: "Missing API key on Vercel"
    });
  }
    const response = await fetch(
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
                    mime_type: imageMimeType || "image/jpeg",
                    data: imageBase64,
                  },
                },
              ],
            },
          ],
        }),
      }
    );

    const raw = await response.json();

    if (!response.ok) {
      return res.status(500).json({
        error: "Gemini API failed",
        details: raw,
      });
    }

    const text = raw?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return res.status(500).json({
        error: "No text returned from Gemini",
        raw,
      });
    }

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      return res.status(500).json({
        error: "Gemini returned non-JSON output",
        raw: text,
      });
    }

    return res.status(200).json(parsed);
  } catch (err) {
    return res.status(500).json({
      error: "Server crash",
      details: err.message,
    });
  }
}
