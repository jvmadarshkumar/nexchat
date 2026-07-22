/**
 * mockApi.js
 * REST API client & real-time WebSocket initialization layer.
 * Communicates with the Express backend on http://localhost:3001 via Vite's proxy.
 */

import axios from 'axios';
import { io } from 'socket.io-client';

// ─── Axios Instance ────────────────────────────────────────────────────────────
const API_URL = import.meta.env.VITE_API_URL || '';
const apiClient = axios.create({
  baseURL: import.meta.env.DEV ? '/api' : (API_URL ? `${API_URL}/api` : '/api'),
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor: attach a token dynamically from localStorage ─────────
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('nexchat_token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor: unwrap `data` ──────────────────────────────────────
apiClient.interceptors.response.use(
  (response) => {
    console.debug(`[NexChat API] ${response.config.method?.toUpperCase()} ${response.config.url}`, response.data);
    return response.data;
  },
  (error) => {
    console.error('[NexChat API] Error:', error.response?.data?.error || error.message);
    return Promise.reject(error);
  }
);

// ─── Socket.IO Client Setup ──────────────────────────────────────────────────

export const socket = io(import.meta.env.DEV ? '/' : (API_URL || '/'), {
  autoConnect: false, // Wait until we connect on Dashboard mount
});

// ─── API Functions ─────────────────────────────────────────────────────────────

/**
 * Registers a new user.
 * @param {{ name: string, email: string, password: string, color: string }} payload
 */
export const registerUser = async (payload) => {
  return apiClient.post('/auth/register', payload);
};

/**
 * Verifies the 6-digit OTP code for registration confirmation.
 * @param {{ email: string, otp: string }} payload
 */
export const verifyOtp = async (payload) => {
  return apiClient.post('/auth/verify-otp', payload);
};

/**
 * Logins an existing user.
 * @param {{ email: string, password: string }} payload
 */
export const loginUser = async (payload) => {
  return apiClient.post('/auth/login', payload);
};

/**
 * Fetches the list of chat rooms from backend.
 */
export const fetchChats = async () => {
  return apiClient.get('/chats');
};

/**
 * Fetches message history for a specific chat.
 */
export const fetchMessages = async (chatId) => {
  return apiClient.get(`/chats/${chatId}/messages`);
};

/**
 * Posts a new message to the backend.
 */
export const postMessage = async (chatId, text) => {
  return apiClient.post(`/chats/${chatId}/messages`, { text });
};

/**
 * Updates the user profile on the backend server.
 */
export const patchProfile = async (payload) => {
  return apiClient.patch('/users/me', payload);
};

/**
 * Searches registered users by name or email.
 * @param {string} query
 */
export const searchUsers = async (query = '') => {
  return apiClient.get(`/users/search?q=${encodeURIComponent(query)}`);
};

/**
 * Creates or retrieves a direct 1-on-1 chat room with a target user.
 * @param {number|string} targetUserId
 */
export const createDirectChat = async (targetUserId) => {
  return apiClient.post('/chats/direct', { targetUserId });
};

export default apiClient;
