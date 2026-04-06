import AsyncStorage from '@react-native-async-storage/async-storage';

const TM_MODEL_URL_KEY = '@vuka/tm_model_url';

export async function getTMModelUrl(): Promise<string> {
  try {
    const url = await AsyncStorage.getItem(TM_MODEL_URL_KEY);
    return url ?? '';
  } catch {
    return '';
  }
}

export async function setTMModelUrl(url: string): Promise<void> {
  try {
    await AsyncStorage.setItem(TM_MODEL_URL_KEY, url.trim());
  } catch {}
}

export function isValidTMUrl(url: string): boolean {
  return url.startsWith('https://teachablemachine.withgoogle.com/models/') && url.endsWith('/');
}
