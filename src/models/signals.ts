import { getDb } from "../config/db.js";
import type { Collection, ObjectId } from "mongodb";

export interface RecommendationSignal {
  _id?: ObjectId;
  userId: string;
  museumId: string;
  signalType: "favorite_add" | "favorite_remove" | "museum_view" | "like" | "dislike";
  createdAt: Date;
}

export async function getSignalsCollection(): Promise<Collection<RecommendationSignal>> {
  const db = await getDb();
  const col = db.collection<RecommendationSignal>("recommendationSignals");

  await col.createIndex({ userId: 1 });
  await col.createIndex({ userId: 1, museumId: 1 });
  await col.createIndex({ createdAt: -1 });

  return col;
}
