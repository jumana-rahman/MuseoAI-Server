import { Router, type Response } from "express";
import { ObjectId } from "mongodb";
import { getAI, sanitizeInput } from "../lib/ai.js";
import { getMuseumsCollection } from "../models/museums.js";
import { getConversationsCollection } from "../models/conversations.js";
import { getSignalsCollection } from "../models/signals.js";
import { requireAuth, optionalAuth, type AuthRequest } from "../middleware/auth.js";

const router = Router();

router.post("/museum-guide", optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { museumId, message, conversationId } = req.body;
    if (!museumId || !message) {
      return res.status(400).json({ error: "museumId and message are required" });
    }

    const sanitized = sanitizeInput(message, 1000);

    const museumsCol = await getMuseumsCollection();
    const museum = await museumsCol.findOne({ id: museumId });
    if (!museum) return res.status(404).json({ error: "Museum not found" });

    const convCol = await getConversationsCollection();
    let conversation;

    if (conversationId) {
      conversation = await convCol.findOne({ _id: new ObjectId(conversationId) });
    }

    if (!conversation && req.userId) {
      conversation = await convCol.findOne({
        userId: req.userId,
        museumId,
      });
    }

    const museumContext = `
You are an AI Museum Guide for "${museum.title}" in ${museum.city}, ${museum.country}.
Category: ${museum.category}
Description: ${museum.description}
History: ${museum.history}
Opening Hours: ${museum.openingHours}
Ticket Price: $${museum.ticketPrice} (${museum.ticketType})
Facilities: ${museum.facilities.join(", ")}
Visitor Tips: ${museum.visitorTips.join("; ")}

Rules:
- Only answer questions about this specific museum.
- Be helpful, friendly, and provide visitor-friendly answers.
- If you don't know something specific, say so honestly rather than making things up.
- Keep answers concise but informative.
- You can suggest itineraries, recommend exhibits, and provide practical visitor advice.
`;

    const historyMessages = conversation?.messages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    })) || [];

    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        { role: "user", parts: [{ text: museumContext }] },
        { role: "model", parts: [{ text: "I'm ready to help visitors learn about " + museum.title + ". Ask me anything!" }] },
        ...historyMessages,
        { role: "user", parts: [{ text: sanitized }] },
      ],
    });

    const reply = response.text || "I'm sorry, I couldn't generate a response. Please try again.";

    if (req.userId) {
      const newMessages = [
        ...(conversation?.messages || []),
        { role: "user" as const, content: sanitized, timestamp: new Date() },
        { role: "assistant" as const, content: reply, timestamp: new Date() },
      ];

      if (conversation?._id) {
        await convCol.updateOne(
          { _id: conversation._id },
          { $set: { messages: newMessages, updatedAt: new Date() } }
        );
      } else {
        const result = await convCol.insertOne({
          userId: req.userId,
          museumId,
          messages: newMessages,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        return res.json({
          reply,
          conversationId: result.insertedId.toString(),
        });
      }
    }

    res.json({ reply, conversationId: conversation?._id?.toString() || null });
  } catch (err) {
    console.error("[AI] Museum guide error:", err);
    res.status(500).json({ error: "AI service temporarily unavailable. Please try again." });
  }
});

router.post("/guide-writer", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { museumId, targetAudience, visitDuration, interests, length } = req.body;

    if (!museumId || !targetAudience || !visitDuration) {
      return res.status(400).json({ error: "museumId, targetAudience, and visitDuration are required" });
    }

    const museumsCol = await getMuseumsCollection();
    const museum = await museumsCol.findOne({ id: museumId });
    if (!museum) return res.status(404).json({ error: "Museum not found" });

    const sanitizedAudience = sanitizeInput(targetAudience, 50);
    const sanitizedDuration = sanitizeInput(visitDuration, 50);
    const sanitizedInterests = Array.isArray(interests)
      ? interests.slice(0, 10).map((i: string) => sanitizeInput(String(i), 50))
      : [];
    const outputLength = ["short", "medium", "long"].includes(length) ? length : "medium";

    const prompt = `
You are an expert museum guide writer. Create a structured museum visit guide.

Museum: ${museum.title}
Location: ${museum.city}, ${museum.country}
Category: ${museum.category}
Description: ${museum.description}
Opening Hours: ${museum.openingHours}
Facilities: ${museum.facilities.join(", ")}
Visitor Tips: ${museum.visitorTips.join("; ")}

Target Audience: ${sanitizedAudience}
Visit Duration: ${sanitizedDuration}
${sanitizedInterests.length ? `Interests: ${sanitizedInterests.join(", ")}` : ""}
Output Length: ${outputLength}

IMPORTANT: Generate the response as a valid JSON object with EXACTLY these fields:
{
  "title": "Guide title",
  "shortDescription": "One-paragraph description",
  "guideContent": "Detailed itinerary with time blocks, must-see exhibits, tips, recommended route, and time allocation",
}

Do NOT include any text outside the JSON object. No markdown, no code blocks. Just the raw JSON.
`;

    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    let raw = response.text || "";

    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return res.status(500).json({ error: "Failed to generate guide" });
    }

    const guide = JSON.parse(jsonMatch[0]);

    res.json({
      title: guide.title || `${museum.title} Visit Guide`,
      shortDescription: guide.shortDescription || "",
      guideContent: guide.guideContent || "",
    });
  } catch (err) {
    console.error("[AI] Guide writer error:", err);
    res.status(500).json({ error: "AI guide generation failed. Please try again." });
  }
});

