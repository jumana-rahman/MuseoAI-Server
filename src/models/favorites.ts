import { getDb } from "../config/db.js";
import type { Collection, ObjectId } from "mongodb";

export interface Favorite {
  _id?: ObjectId;
  userId: string;
  museumId: string;
  createdAt: Date;
}

export async function getFavoritesCollection(): Promise<Collection<Favorite>> {
  const db = await getDb();
  const col = db.collection<Favorite>("favorites");

  await col.createIndex({ userId: 1, museumId: 1 }, { unique: true });
  await col.createIndex({ userId: 1 });

  return col;
}
