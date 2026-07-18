import { Router, type Response } from "express";
import { getFavoritesCollection } from "../models/favorites.js";
import { getGuidesCollection } from "../models/guides.js";
import { getReviewsCollection } from "../models/reviews.js";
import { getMuseumsCollection } from "../models/museums.js";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";

const router = Router();

router.get("/activity", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const [favCol, guideCol, reviewCol, museumsCol] = await Promise.all([
      getFavoritesCollection(),
      getGuidesCollection(),
      getReviewsCollection(),
      getMuseumsCollection(),
    ]);

    const [recentFavs, recentGuides, recentReviews] = await Promise.all([
      favCol.find({ userId }).sort({ createdAt: -1 }).limit(5).toArray(),
      guideCol.find({ authorId: userId }).sort({ createdAt: -1 }).limit(5).toArray(),
      reviewCol.find({ userId }).sort({ createdAt: -1 }).limit(5).toArray(),
    ]);

    const museumIds = [
      ...new Set([
        ...recentFavs.map((f) => f.museumId),
        ...recentGuides.map((g) => g.museumId),
        ...recentReviews.map((r) => r.museumId),
      ]),
    ];
    const museums = museumIds.length > 0
      ? await museumsCol.find({ id: { $in: museumIds } }).toArray()
      : [];
    const museumMap = new Map(museums.map((m) => [m.id, m]));

    const activities = [
      ...recentFavs.map((f) => ({
        type: "favorite" as const,
        museumId: f.museumId,
        museumName: museumMap.get(f.museumId)?.title || "Unknown",
        createdAt: f.createdAt,
      })),
      ...recentGuides.map((g) => ({
        type: "guide" as const,
        museumId: g.museumId,
        museumName: museumMap.get(g.museumId)?.title || "Unknown",
        title: g.title,
        createdAt: g.createdAt,
      })),
      ...recentReviews.map((r) => ({
        type: "review" as const,
        museumId: r.museumId,
        museumName: museumMap.get(r.museumId)?.title || "Unknown",
        rating: r.rating,
        createdAt: r.createdAt,
      })),
    ]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);

    res.json(activities);
  } catch (err) {
    console.error("[Activity] Error:", err);
    res.status(500).json({ error: "Failed to fetch activity" });
  }
});

export default router;
