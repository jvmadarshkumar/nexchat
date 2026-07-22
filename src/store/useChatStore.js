/**
 * useChatStore.js
 * Global Zustand store for NexChat.
 * Manages: currentUser, chats, messages, activeChatId, token, isAuthenticated
 * Actions: setActiveChat, addMessage, updateProfile, setChats, setMessagesForChat, addReceivedMessage, setCurrentUser, login, logout
 */

import { create } from 'zustand';

// ─── Initial Seed Data ───────────────────────────────────────────────────────

const INITIAL_CHATS = [
  { id: 3, name: 'Design Hub',      type: 'workspace', avatar: 'DH', color: '#10B981' },
  { id: 4, name: 'Engineering',     type: 'workspace', avatar: 'EN', color: '#F59E0B' },
  { id: 5, name: '# general',       type: 'channel',   avatar: '#G', color: '#EC4899' },
  { id: 6, name: '# announcements', type: 'channel',   avatar: '#A', color: '#8B5CF6' },
  { id: 8, name: '# random',        type: 'channel',   avatar: '#R', color: '#06B6D4' },
];

// ─── Store Definition ─────────────────────────────────────────────────────────

const useChatStore = create((set) => ({
  // ── State ──────────────────────────────────────────────────────────────────

  /** Token for authentication session */
  token: localStorage.getItem('nexchat_token') || null,

  /** Logged-in state */
  isAuthenticated: !!localStorage.getItem('nexchat_token'),

  /** The logged-in user */
  currentUser: null,

  /** Full list of chat rooms / DMs / channels */
  chats: INITIAL_CHATS,

  /** Message map: { [chatId]: Message[] } */
  messages: {},

  /** ID of the chat currently open in the right panel */
  activeChatId: localStorage.getItem('nexchat_active_chat_id') ? (isNaN(localStorage.getItem('nexchat_active_chat_id')) ? localStorage.getItem('nexchat_active_chat_id') : Number(localStorage.getItem('nexchat_active_chat_id'))) : 1,

  // ── Actions ────────────────────────────────────────────────────────────────

  /**
   * Log inside store and save JWT token.
   */
  login: (user, token) => {
    localStorage.setItem('nexchat_token', token);
    set({ currentUser: user, token, isAuthenticated: true });
  },

  /**
   * Log out from workspace and clear credentials.
   */
  logout: () => {
    localStorage.removeItem('nexchat_token');
    localStorage.removeItem('nexchat_active_chat_id');
    set({ currentUser: null, token: null, isAuthenticated: false, messages: {} });
  },

  /**
   * Set the list of chats loaded from backend.
   */
  setChats: (chats) => set({ chats }),

  /**
   * Set user profile.
   */
  setCurrentUser: (user) => set({ currentUser: user, isAuthenticated: true }),

  /**
   * Set which chat is currently visible in the right panel.
   */
  setActiveChat: (id) => {
    localStorage.setItem('nexchat_active_chat_id', id);
    set({ activeChatId: id });
  },

  /**
   * Set messages history for a chat.
   */
  setMessagesForChat: (chatId, list) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [chatId]: list,
      },
    })),

  /**
   * Append a new message locally.
   */
  addReceivedMessage: (chatId, message) =>
    set((state) => {
      const existing = state.messages[chatId] || [];
      if (existing.some((m) => m.id === message.id)) return {};

      const chatsCopy = [...state.chats];
      const chatIndex = chatsCopy.findIndex((c) => String(c.id) === String(chatId));
      if (chatIndex !== -1) {
        chatsCopy[chatIndex] = {
          ...chatsCopy[chatIndex],
          lastMessage: message.text,
        };
      }

      return {
        chats: chatsCopy,
        messages: {
          ...state.messages,
          [chatId]: [...existing, message],
        },
      };
    }),

  /**
   * Action trigger to update local store profile state.
   */
  updateProfile: (name, bio, avatar) =>
    set((state) => ({
      currentUser: { ...state.currentUser, name, bio, avatar: avatar !== undefined ? avatar : state.currentUser.avatar },
    })),

  /**
   * Adds a new chat or updates an existing chat in the store.
   */
  addOrUpdateChat: (newChat) =>
    set((state) => {
      const exists = state.chats.some((c) => String(c.id) === String(newChat.id));
      if (exists) {
        return {
          chats: state.chats.map((c) => (String(c.id) === String(newChat.id) ? { ...c, ...newChat } : c)),
        };
      }
      return {
        chats: [newChat, ...state.chats],
      };
    }),

  /**
   * Updates lastMessage for a chat in store cleanly without stale closures.
   */
  updateChatLastMessage: (chatId, lastMessage) =>
    set((state) => ({
      chats: state.chats.map((c) =>
        String(c.id) === String(chatId) ? { ...c, lastMessage } : c
      ),
    })),

  /**
   * Resets unread notification count for a chat.
   */
  clearUnread: (chatId) =>
    set((state) => ({
      chats: state.chats.map((c) =>
        String(c.id) === String(chatId) ? { ...c, unread: 0 } : c
      ),
    })),

  /**
   * Marks all messages in a chat as seen.
   */
  markMessagesSeen: (chatId) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [chatId]: (state.messages[chatId] || []).map((m) => ({ ...m, status: 'seen' })),
      },
    })),

  /**
   * Removes a chat room from the store.
   */
  removeChat: (chatId) =>
    set((state) => ({
      chats: state.chats.filter((c) => String(c.id) !== String(chatId)),
    })),
}));

export default useChatStore;
