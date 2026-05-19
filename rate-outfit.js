export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    // ✅ IMPORTANT: safely parse body
    const body =
      typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    const { imageBase64 } = body || {};

    if (!imageBase64) {
      return res.status(400).json({ error: "No image provided" });
    }

    const score = Math.floor(Math.random() * 10) + 1;

    const verdict =
      score >= 8
        ? "Clean fit. You’ve got strong style."
        : score >= 5
        ? "Decent fit, but needs improvement."
        : "This fit needs serious upgrades.";

    return res.status(200).json({
      score,
      verdict,
      subtitle: "AI Style Analysis",
      feedback: "Backend is working correctly.",
      good_tags: ["Clean", "Balanced"],
      bad_tags: ["Needs improvement"]
    });

  } catch (err) {
    return res.status(500).json({
      error: "Server error",
      details: err.message
    });
  }
}
