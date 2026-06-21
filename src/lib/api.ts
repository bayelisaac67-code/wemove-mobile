import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

// 60s timeout: Render free tier sleeps after 15 min idle and takes ~30-50s to
// wake on the first request. A short timeout would make the first login fail.
export const api = axios.create({ baseURL: BASE_URL, timeout: 60000 });

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('wemove_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
