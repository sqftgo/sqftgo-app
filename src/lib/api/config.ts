/**
 * When EXPO_PUBLIC_API_URL is set, the app talks to Next /api/* with Bearer auth.
 * When unset, AppContext stays on AsyncStorage mock (offline demo).
 */
const raw = process.env.EXPO_PUBLIC_API_URL?.trim() ?? "";

export const API_BASE_URL = raw.replace(/\/$/, "");

export const isApiMode = API_BASE_URL.length > 0;
