import "server-only";
import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.url(),
  BETTER_AUTH_SECRET: z.string().min(32, "Generate one with: openssl rand -base64 32"),
  APP_URL: z.url().default("http://localhost:3000"),
  // Google login is enabled only when both are set.
  GOOGLE_CLIENT_ID: z.string().min(1).optional(),
  GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),
  // Without a Resend key, emails are printed to the server console (dev).
  RESEND_API_KEY: z.string().min(1).optional(),
  EMAIL_FROM: z.string().min(1).default("Monica <onboarding@resend.dev>"),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
    .join("\n");
  throw new Error(`Invalid environment variables (check .env.local):\n${issues}`);
}

export const env = parsed.data;
