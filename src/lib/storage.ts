import AsyncStorage from "@react-native-async-storage/async-storage";

export async function getStorageItem(key: string): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(key);
  } catch (error) {
    console.warn(`[Storage] Failed to read key "${key}":`, error);
    return null;
  }
}

export async function setStorageItem(key: string, value: string): Promise<void> {
  try {
    await AsyncStorage.setItem(key, value);
  } catch (error) {
    console.warn(`[Storage] Failed to write key "${key}":`, error);
  }
}

export async function removeStorageItem(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.warn(`[Storage] Failed to remove key "${key}":`, error);
  }
}
