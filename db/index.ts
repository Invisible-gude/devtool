import { drizzle } from "drizzle-orm/netlify-db";
import * as schema from "./schema.js";

// Initialize inside a server request so the platform supplies the correct database branch.
export function getDb() {
  return drizzle({ schema });
}
