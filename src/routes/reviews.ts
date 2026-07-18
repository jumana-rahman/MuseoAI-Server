import { Router, type Request, type Response } from "express";
import { getDb } from "../config/db.js";
import { getReviewsCollection } from "../models/reviews.js";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";
import { reviewSchema } from "../middleware/validation.js";
import { toClientMany } from "../lib/utils.js";

const router = Router({ mergeParams: true });
const p = (v: string | string[]) => (Array.isArray(v) ? v[0] : v);

router.get("/:museumId/reviews", async (req: Request, res: Response) => {
  try {
    const col = await getReviewsCollection();
    const reviews = await col
      .find({ museumId: p(req.params.museumId) })
      .sort({ createdAt: -1 })
      .toArray();

    const db = await getDb();
    const userIds = [...new Set(reviews.map((r) => r.userId))];
    const users = userIds.length > 0
      ? await db.collection("user").find({ id: { $in: userIds } }).project({ id: 1, name: 1, image: 1 }).toArray()
      : [];
    const userMap = new Map(users.map((u: any) => [u.id, u]));

    const enriched = reviews.map((r) => {
      const u = userMap.get(r.userId) as any;
      return { ...r, userName: u?.name ?? "Anonymous", userAvatar: u?.image ?? null };
    });

    res.json(toClientMany(enriched as any[]));
  } catch (err) {
    console.error("[Reviews] List error:", err);
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
});

router.post("/:museumId/reviews", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const parsed = reviewSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0].message });
    }
    const museumId = p(req.params.museumId);
    const numRating = parseInt(String(parsed.data.rating), 10);
    const reviewText = parsed.data.review;

    const col = await getReviewsCollection();
    const existing = await col.findOne({ museumId, userId: req.userId });
    if (existing) {
      return res.status(409).json({ error: "You have already reviewed this museum" });
    }

    await col.insertOne({
      museumId,
      userId: req.userId!,
      rating: numRating,
      review: reviewText,
      createdAt: new Date(),
    });

    res.status(201).json({ message: "Review submitted" });
  } catch (err) {
    console.error("[Reviews] Create error:", err);
    res.status(500).json({ error: "Failed to submit review" });
  }
});

export default router;
