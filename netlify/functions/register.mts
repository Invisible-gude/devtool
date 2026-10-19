import type { Config } from "@netlify/functions";
import { getDb } from "../../db/index.js";
import { users } from "../../db/schema.js";
import { register } from "./lib/registration.js";

export default async (request: Request) => register(request, async (user) => {
  const inserted = await getDb().insert(users).values(user)
    .onConflictDoNothing({ target: users.email })
    .returning({ id: users.id });
  return inserted.length > 0;
});

export const config: Config = {
  path: "/api/register",
  rateLimit: { windowLimit: 10, windowSize: 60, aggregateBy: "ip" },
};
