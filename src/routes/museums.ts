import { Router, type Request, type Response } from "express";
import { ObjectId } from "mongodb";
import { getMuseumsCollection, type Museum } from "../models/museums.js";
import { toClient, toClientMany } from "../lib/utils.js";

const router = Router();

function deriveTicketType(price: number): "Free" | "Paid" | "Premium" {
  if (price === 0) return "Free";
  if (price >= 25) return "Premium";
  return "Paid";
}

router.get("/", async (req: Request, res: Response) => {
  try {
    const col = await getMuseumsCollection();
    const {
      search,
      country,
      category,
      ticketType,
      sort,
      page = "1",
      limit = "12",
    } = req.query as Record<string, string>;

    const filter: Record<string, unknown> = {};

    if (search) {
      const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$or = [
        { title: regex },
        { city: regex },
        { country: regex },
        { category: regex },
        { description: regex },
      ];
    }
    if (country) filter.country = country;
    if (category) filter.category = category;
    if (ticketType) {
      if (ticketType === "Free") filter.ticketPrice = 0;
      else if (ticketType === "Premium") filter.ticketPrice = { $gte: 25 };
      else if (ticketType === "Paid") filter.ticketPrice = { $gt: 0, $lt: 25 };
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 12));
    const skip = (pageNum - 1) * limitNum;

    let sortObj: Record<string, 1 | -1> = { rating: -1 };
    if (sort === "price_asc") sortObj = { ticketPrice: 1 };
    else if (sort === "price_desc") sortObj = { ticketPrice: -1 };
    else if (sort === "name_asc") sortObj = { title: 1 };
    else if (sort === "rating_desc") sortObj = { rating: -1 };

    const [museums, total] = await Promise.all([
      col.find(filter).sort(sortObj).skip(skip).limit(limitNum).toArray(),
      col.countDocuments(filter),
    ]);

    res.json({
      museums: toClientMany(museums as any[]),
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (err) {
    console.error("[Museums] List error:", err);
    res.status(500).json({ error: "Failed to fetch museums" });
  }
});

router.get("/featured", async (_req: Request, res: Response) => {
  try {
    const col = await getMuseumsCollection();
    const museums = await col
      .find({ featured: true })
      .sort({ rating: -1 })
      .limit(8)
      .toArray();
    res.json(toClientMany(museums as any[]));
  } catch (err) {
    console.error("[Museums] Featured error:", err);
    res.status(500).json({ error: "Failed to fetch featured museums" });
  }
});

router.get("/stats/by-category", async (_req: Request, res: Response) => {
  try {
    const col = await getMuseumsCollection();
    const stats = await col
      .aggregate([
        { $group: { _id: "$category", count: { $sum: 1 } } },
        { $project: { category: "$_id", count: 1, _id: 0 } },
        { $sort: { count: -1 } },
      ])
      .toArray();
    res.json(stats);
  } catch (err) {
    console.error("[Museums] Stats by category error:", err);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

router.get("/stats/by-country", async (_req: Request, res: Response) => {
  try {
    const col = await getMuseumsCollection();
    const stats = await col
      .aggregate([
        { $group: { _id: "$country", count: { $sum: 1 } } },
        { $project: { country: "$_id", count: 1, _id: 0 } },
        { $sort: { count: -1 } },
      ])
      .toArray();
    res.json(stats);
  } catch (err) {
    console.error("[Museums] Stats by country error:", err);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

router.get("/:id/related", async (req: Request, res: Response) => {
  try {
    const col = await getMuseumsCollection();
    const museum = await col.findOne({ id: req.params.id });
    if (!museum) return res.status(404).json({ error: "Museum not found" });

    const related = await col
      .find({ category: museum.category, id: { $ne: museum.id } })
      .limit(4)
      .toArray();
    res.json(toClientMany(related as any[]));
  } catch (err) {
    console.error("[Museums] Related error:", err);
    res.status(500).json({ error: "Failed to fetch related museums" });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const col = await getMuseumsCollection();
    const museum = await col.findOne({ id: req.params.id });
    if (!museum) return res.status(404).json({ error: "Museum not found" });
    res.json(toClient(museum as any));
  } catch (err) {
    console.error("[Museums] Detail error:", err);
    res.status(500).json({ error: "Failed to fetch museum" });
  }
});

export default router;
