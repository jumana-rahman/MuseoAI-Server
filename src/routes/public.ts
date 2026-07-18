import { Router, type Request, type Response } from "express";
import { getContactsCollection, getNewsletterCollection } from "../models/contact.js";
import { contactSchema, newsletterSchema } from "../middleware/validation.js";

const router = Router();

router.post("/contact", async (req: Request, res: Response) => {
  try {
    const parsed = contactSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0].message });
    }
    const col = await getContactsCollection();
    await col.insertOne({ ...parsed.data, createdAt: new Date(), read: false });
    res.status(201).json({ message: "Message sent successfully" });
  } catch (err) {
    console.error("[Contact] Error:", err);
    res.status(500).json({ error: "Failed to send message" });
  }
});

router.post("/newsletter", async (req: Request, res: Response) => {
  try {
    const parsed = newsletterSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Please provide a valid email address" });
    }
    const col = await getNewsletterCollection();
    const existing = await col.findOne({ email: parsed.data.email });
    if (existing) {
      return res.json({ message: "You are already subscribed!" });
    }
    await col.insertOne({ email: parsed.data.email, createdAt: new Date() });
    res.status(201).json({ message: "Subscribed successfully!" });
  } catch (err) {
    console.error("[Newsletter] Error:", err);
    res.status(500).json({ error: "Failed to subscribe" });
  }
});

export default router;
