import { Router, type Request, type Response } from "express";
import { ObjectId } from "mongodb";
import { getGuidesCollection, type MuseumGuide } from "../models/guides.js";
import { getMuseumsCollection } from "../models/museums.js";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";
import { guideCreateSchema } from "../middleware/validation.js";
import { toClient, toClientMany } from "../lib/utils.js";

const router = Router();
const p = (v: string | string[]) => (Array.isArray(v) ? v[0] : v);

router.get("/latest", async (_req: Request, res: Response) => {
  try {
    const col = await getGuidesCollection();
    const museumsCol = await getMuseumsCollection();

    const guides = await col
      .find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray();

    const museumIds = [...new Set(guides.map((g) => g.museumId))];
    const museums = await museumsCol.find({ id: { $in: museumIds } }).toArray();
    const museumMap = new Map(museums.map((m) => [m.id, m]));

    const enriched = guides.map((g) => ({
      ...g,
      museumName: museumMap.get(g.museumId)?.title || "Unknown Museum",
      museumCountry: museumMap.get(g.museumId)?.country || "",
    }));

    res.json(toClientMany(enriched as any[]));
  } catch (err) {
    console.error("[Guides] Latest error:", err);
    res.status(500).json({ error: "Failed to fetch guides" });
  }
});

router.get("/me", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const col = await getGuidesCollection();
    const museumsCol = await getMuseumsCollection();

    const guides = await col
      .find({ authorId: req.userId })
      .sort({ createdAt: -1 })
      .toArray();

    const museumIds = [...new Set(guides.map((g) => g.museumId))];
    const museums = await museumsCol.find({ id: { $in: museumIds } }).toArray();
    const museumMap = new Map(museums.map((m) => [m.id, m]));

    const enriched = guides.map((g) => ({
      ...g,
      museumName: museumMap.get(g.museumId)?.title || "Unknown Museum",
    }));

    res.json(toClientMany(enriched as any[]));
  } catch (err) {
    console.error("[Guides] Me error:", err);
    res.status(500).json({ error: "Failed to fetch your guides" });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const col = await getGuidesCollection();
    const museumsCol = await getMuseumsCollection();

    const guide = await col.findOne({ _id: new ObjectId(p(req.params.id)) });
    if (!guide) return res.status(404).json({ error: "Guide not found" });

    const museum = await museumsCol.findOne({ id: guide.museumId });

    res.json(toClient({
      ...guide,
      museumName: museum?.title || "Unknown Museum",
      museumCountry: museum?.country || "",
    } as any));
  } catch (err) {
    console.error("[Guides] Detail error:", err);
    res.status(500).json({ error: "Failed to fetch guide" });
  }
});

router.get("/museum/:museumId", async (req: Request, res: Response) => {
  try {
    const col = await getGuidesCollection();
    const guides = await col
      .find({ museumId: p(req.params.museumId) })
      .sort({ createdAt: -1 })
      .toArray();
    res.json(toClientMany(guides as any[]));
  } catch (err) {
    console.error("[Guides] By museum error:", err);
    res.status(500).json({ error: "Failed to fetch guides" });
  }
});

router.post("/", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const parsed = guideCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0].message });
    }
    const { title, museumId, targetAudience, visitDuration, shortDescription, guideContent, coverImage } = parsed.data;

    const museumsCol = await getMuseumsCollection();
    const museum = await museumsCol.findOne({ id: museumId });
    if (!museum) return res.status(400).json({ error: "Invalid museum ID" });

    const col = await getGuidesCollection();
    const result = await col.insertOne({
      title,
      museumId,
      targetAudience,
      visitDuration,
      shortDescription: shortDescription || "",
      guideContent,
      coverImage: coverImage || museum.coverImage,
      authorId: req.userId!,
      createdAt: new Date(),
      likes: 0,
      likedBy: [],
    });

    res.status(201).json({ id: result.insertedId.toHexString(), message: "Guide created" });
  } catch (err) {
    console.error("[Guides] Create error:", err);
    res.status(500).json({ error: "Failed to create guide" });
  }
});

router.post("/:id/like", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const col = await getGuidesCollection();
    const guide = await col.findOne({ _id: new ObjectId(p(req.params.id)) });
    if (!guide) return res.status(404).json({ error: "Guide not found" });

    const alreadyLiked = guide.likedBy?.includes(req.userId!);
    if (alreadyLiked) {
      await col.updateOne(
        { _id: new ObjectId(p(req.params.id)) },
        { $pull: { likedBy: req.userId }, $inc: { likes: -1 } }
      );
      res.json({ liked: false, likes: guide.likes - 1 });
    } else {
      await col.updateOne(
        { _id: new ObjectId(p(req.params.id)) },
        { $addToSet: { likedBy: req.userId }, $inc: { likes: 1 } }
      );
      res.json({ liked: true, likes: guide.likes + 1 });
    }
  } catch (err) {
    console.error("[Guides] Like error:", err);
    res.status(500).json({ error: "Failed to toggle like" });
  }
});

router.delete("/:id", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const col = await getGuidesCollection();
    const guide = await col.findOne({ _id: new ObjectId(p(req.params.id)) });
    if (!guide) return res.status(404).json({ error: "Guide not found" });
    if (guide.authorId !== req.userId) {
      return res.status(403).json({ error: "Not authorized to delete this guide" });
    }

    await col.deleteOne({ _id: new ObjectId(p(req.params.id)) });
    res.json({ message: "Guide deleted" });
  } catch (err) {
    console.error("[Guides] Delete error:", err);
    res.status(500).json({ error: "Failed to delete guide" });
  }
});

export default router;
