import { create, isAxiosError } from 'axios';
import type {
  AdminClaim,
  AdminStats,
  Claim,
  Item,
  ItemDetails,
  ItemType,
  MyClaim,
  PickedImage,
  ReceivedClaim,
  User,
} from '@/types';

/**
 * Backend address, from mobile/.env:
 *   Android emulator  -> http://10.0.2.2:5000
 *   Physical phone    -> http://<your computer's LAN IP>:5000
 */
export const API_URL = (process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:5000').replace(/\/+$/, '');

const api = create({ baseURL: `${API_URL}/api`, timeout: 20000 });

// ---- Token handling -------------------------------------------------------

let authToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

/** Called by AuthContext whenever the user logs in or out. */
export function setAuthToken(token: string | null) {
  authToken = token;
}

/** AuthContext registers a callback so an expired/invalid token logs the user out. */
export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

api.interceptors.request.use((config) => {
  if (authToken) config.headers.Authorization = `Bearer ${authToken}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // A 401 from login/register just means wrong credentials; anywhere else the token is no longer valid.
    const isCredentialsRequest = ['/auth/login', '/auth/register'].includes(String(error.config?.url));
    if (error.response?.status === 401 && authToken && !isCredentialsRequest) {
      onUnauthorized?.();
    }
    return Promise.reject(error);
  }
);

/** Turns any request error into a message that can be shown to the user. */
export function getErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    const serverMessage = (error.response?.data as { message?: string } | undefined)?.message;
    if (serverMessage) return serverMessage;
    if (error.code === 'ECONNABORTED') return 'The server took too long to respond. Please try again.';
    if (!error.response) {
      return `Cannot reach the server at ${API_URL}. Check your internet connection, make sure the backend is running and EXPO_PUBLIC_API_URL is correct.`;
    }
    return `Request failed (${error.response.status})`;
  }
  return 'Something went wrong. Please try again.';
}

/** Adds a picked image to a multipart form under the "image" field the backend expects. */
function appendImage(form: FormData, image: PickedImage) {
  // React Native's FormData accepts a { uri, name, type } object for files. The TypeScript
  // DOM typings only know about Blob, hence the cast.
  const file = { uri: image.uri, name: image.name, type: image.mimeType };
  form.append('image', file as unknown as Blob);
}

// Uploads can be slow on mobile data, so multipart requests get a longer timeout.
const MULTIPART = { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 60000 };

// ---- Endpoints -------------------------------------------------------------

interface AuthResult {
  token: string;
  user: User;
}

export interface NewAccount {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  image?: PickedImage;
}

export const authApi = {
  async login(email: string, password: string): Promise<AuthResult> {
    const res = await api.post('/auth/login', { email, password });
    return res.data.data;
  },
  async register({ image, ...fields }: NewAccount): Promise<AuthResult> {
    if (!image) {
      const res = await api.post('/auth/register', fields);
      return res.data.data;
    }
    const form = new FormData();
    Object.entries(fields).forEach(([key, value]) => form.append(key, value));
    appendImage(form, image);
    const res = await api.post('/auth/register', form, MULTIPART);
    return res.data.data;
  },
  async me(): Promise<User> {
    const res = await api.get('/auth/me');
    return res.data.data.user;
  },
};

export const profileApi = {
  async updateName(name: string): Promise<User> {
    const res = await api.patch('/users/profile', { name });
    return res.data.data.user;
  },
  async uploadPhoto(image: PickedImage): Promise<User> {
    const form = new FormData();
    appendImage(form, image);
    const res = await api.post('/users/profile/image', form, MULTIPART);
    return res.data.data.user;
  },
  async removePhoto(): Promise<User> {
    const res = await api.delete('/users/profile/image');
    return res.data.data.user;
  },
};

export interface NewItem {
  title: string;
  type: ItemType;
  category: string;
  description: string;
  location: string;
  date: string; // YYYY-MM-DD
  image?: PickedImage;
}

export const itemsApi = {
  async list(type: 'ALL' | ItemType = 'ALL'): Promise<Item[]> {
    const res = await api.get('/items', { params: type === 'ALL' ? {} : { type } });
    return res.data.data.items;
  },
  async get(id: string): Promise<ItemDetails> {
    const res = await api.get(`/items/${id}`);
    return res.data.data;
  },
  async mine(): Promise<Item[]> {
    const res = await api.get('/items/my');
    return res.data.data.items;
  },
  async create({ image, ...fields }: NewItem): Promise<Item> {
    // Sent as multipart/form-data so the optional image can travel with the fields.
    const form = new FormData();
    Object.entries(fields).forEach(([key, value]) => form.append(key, value));
    if (image) appendImage(form, image);
    const res = await api.post('/items', form, MULTIPART);
    return res.data.data.item;
  },
  async markRecovered(id: string): Promise<Item> {
    const res = await api.patch(`/items/${id}/status`, { status: 'RECOVERED' });
    return res.data.data.item;
  },
  async remove(id: string): Promise<void> {
    await api.delete(`/items/${id}`);
  },
};

export const claimsApi = {
  async submit(itemId: string, description: string): Promise<void> {
    await api.post(`/items/${itemId}/claims`, { description });
  },
  async forItem(itemId: string): Promise<Claim[]> {
    const res = await api.get(`/items/${itemId}/claims`);
    return res.data.data.claims;
  },
  async approve(itemId: string, claimId: string): Promise<string> {
    const res = await api.patch(`/items/${itemId}/claims/${claimId}`, { action: 'APPROVE' });
    return res.data.message;
  },
  async reject(itemId: string, claimId: string, reason: string): Promise<string> {
    const res = await api.patch(`/items/${itemId}/claims/${claimId}`, { action: 'REJECT', reason });
    return res.data.message;
  },
  async mine(): Promise<MyClaim[]> {
    const res = await api.get('/claims/my');
    return res.data.data.claims;
  },
  async received(): Promise<ReceivedClaim[]> {
    const res = await api.get('/claims/received');
    return res.data.data.claims;
  },
};

export const adminApi = {
  async stats(): Promise<AdminStats> {
    const res = await api.get('/admin/dashboard/stats');
    return res.data.data.stats;
  },
  async listAll(): Promise<Item[]> {
    const res = await api.get('/admin/items');
    return res.data.data.items;
  },
  async claims(status: 'PENDING' | 'ALL' = 'PENDING'): Promise<AdminClaim[]> {
    const res = await api.get('/admin/claims', { params: { status } });
    return res.data.data.claims;
  },
  async remove(id: string): Promise<void> {
    await api.delete(`/admin/items/${id}`);
  },
};
