import { getDb } from "../config/db.js";
import type { Collection, ObjectId } from "mongodb";

export interface Museum {
  _id?: ObjectId;
  id: string;
  title: string;
  country: string;
  city: string;
  category: string;
  description: string;
  history: string;
  ticketPrice: number;
  ticketType: "Free" | "Paid" | "Premium";
  openingHours: string;
  rating: number;
  reviewCount: number;
  coverImage: string;
  gallery: string[];
  coordinates: { lat: number; lng: number };
  facilities: string[];
  visitorTips: string[];
  featured: boolean;
  createdAt: Date;
}

export async function getMuseumsCollection(): Promise<Collection<Museum>> {
  const db = await getDb();
  const col = db.collection<Museum>("museums");

  await col.createIndex({ title: "text", description: "text" });
  await col.createIndex({ country: 1 });
  await col.createIndex({ category: 1 });
  await col.createIndex({ rating: -1 });
  await col.createIndex({ ticketPrice: 1 });
  await col.createIndex({ featured: 1 });
  await col.createIndex({ id: 1 }, { unique: true });

  return col;
}
