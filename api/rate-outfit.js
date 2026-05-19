export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }
    const usageMap = new Map();
        const ip = req.headers["x-forwarded-for"] || "unknown";
    const count = usageMap.get(ip) || 0;
    
    if (count >= 3) {
      return res.status(403).json({ error: "Free limit reached" });
    }
    
    usageMap.set(ip, count + 1);
    const body =
      typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    const { imageBase64 } = body || {};

    if (!imageBase64) {
      return res.status(400).json({ error: "No image provided" });
    }

    const score = Math.floor(Math.random() * 10) + 1;

    return res.status(200).json({
      score,
      verdict: "Test working — backend connected",
      subtitle: "AI Style Analysis",
      feedback: "Your API route is now correctly deployed.",
      good_tags: ["Working"],
      bad_tags: []
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
