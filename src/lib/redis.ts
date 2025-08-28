import { Redis } from '@upstash/redis';

if (!process.env.KV_URL || !process.env.KV_REST_API_TOKEN) {
  throw new Error("Missing Upstash Redis environment variables");
}

export const redis = new Redis({
  url: process.env.KV_URL,
  token: process.env.KV_REST_API_TOKEN,
});
