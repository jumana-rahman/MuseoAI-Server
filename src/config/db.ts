import { MongoClient, type Db } from "mongodb";
import { env } from "./env.js";

const options = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

const globalWithMongo = global as typeof globalThis & {
  _mongoClientPromise?: Promise<MongoClient>;
};

if (process.env.NODE_ENV === "development") {
  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(env.MONGODB_URI, options);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  client = new MongoClient(env.MONGODB_URI, options);
  clientPromise = client.connect();
}

export async function connectDB(): Promise<void> {
  const mongoClient = await clientPromise;
  console.log(`[DB] Connected to ${mongoClient.options?.dbName || "default"} database`);
}

export async function getDb(): Promise<Db> {
  const mongoClient = await clientPromise;
  return mongoClient.db();
}

export default clientPromise;
