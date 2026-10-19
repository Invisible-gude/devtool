import type { Config } from "@netlify/functions";
import { getDb } from "../../db/index.js";
import { users } from "../../db/schema.js";

export default async (request: Request) => {
  const headers = { "Cache-Control": "no-store" };
  if (request.method !== "GET") {
    return new Response("Method not allowed", {
      status: 405,
      headers: { ...headers, Allow: "GET" },
    });
  }

  try {
    // Verify connectivity and the migrated table without reading any user records.
    await getDb().select({ id: users.id }).from(users).limit(0);
    return Response.json({ status: "ok" }, { headers });
  } catch {
    return Response.json({ status: "unavailable" }, { status: 503, headers });
  }
};

export const config: Config = { path: "/api/database-health" };
