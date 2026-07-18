import { getDb } from "../config/db.js";
import type { Collection, ObjectId } from "mongodb";

export interface Review {
  _id?: ObjectId;
  museumId: string;
  userId: string;
  rating: number;
  review: string;
  createdAt: Date;
}

export async function getReviewsCollection(): Promise<Collection<Review>> {
  const db = await getDb();
  const col = db.collection<Review>("reviews");

  await col.createIndex({ museumId: 1 });
  await col.createIndex({ userId: 1 });
  await col.createIndex({ museumId: 1, userId: 1 }, { unique: true });

  return col;
}
