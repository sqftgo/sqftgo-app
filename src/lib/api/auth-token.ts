import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const ACCESS_KEY = "sqftgo_access_token";
const REFRESH_KEY = "sqftgo_refresh_token";
const EXPIRES_KEY = "sqftgo_token_expires_at";

/** SecureStore is unavailable on web; AsyncStorage keeps the web build working. */
const useSecureStore = Platform.OS !== "web";

async function readItem(key: string): Promise<string | null> {
  try {
    if (useSecureStore) return await SecureStore.getItemAsync(key);
    return await AsyncStorage.getItem(key);
  } catch {
    return null;
  }
}

async function writeItem(key: string, value: string | null): Promise<void> {
  try {
    if (useSecureStore) {
      if (value) await SecureStore.setItemAsync(key, value);
      else await SecureStore.deleteItemAsync(key);
      return;
    }
    if (value) await AsyncStorage.setItem(key, value);
    else await AsyncStorage.removeItem(key);
  } catch {
    // ignore storage errors
  }
}

export type StoredTokens = {
  accessToken: string | null;
  refreshToken: string | null;
  /** Unix seconds */
  expiresAt: number | null;
};

let cache: StoredTokens | null = null;

export async function getTokens(): Promise<StoredTokens> {
  if (cache) return cache;
  const [accessToken, refreshToken, expires] = await Promise.all([
    readItem(ACCESS_KEY),
    readItem(REFRESH_KEY),
    readItem(EXPIRES_KEY),
  ]);
  // One-time migration from the legacy AsyncStorage key.
  let access = accessToken;
  if (!access && useSecureStore) {
    try {
      access = await AsyncStorage.getItem(ACCESS_KEY);
      if (access) {
        await SecureStore.setItemAsync(ACCESS_KEY, access);
        await AsyncStorage.removeItem(ACCESS_KEY);
      }
    } catch {
      access = null;
    }
  }
  const parsed = expires ? Number(expires) : NaN;
  cache = {
    accessToken: access,
    refreshToken,
    expiresAt: Number.isFinite(parsed) ? parsed : null,
  };
  return cache;
}

export async function getAccessToken(): Promise<string | null> {
  return (await getTokens()).accessToken;
}

export async function setTokens(next: Partial<StoredTokens>): Promise<void> {
  const current = await getTokens();
  const merged: StoredTokens = {
    accessToken: next.accessToken !== undefined ? next.accessToken : current.accessToken,
    refreshToken: next.refreshToken !== undefined ? next.refreshToken : current.refreshToken,
    expiresAt: next.expiresAt !== undefined ? next.expiresAt : current.expiresAt,
  };
  cache = merged;
  await Promise.all([
    writeItem(ACCESS_KEY, merged.accessToken),
    writeItem(REFRESH_KEY, merged.refreshToken),
    writeItem(EXPIRES_KEY, merged.expiresAt != null ? String(merged.expiresAt) : null),
  ]);
}

export async function setAccessToken(token: string | null): Promise<void> {
  if (token === null) {
    await clearTokens();
    return;
  }
  await setTokens({ accessToken: token });
}

export async function clearTokens(): Promise<void> {
  await setTokens({ accessToken: null, refreshToken: null, expiresAt: null });
}
