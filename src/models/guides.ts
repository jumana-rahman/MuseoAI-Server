import { getDb } from "../config/db.js";
import type { Collection, ObjectId } from "mongodb";

export interface MuseumGuide {
  _id?: ObjectId;
  title: string;
  museumId: string;
  targetAudience: string;
  visitDuration: string;
  shortDescription: string;
  guideContent: string;
  coverImage: string;
  authorId: string;
  createdAt: Date;
  likes: number;
  likedBy: string[];
}

export async function getGuidesCollection(): Promise<Collection<MuseumGuide>> {
  const db = await getDb();
  const col = db.collection<MuseumGuide>("museumGuides");

  await col.createIndex({ museumId: 1 });
  await col.createIndex({ authorId: 1 });
  await col.createIndex({ createdAt: -1 });

  return col;
}
