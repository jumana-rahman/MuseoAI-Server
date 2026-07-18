import { getDb } from "../config/db.js";
import type { Collection, ObjectId } from "mongodb";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface AIConversation {
  _id?: ObjectId;
  userId: string;
  museumId: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export async function getConversationsCollection(): Promise<Collection<AIConversation>> {
  const db = await getDb();
  const col = db.collection<AIConversation>("aiConversations");

  await col.createIndex({ userId: 1, museumId: 1 });
  await col.createIndex({ userId: 1 });

  return col;
}
