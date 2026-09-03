/**
 * When EXPO_PUBLIC_API_URL is set (see .env / .env.example), the app talks to
 * the Next.js BFF at that origin with Bearer auth — same Supabase data as web.
 * When unset, AppContext stays on AsyncStorage mock (offline demo only).
 */
const raw = process.env.EXPO_PUBLIC_API_URL?.trim() ?? "";

export const API_BASE_URL = raw.replace(/\/$/, "");

export const isApiMode = API_BASE_URL.length > 0;
