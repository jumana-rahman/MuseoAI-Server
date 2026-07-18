import { Router, type Request, type Response } from "express";
import { getMuseumsCollection } from "../models/museums.js";
import { getGuidesCollection } from "../models/guides.js";
import { getConversationsCollection } from "../models/conversations.js";

const router = Router();

router.get("/stats", async (_req: Request, res: Response) => {
  try {
    const [museumsCol, guidesCol, conversationsCol] = await Promise.all([
      getMuseumsCollection(),
      getGuidesCollection(),
      getConversationsCollection(),
    ]);

    const [museumCount, guideCount, conversationCount] = await Promise.all([
      museumsCol.countDocuments(),
      guidesCol.countDocuments(),
      conversationsCol.countDocuments(),
    ]);

    res.json({ museums: museumCount, guides: guideCount, aiConversations: conversationCount });
  } catch (err) {
    console.error("[Stats] Error:", err);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

export default router;
