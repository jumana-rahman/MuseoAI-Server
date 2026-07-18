import express from "express";
import cors from "cors";
import { toNodeHandler, fromNodeHeaders } from "better-auth/node";
import { env } from "./config/env.js";
import { connectDB } from "./config/db.js";
import { getAuth } from "./lib/auth.js";

const app = express();

app.set("trust proxy", 1);

app.use(
  cors({
    origin: env.CLIENT_URL,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials: true,
  })
);

async function setupAuth() {
  const auth = await getAuth();

  app.all("/api/auth/*splat", toNodeHandler(auth));

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", service: "MuseoAI API" });
  });

  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error("[Error]", err.message);
    res.status(500).json({ error: "Internal server error" });
  });
}

async function start() {
  await connectDB();
  await setupAuth();

  if (env.NODE_ENV !== "production") {
    app.listen(env.PORT, () => {
      console.log(`[Server] MuseoAI API running on http://localhost:${env.PORT}`);
    });
  }
}

start().catch(console.error);

export default app;
