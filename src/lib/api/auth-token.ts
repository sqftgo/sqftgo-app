import AsyncStorage from "@react-native-async-storage/async-storage";

const TOKEN_KEY = "sqftgo_access_token";

export async function getAccessToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function setAccessToken(token: string | null): Promise<void> {
  try {
    if (token) {
      await AsyncStorage.setItem(TOKEN_KEY, token);
    } else {
      await AsyncStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    // ignore storage errors
  }
}
