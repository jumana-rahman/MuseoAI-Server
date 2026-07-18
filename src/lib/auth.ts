import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { getDb } from "../config/db.js";
import { env } from "../config/env.js";

let _auth: ReturnType<typeof betterAuth> | null = null;

export async function getAuth() {
  if (_auth) return _auth;

  const db = await getDb();

  _auth = betterAuth({
    database: mongodbAdapter(db),
    emailAndPassword: {
      enabled: true,
    },
    socialProviders: {
      google: {
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
      },
    },
    session: {
      cookieCache: {
        enabled: true,
        maxAge: 5 * 60,
      },
    },
    trustedOrigins: [env.CLIENT_URL],
    baseURL: env.BETTER_AUTH_URL,
  });

  return _auth;
}