router.post("/recommendations", optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { interests, preferredCountry, budget, travelDuration, travelType } = req.body;

    const museumsCol = await getMuseumsCollection();

    const filter: Record<string, unknown> = {};
    if (preferredCountry) filter.country = preferredCountry;

    let candidateMuseums = await museumsCol.find(filter).limit(50).toArray();

    if (budget !== undefined && budget !== "") {
      const maxBudget = parseInt(String(budget), 10);
      if (!isNaN(maxBudget)) {
        candidateMuseums = candidateMuseums.filter((m) => m.ticketPrice <= maxBudget);
      }
    }

    if (candidateMuseums.length === 0) {
      candidateMuseums = await museumsCol.find({}).limit(20).toArray();
    }

    let personalizedContext = "";
    if (req.userId) {
      const signalsCol = await getSignalsCollection();
      const signals = await signalsCol.find({ userId: req.userId }).sort({ createdAt: -1 }).limit(50).toArray();
      const viewedIds = signals.filter((s) => s.signalType === "museum_view").map((s) => s.museumId);
      const favIds = signals.filter((s) => s.signalType === "favorite_add").map((s) => s.museumId);
      if (viewedIds.length || favIds.length) {
        personalizedContext = `\nUser history: Viewed museums: ${viewedIds.join(", ") || "none"}. Favorited museums: ${favIds.join(", ") || "none"}. Prioritize variety over repetition.`;
      }
    }

    const museumList = candidateMuseums
      .map(
        (m) =>
          `- ${m.id}: ${m.title} in ${m.city}, ${m.country} | Category: ${m.category} | Price: $${m.ticketPrice} | Rating: ${m.rating}`
      )
      .join("\n");

    const prompt = `
You are a museum recommendation expert. Recommend the best museums for this traveler.

Traveler preferences:
- Interests: ${interests?.join(", ") || "General"}
- Preferred country: ${preferredCountry || "Any"}
- Budget: ${budget ? "$" + budget : "Flexible"}
- Travel duration: ${travelDuration || "Not specified"}
- Travel type: ${travelType || "Not specified"}
${personalizedContext}

Available museums:
${museumList}

Return a JSON array of top 5-8 recommendations with this format:
[
  {
    "museumId": "museum-id",
    "title": "Museum Name",
    "city": "City",
    "country": "Country",
    "category": "Category",
    "ticketPrice": 0,
    "rating": 4.8,
    "coverImage": "url",
    "reason": "Why this museum fits the traveler's preferences"
  }
]

Return ONLY the JSON array. No markdown, no code blocks, no extra text.
`;

    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    let raw = response.text || "[]";

    const arrayMatch = raw.match(/\[[\s\S]*\]/);
    if (!arrayMatch) {
      return res.json([]);
    }

    const recommendations = JSON.parse(arrayMatch[0]);

    const museumIds = recommendations.map((r: { museumId: string }) => r.museumId);
    const fullMuseums = await museumsCol
      .find({ id: { $in: museumIds } })
      .toArray();
    const museumDataMap = new Map(fullMuseums.map((m) => [m.id, m]));

    const enriched = recommendations
      .filter((r: { museumId: string }) => museumDataMap.has(r.museumId))
      .map((r: { museumId: string; reason: string }) => ({
        ...museumDataMap.get(r.museumId),
        reason: r.reason,
      }));

    res.json(enriched);
  } catch (err) {
    console.error("[AI] Recommendations error:", err);
    res.status(500).json({ error: "Recommendation service temporarily unavailable." });
  }
});

router.post("/signals", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { museumId, signalType } = req.body;
    if (!museumId || !signalType) {
      return res.status(400).json({ error: "museumId and signalType are required" });
    }

    const validSignals = ["favorite_add", "favorite_remove", "museum_view", "like", "dislike"];
    if (!validSignals.includes(signalType)) {
      return res.status(400).json({ error: "Invalid signalType" });
    }

    const col = await getSignalsCollection();
    await col.insertOne({
      userId: req.userId!,
      museumId,
      signalType,
      createdAt: new Date(),
    });

    res.json({ message: "Signal recorded" });
  } catch (err) {
    console.error("[AI] Signal error:", err);
    res.status(500).json({ error: "Failed to record signal" });
  }
});

export default router;
