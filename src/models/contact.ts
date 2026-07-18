import { getDb } from "../config/db.js";
import type { Collection, ObjectId } from "mongodb";

export interface ContactMessage {
  _id?: ObjectId;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: Date;
  read: boolean;
}

export async function getContactsCollection(): Promise<Collection<ContactMessage>> {
  const db = await getDb();
  const col = db.collection<ContactMessage>("contacts");
  await col.createIndex({ createdAt: -1 });
  return col;
}

export interface NewsletterSubscriber {
  _id?: ObjectId;
  email: string;
  createdAt: Date;
}

export async function getNewsletterCollection(): Promise<Collection<NewsletterSubscriber>> {
  const db = await getDb();
  const col = db.collection<NewsletterSubscriber>("newsletter");
  await col.createIndex({ email: 1 }, { unique: true });
  return col;
}
