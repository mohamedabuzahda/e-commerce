export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return res.status(503).json({
      error: "AI is not configured. Add GROQ_API_KEY in Vercel Environment Variables.",
    });
  }

  try {
    const { messages } = req.body || {};

    if (!Array.isArray(messages) || !messages.length) {
      return res.status(400).json({ error: "A user message is required." });
    }

    const cleanMessages = messages
      .filter(
        (m) =>
          ["user", "assistant"].includes(m.role) &&
          typeof m.content === "string"
      )
      .slice(-16)
      .map((m) => ({
        role: m.role,
        content: m.content.slice(0, 5000),
      }));

    if (!cleanMessages.length || cleanMessages.at(-1).role !== "user") {
      return res.status(400).json({ error: "A user message is required." });
    }

    const upstream = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || "openai/gpt-oss-20b",
        messages: [
          {
            role: "system",
            content:
              "You are ShopEase's helpful assistant. Answer the user's actual question directly, in the same language they use. You can discuss any topic. For ShopEase-specific order or coupon facts, only use facts explicitly included in the conversation; never invent private account data. Be clear and concise.",
          },
          ...cleanMessages,
        ],
        max_tokens: 1024,
        temperature: 0.7,
      }),
    });

    const result = await upstream.json();

    if (!upstream.ok) {
      return res.status(upstream.status).json({
        error: result.error?.message || "The AI provider returned an error.",
      });
    }

    const answer = result.choices?.[0]?.message?.content?.trim();

    if (!answer) {
      return res.status(502).json({ error: "The AI provider returned an empty answer." });
    }

    return res.status(200).json({ answer });
  } catch (error) {
    return res.status(500).json({
      error: error.message || "The chat request failed.",
    });
  }
}