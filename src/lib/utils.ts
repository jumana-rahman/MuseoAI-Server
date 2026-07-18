import { ObjectId } from "mongodb";

export function toClient<T extends Record<string, unknown>>(doc: T): T {
  if (!doc) return doc;
  const { _id, ...rest } = doc as any;
  return { id: _id instanceof ObjectId ? _id.toHexString() : _id, ...rest } as T;
}

export function toClientMany<T extends Record<string, unknown>>(docs: T[]): T[] {
  return docs.map(toClient);
}
