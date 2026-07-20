import { Router, type Response } from "express";
import { getMuseumsCollection } from "../models/museums.js";
import { getGuidesCollection } from "../models/guides.js";
import { getConversationsCollection } from "../models/conversations.js";
import { optionalAuth, type AuthRequest } from "../middleware/auth.js";

const router = Router();

router.get("/stats", optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const [museumsCol, guidesCol, conversationsCol] = await Promise.all([
      getMuseumsCollection(),
      getGuidesCollection(),
      getConversationsCollection(),
    ]);

    const [museumCount, guideCount] = await Promise.all([
      museumsCol.countDocuments(),
      guidesCol.countDocuments(),
    ]);

    const conversationCount = req.userId
      ? await conversationsCol.countDocuments({ userId: req.userId })
      : await conversationsCol.countDocuments();

    res.json({ museums: museumCount, guides: guideCount, aiConversations: conversationCount });
  } catch (err) {
    console.error("[Stats] Error:", err);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

export default router;
