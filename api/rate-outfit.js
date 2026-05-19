export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    // Safely parse request body
    const body =
      typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    const { imageBase64, imageMimeType } = body || {};

    if (!imageBase64) {
      return res.status(400).json({ error: "No image provided" });
    }

    const prompt = `
You are a world-class fashion critic AI.

Analyze the outfit and return ONLY valid JSON.

JSON format:
{
  "score": number (1-10),
  "verdict": "GOOD FIT" or "BAD FIT",
  "subtitle": string,
  "feedback": string,
  "good_tags": string[],
  "bad_tags": string[]
}

Rules:
- Score must be based on real fashion sense (fit, color, style, coordination)
- If score >= 7 → verdict MUST be "GOOD FIT"
- If score < 7 → verdict MUST be "BAD FIT"
- Be honest but not toxic
- Return ONLY JSON, no extra text
`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
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

    const data = await response.json();

    // 🔥 HANDLE API ERRORS PROPERLY
    if (!response.ok || data.error) {
     return res.status(500).json({
        error: "Gemini API error",
        status: response.status,
        details: data,
      });
    }

    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return res.status(500).json({
        error: "No AI response",
        raw: data,
      });
    }

    // Parse AI JSON safely
    let parsed;

    try {
      parsed = JSON.parse(text);
    } catch (err) {
      return res.status(500).json({
        error: "AI returned invalid JSON",
        raw: text,
      });
    }

    // Safety clamp score
    parsed.score = Math.max(1, Math.min(10, parsed.score || 5));

    return res.status(200).json(parsed);

  } catch (err) {
    return res.status(500).json({
      error: "Server error",
      details: err.message,
    });
  }
}
