import express from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { env } from "./config/env.js";
import { connectDB } from "./config/db.js";
import { getAuth } from "./lib/auth.js";
import { authLimiter, generalLimiter } from "./middleware/rateLimit.js";
import museumRoutes from "./routes/museums.js";
import guideRoutes from "./routes/guides.js";
import favoriteRoutes from "./routes/favorites.js";
import reviewRoutes from "./routes/reviews.js";
import aiRoutes from "./routes/ai.js";
import statsRoutes from "./routes/stats.js";
import publicRoutes from "./routes/public.js";
import activityRoutes from "./routes/activity.js";

const app = express();

app.set("trust proxy", 1);

app.use(
  cors({
    origin: env.CLIENT_URL,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials: true,
  })
);

let initialized = false;
let initPromise: Promise<void> | null = null;

async function init() {
  if (initialized) return;
  if (!initPromise) {
    initPromise = (async () => {
      await connectDB();

      const auth = await getAuth();

      app.use(express.json());
      app.use(express.urlencoded({ extended: true }));

      app.all("/api/auth/*splat", authLimiter, toNodeHandler(auth!));

      app.get("/", (_req, res) => {
        res.send("MuseoAI Server is running");
      });

      app.get("/api/health", (_req, res) => {
        res.json({ status: "ok", service: "MuseoAI API" });
      });

      app.use("/api/museums", generalLimiter, museumRoutes);
      app.use("/api/guides", generalLimiter, guideRoutes);
      app.use("/api/favorites", generalLimiter, favoriteRoutes);
      app.use("/api/museums", generalLimiter, reviewRoutes);
      app.use("/api/ai", aiRoutes);
      app.use("/api", generalLimiter, statsRoutes);
      app.use("/api", generalLimiter, publicRoutes);
      app.use("/api", generalLimiter, activityRoutes);

      app.use((_req, res) => {
        res.status(404).json({ error: "Not found" });
      });

      app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
        console.error("[Error]", err.message);
        res.status(500).json({ error: "Internal server error" });
      });

      initialized = true;
    })();
  }
  await initPromise;
}

app.use(async (_req: express.Request, _res: express.Response, next: express.NextFunction) => {
  await init();
  next();
});

async function start() {
  await init();

  app.listen(env.PORT, () => {
    console.log(`[Server] MuseoAI API running on http://localhost:${env.PORT}`);
  });
}

if (env.NODE_ENV !== "production") {
  start().catch(console.error);
}

export default app;
