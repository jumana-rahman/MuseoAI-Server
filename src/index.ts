import express from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { env } from "./config/env.js";
import { connectDB } from "./config/db.js";
import { getAuth } from "./lib/auth.js";
import museumRoutes from "./routes/museums.js";
import guideRoutes from "./routes/guides.js";
import favoriteRoutes from "./routes/favorites.js";
import reviewRoutes from "./routes/reviews.js";
import aiRoutes from "./routes/ai.js";

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

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.all("/api/auth/*splat", toNodeHandler(auth));

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", service: "MuseoAI API" });
  });

  app.use("/api/museums", museumRoutes);
  app.use("/api/guides", guideRoutes);
  app.use("/api/favorites", favoriteRoutes);
  app.use("/api/museums", reviewRoutes);
  app.use("/api/ai", aiRoutes);

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
