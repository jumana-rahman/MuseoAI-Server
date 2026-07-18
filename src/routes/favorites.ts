import { Router, type Response } from "express";
import { getFavoritesCollection } from "../models/favorites.js";
import { getMuseumsCollection } from "../models/museums.js";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";

const router = Router();

router.get("/", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const favCol = await getFavoritesCollection();
    const museumsCol = await getMuseumsCollection();

    const favorites = await favCol
      .find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .toArray();

    const museumIds = favorites.map((f) => f.museumId);
    const museums = await museumsCol.find({ id: { $in: museumIds } }).toArray();
    const museumMap = new Map(museums.map((m) => [m.id, m]));

    const enriched = favorites.map((f) => ({
      ...f,
      museum: museumMap.get(f.museumId) || null,
    }));

    res.json(enriched);
  } catch (err) {
    console.error("[Favorites] List error:", err);
    res.status(500).json({ error: "Failed to fetch favorites" });
  }
});

router.post("/:museumId", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { museumId } = req.params;

    const museumsCol = await getMuseumsCollection();
    const museum = await museumsCol.findOne({ id: museumId });
    if (!museum) return res.status(404).json({ error: "Museum not found" });

    const favCol = await getFavoritesCollection();
    const existing = await favCol.findOne({ userId: req.userId, museumId });

    if (existing) {
      return res.json({ favorited: true, message: "Already favorited" });
    }

    await favCol.insertOne({
      userId: req.userId!,
      museumId,
      createdAt: new Date(),
    });

    res.json({ favorited: true, message: "Added to favorites" });
  } catch (err) {
    console.error("[Favorites] Add error:", err);
    res.status(500).json({ error: "Failed to add favorite" });
  }
});

router.delete("/:museumId", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const favCol = await getFavoritesCollection();
    await favCol.deleteOne({ userId: req.userId, museumId: req.params.museumId });
    res.json({ favorited: false, message: "Removed from favorites" });
  } catch (err) {
    console.error("[Favorites] Remove error:", err);
    res.status(500).json({ error: "Failed to remove favorite" });
  }
});

export default router;
