/** Public Supabase project coordinates. The key is a publishable client key, never a service role key. */
export const SUPABASE_URL = (process.env.EXPO_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "");
export const SUPABASE_KEY = process.env.EXPO_PUBLIC_SUPABASE_KEY ?? "";

export const mobileAuthConfigured = Boolean(SUPABASE_URL && SUPABASE_KEY);
