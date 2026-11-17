import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase client using the service-role key.
 *
 * This key bypasses Row Level Security and must NEVER be imported into client
 * components or exposed to the browser. All database access in this app goes
 * through this client inside server code (API routes / server components), so
 * participant emails and tokens never reach the client.
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function isSupabaseConfigured(): boolean {
  return Boolean(url && serviceRoleKey);
}

let cached: SupabaseClient | null = null;

/**
 * Returns the admin client, or null when Supabase env vars are not set.
 * Callers must handle the null case honestly (respond "not configured")
 * rather than pretending the database is connected.
 */
export function getAdminClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  if (cached) return cached;
  cached = createClient(url!, serviceRoleKey!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}
