import { z } from "zod";

export const museumGuideSchema = z.object({
  museumId: z.string().min(1).max(100),
  message: z.string().min(1).max(1000),
  conversationId: z.string().max(100).optional(),
});

export const guideWriterSchema = z.object({
  museumId: z.string().min(1).max(100),
  targetAudience: z.string().min(1).max(50),
  visitDuration: z.string().min(1).max(50),
  interests: z.array(z.string().max(50)).max(10).optional(),
  length: z.enum(["short", "medium", "long"]).optional(),
});

export const recommendationsSchema = z.object({
  interests: z.array(z.string().max(50)).max(10).optional(),
  preferredCountry: z.string().max(100).optional(),
  budget: z.union([z.number(), z.string()]).optional(),
  travelDuration: z.string().max(50).optional(),
  travelType: z.string().max(50).optional(),
});

export const signalSchema = z.object({
  museumId: z.string().min(1).max(100),
  signalType: z.enum(["favorite_add", "favorite_remove", "museum_view", "like", "dislike"]),
});

export const reviewSchema = z.object({
  rating: z.string().or(z.number()).refine((v) => {
    const n = parseInt(String(v), 10);
    return !isNaN(n) && n >= 1 && n <= 5;
  }, "Rating must be 1-5"),
  review: z.string().min(10).max(2000),
});

export const guideCreateSchema = z.object({
  title: z.string().min(3).max(200),
  museumId: z.string().min(1).max(100),
  targetAudience: z.string().min(1).max(50),
  visitDuration: z.string().min(1).max(50),
  shortDescription: z.string().max(500).optional(),
  guideContent: z.string().min(10).max(50000),
  coverImage: z.string().url().max(500).optional(),
});

export const contactSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  subject: z.string().min(3).max(200),
  message: z.string().min(10).max(5000),
});

export const newsletterSchema = z.object({
  email: z.string().email(),
});
