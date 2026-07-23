/**
 * Dashboard.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * NexChat main workspace: 3-panel responsive layout
 *   [Left] Icon nav sidebar   – tab switcher + logout + settings
 *   [Mid]  Chat list panel    – search + filtered list via useMemo
 *   [Right] Chat window       – message bubbles + auto-scroll + send form
 */

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useChatStore from '../store/useChatStore';
import apiClient, { fetchChats, fetchMessages, postMessage, searchUsers, createDirectChat, socket } from '../utils/mockApi';
import { Phone, Video as VideoIcon, Paperclip, UserX, ShieldAlert, CheckSquare, BarChart2, Sun, Moon, FileText, Image as ImageIcon, Download, Users as UsersIcon, Flame as FlameIcon, Plus, Info } from 'lucide-react';
import CallModal from '../components/CallModal';
import TaskBoardModal from '../components/TaskBoardModal';
import PollModal from '../components/PollModal';
import CreateGroupModal from '../components/CreateGroupModal';
import CommunityFeed from '../components/CommunityFeed';
import GroupInfoDrawer from '../components/GroupInfoDrawer';

// ─── Icon Components ──────────────────────────────────────────────────────────

const IconMsg = ({ active }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 1.8}
    className={`w-6 h-6 transition-all ${active ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-200'}`}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);

const IconGroup = ({ active }) => (
  <UsersIcon className={`w-6 h-6 transition-all ${active ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-200'}`} />
);

const IconTrending = ({ active }) => (
  <FlameIcon className={`w-6 h-6 transition-all ${active ? 'text-amber-400' : 'text-slate-400 group-hover:text-slate-200'}`} />
);

const IconSettings = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}
    className="w-5 h-5 text-slate-400 group-hover:text-slate-200 transition-colors">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const IconLogout = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}
    className="w-5 h-5 text-slate-400 group-hover:text-rose-400 transition-colors">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

const IconSend = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
    className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
  </svg>
);

const IconSearch = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}
    className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
  </svg>
);

// ─── Avatar Component ─────────────────────────────────────────────────────────

const Avatar = ({ label, color, size = 'md' }) => {
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-11 h-11 text-sm' };
  const isUrl = typeof label === 'string' && (label.startsWith('/') || label.startsWith('http') || label.includes('.'));
  return (
    <div
      className={`${sizes[size]} rounded-xl flex items-center justify-center font-bold text-white shrink-0 select-none overflow-hidden`}
      style={{ background: `linear-gradient(135deg, ${color}CC, ${color}66)`, boxShadow: `0 0 0 1px ${color}44` }}>
      {isUrl ? (
        <img src={label} alt="Avatar" className="w-full h-full object-cover" />
      ) : (
        label?.slice(0, 2).toUpperCase()
      )}
    </div>
  );
};

// ─── Tab definitions ──────────────────────────────────────────────────────────

const TABS = [
  { id: 'direct',   label: 'Direct Messages',             Icon: IconMsg },
  { id: 'groups',   label: 'Group Chats & Workspaces',     Icon: IconGroup },
  { id: 'trending', label: 'Community Feed & Trending',  Icon: IconTrending },
];

// ─── Left Sidebar ─────────────────────────────────────────────────────────────

const NavSidebar = ({ activeTab, onTabChange, currentUser, onSettings, onLogout, theme, toggleTheme }) => {
  const isLight = theme === 'light';
  return (
    <aside className={`w-16 flex flex-col items-center py-4 gap-2 border-r shrink-0 transition-colors duration-200 ${
      isLight ? 'bg-slate-200/80 border-slate-300 text-slate-800' : 'bg-slate-950 border-slate-800/60 text-slate-100'
    }`}>
      {/* Logo */}
      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-3 shadow-lg shadow-indigo-500/30 animate-pulse">
        <span className="text-white font-extrabold text-sm tracking-tight">NX</span>
      </div>

      <div className={`w-8 h-px mb-2 ${isLight ? 'bg-slate-300' : 'bg-slate-800'}`} />

      {/* Tab buttons */}
      {TABS.map(({ id, label, Icon }) => (
        <button
          key={id}
          id={`nav-tab-${id}`}
          title={label}
          onClick={() => onTabChange(id)}
          className={`group relative w-11 h-11 flex items-center justify-center rounded-xl transition-all duration-200 cursor-pointer
            ${activeTab === id
              ? 'bg-indigo-500/20 ring-1 ring-indigo-500/40'
              : (isLight ? 'hover:bg-slate-300/60' : 'hover:bg-slate-800/60')}`}>
          <Icon active={activeTab === id} />
          {activeTab === id && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-indigo-400 rounded-r-full -ml-0.5" />
          )}
        </button>
      ))}

      <div className="mt-auto flex flex-col items-center gap-2">
        {/* Theme Switcher */}
        <button
          onClick={toggleTheme}
          title="Toggle Night / Light Mode"
          className={`group w-11 h-11 flex items-center justify-center rounded-xl transition-all cursor-pointer ${
            isLight ? 'hover:bg-slate-300/60' : 'hover:bg-slate-800/60'
          }`}>
          {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-indigo-500" />}
        </button>

        {/* Settings button */}
        <button
          id="nav-settings-btn"
          title="Settings & Profile"
          onClick={onSettings}
          className={`group w-11 h-11 flex items-center justify-center rounded-xl transition-all cursor-pointer ${
            isLight ? 'hover:bg-slate-300/60' : 'hover:bg-slate-800/60'
          }`}>
          <IconSettings />
        </button>

        {/* Logout button */}
        <button
          id="nav-logout-btn"
          title="Log Out"
          onClick={onLogout}
          className={`group w-11 h-11 flex items-center justify-center rounded-xl transition-all cursor-pointer ${
            isLight ? 'hover:bg-rose-500/20 text-rose-500' : 'hover:bg-rose-500/10'
          }`}>
          <IconLogout />
        </button>

        {/* User avatar */}
        {currentUser && (
          <div title={currentUser.name} className="cursor-default mt-1">
            <Avatar label={currentUser.avatar || currentUser.name} color={currentUser.color} size="sm" />
          </div>
        )}
      </div>
    </aside>
  );
};

// ─── User Search Modal ─────────────────────────────────────────────────────────

const UserSearchModal = ({ isOpen, onClose, onSelectUser }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    searchUsers(searchTerm)
      .then((data) => {
        setResults(data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('[UserSearchModal] Search error:', err);
        setLoading(false);
      });
  }, [searchTerm, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <h3 className="text-base font-semibold text-slate-100">Start Direct Message</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 text-sm font-bold p-1 rounded-lg hover:bg-slate-800 transition-colors">
            ✕
          </button>
        </div>

        <div className="relative">
          <IconSearch />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search user by name or email..."
            className="w-full bg-slate-800/80 text-slate-200 text-sm rounded-xl pl-9 pr-4 py-2.5 border border-slate-700/60 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            autoFocus
          />
        </div>

        <div className="max-h-64 overflow-y-auto space-y-1.5 custom-scrollbar">
          {loading ? (
            <p className="text-xs text-slate-500 text-center py-4">Searching users...</p>
          ) : results.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-4">No registered users found</p>
          ) : (
            results.map((u) => (
              <div
                key={u.id}
                onClick={() => onSelectUser(u)}
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-800/70 transition-colors cursor-pointer group">
                <div className="flex items-center gap-3">
                  <Avatar label={u.avatar} color={u.color} size="md" />
                  <div>
                    <h4 className="text-sm font-medium text-slate-200 group-hover:text-indigo-400">{u.name}</h4>
                    <p className="text-xs text-slate-500">{u.email}</p>
                  </div>
                </div>
                <button className="text-xs font-medium bg-indigo-500/20 text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white px-3 py-1.5 rounded-lg transition-colors cursor-pointer">
                  Chat
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Chat List (Middle Panel) ─────────────────────────────────────────────────

const ChatList = ({ chats, activeChatId, onSelect, activeTab, loadingChats, onOpenNewDm, onOpenNewGroup, activeTag, onSelectTag, posts, theme }) => {
  const [query, setQuery] = useState('');
  const isLight = theme === 'light';

  const trendingTags = useMemo(() => {
    const rawTags = [
      { tag: 'all', label: 'All Topics' },
      { tag: 'nexchat', label: '#nexchat' },
      { tag: 'tech', label: '#tech' },
      { tag: 'announcements', label: '#announcements' },
      { tag: 'design', label: '#design' },
      { tag: 'lpu', label: '#lpu' },
    ];
    return rawTags.map(({ tag, label }) => {
      const count = tag === 'all'
        ? (posts || []).length
        : (posts || []).filter((p) => p.text?.toLowerCase().includes(tag)).length;
      return { tag, label, count };
    });
  }, [posts]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (activeTab === 'direct') {
      return chats.filter((c) => c.type === 'direct' && (q === '' || c.name.toLowerCase().includes(q)));
    } else if (activeTab === 'groups') {
      return chats.filter((c) => c.type !== 'direct' && (q === '' || c.name.toLowerCase().includes(q)));
    }
    return [];
  }, [chats, activeTab, query]);

  const tabTitles = {
    direct: 'Direct Messages',
    groups: 'Group Chats & Workspaces',
    trending: 'Trending Topics',
  };

  return (
    <div className={`w-64 flex flex-col border-r transition-colors duration-200 shrink-0 ${
      isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800/60'
    }`}>
      {/* Header */}
      <div className="px-4 pt-5 pb-3">
        <div className="flex items-center justify-between mb-3">
          <h2 className={`text-[11px] font-bold uppercase tracking-wider truncate ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            {tabTitles[activeTab]}
          </h2>
          {activeTab === 'direct' && (
            <button
              onClick={onOpenNewDm}
              className="text-xs font-semibold text-indigo-500 hover:text-indigo-600 bg-indigo-500/10 hover:bg-indigo-500/20 px-2.5 py-1 rounded-lg transition-colors cursor-pointer shrink-0">
              + New DM
            </button>
          )}
          {activeTab === 'groups' && (
            <button
              onClick={onOpenNewGroup}
              className="flex items-center gap-1 text-xs font-semibold text-indigo-500 hover:text-indigo-600 bg-indigo-500/10 hover:bg-indigo-500/20 px-2.5 py-1 rounded-lg transition-colors cursor-pointer shrink-0">
              <Plus className="w-3.5 h-3.5" />
              <span>Group</span>
            </button>
          )}
        </div>

        {/* Search input */}
        {activeTab !== 'trending' && (
          <div className="relative">
            <IconSearch />
            <input
              id="chat-search-input"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search ${activeTab === 'direct' ? 'direct messages' : 'groups & workspaces'}…`}
              className={`w-full text-xs rounded-xl pl-9 pr-3 py-2 border transition-all ${
                isLight 
                  ? 'bg-slate-50 text-slate-800 border-slate-200 placeholder:text-slate-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500' 
                  : 'bg-slate-800/70 text-slate-200 border-slate-700/50 placeholder:text-slate-500 focus:ring-1 focus:ring-indigo-500/60 focus:border-indigo-500/40'
              }`}
            />
          </div>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-0.5 custom-scrollbar">
        {activeTab === 'trending' ? (
          <div className="space-y-1 p-1">
            <p className="text-[11px] font-semibold text-slate-500 uppercase px-2 mb-2">Explore Hashtags</p>
            {trendingTags.map(({ tag, label, count }) => {
              const isSelected = (activeTag || 'all') === tag;
              return (
                <button
                  key={tag}
                  onClick={() => onSelectTag(tag)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left text-xs font-semibold transition-all cursor-pointer ${
                    isSelected 
                      ? 'bg-amber-500/15 text-amber-600 border border-amber-500/30' 
                      : (isLight ? 'hover:bg-slate-100 text-slate-700' : 'hover:bg-slate-800/60 text-slate-300')
                  }`}>
                  <span>{label}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${isLight ? 'text-slate-600 bg-slate-100' : 'text-slate-500 bg-slate-800'}`}>{count} {count === 1 ? 'post' : 'posts'}</span>
                </button>
              );
            })}
          </div>
        ) : loadingChats ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl animate-pulse">
              <div className={`w-10 h-10 rounded-xl ${isLight ? 'bg-slate-200' : 'bg-slate-800'}`} />
              <div className="flex-1 space-y-2">
                <div className={`h-3 rounded w-3/4 ${isLight ? 'bg-slate-200' : 'bg-slate-800/60'}`} />
                <div className={`h-2.5 rounded w-1/2 ${isLight ? 'bg-slate-200/70' : 'bg-slate-800/40'}`} />
              </div>
            </div>
          ))
        ) : filtered.length === 0 ? (
          <p className="text-slate-500 text-xs text-center mt-8">No results found</p>
        ) : (
          filtered.map((chat) => (
            <ChatItem
              key={chat.id}
              chat={chat}
              isActive={chat.id === activeChatId}
              onClick={() => onSelect(chat.id)}
              theme={theme}
            />
          ))
        )}
      </div>
    </div>
  );
};

// ─── Individual Chat Row ──────────────────────────────────────────────────────

const ChatItem = ({ chat, isActive, onClick, theme }) => {
  const isLight = theme === 'light';
  return (
    <button
      id={`chat-item-${chat.id}`}
      onClick={onClick}
      className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all duration-150 group cursor-pointer border ${
        isActive
          ? (isLight ? 'bg-indigo-50 border-indigo-100/80 shadow-sm' : 'bg-indigo-500/15 border-indigo-500/25')
          : (isLight ? 'hover:bg-slate-100/80 border-transparent' : 'hover:bg-slate-800/50 border-transparent')
      }`}>
      <Avatar label={chat.avatar} color={chat.color} size="md" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <span className={`text-sm font-semibold truncate ${
            isActive 
              ? (isLight ? 'text-indigo-600' : 'text-indigo-300') 
              : (isLight ? 'text-slate-800' : 'text-slate-200')
          }`}>
            {chat.name}
          </span>
          {chat.unread > 0 && (
            <span className="shrink-0 bg-indigo-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 leading-none">
              {chat.unread}
            </span>
          )}
        </div>
        <p className={`text-xs truncate mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>{chat.lastMessage || '...'}</p>
      </div>
    </button>
  );
};

const RenderTicks = ({ status }) => {
  if (status === 'seen') {
    return <span title="Seen (Read)" className="text-red-500 font-extrabold text-[12px] tracking-tighter leading-none select-none ml-1">✓✓</span>;
  } else if (status === 'delivered') {
    return <span title="Delivered" className="text-slate-300 font-extrabold text-[12px] tracking-tighter leading-none select-none ml-1">✓✓</span>;
  }
  return <span title="Sent" className="text-slate-300 font-extrabold text-[12px] leading-none select-none ml-1">✓</span>;
};

const formatLocalTime = (ts) => {
  if (!ts) return '';
  try {
    const tsStr = String(ts);
    // If it is a pre-formatted time like "10:30 AM" from seed data, return it directly
    if (
      tsStr.includes(':') &&
      (tsStr.toLowerCase().includes('am') ||
        tsStr.toLowerCase().includes('pm') ||
        (!tsStr.includes('-') && !tsStr.includes('T') && !tsStr.includes('t')))
    ) {
      return tsStr;
    }
    const date = new Date(ts);
    if (isNaN(date.getTime())) return tsStr;
    return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return String(ts);
  }
};

// ─── Message Bubble ───────────────────────────────────────────────────────────

const MessageBubble = ({ msg, isOwn, onVotePoll, currentUserId, theme }) => {
  const isImage = msg.fileType?.startsWith('image/') || msg.fileUrl?.match(/\.(jpg|jpeg|png|gif|webp)$/i);
  const isLight = theme === 'light';

  return (
    <div className={`flex items-end gap-2.5 ${isOwn ? 'flex-row-reverse' : 'flex-row'} group animate-message-up`}>
      {!isOwn && (
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 mb-1 ${
          isLight ? 'bg-slate-200 text-slate-700' : 'bg-slate-850 text-slate-300'
        }`}>
          {msg.senderName?.slice(0, 2).toUpperCase()}
        </div>
      )}
      <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        {!isOwn && <span className={`text-xs font-medium pl-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{msg.senderName}</span>}
        
        <div className={`relative p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm space-y-2
          ${isOwn 
            ? 'bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-br-sm' 
            : (isLight 
                ? 'bg-slate-100 text-slate-800 border border-slate-200 rounded-bl-sm' 
                : 'bg-slate-800/80 text-slate-200 border border-slate-700/40 rounded-bl-sm')}`}>
          
          {msg.text && <p>{msg.text}</p>}

          {/* Render File Attachment */}
          {msg.fileUrl && (
            <div className="mt-1">
              {isImage ? (
                <a href={msg.fileUrl} target="_blank" rel="noreferrer" className="block max-w-xs rounded-xl overflow-hidden border border-white/20">
                  <img src={msg.fileUrl} alt={msg.fileName || 'Attachment'} className="w-full h-auto max-h-60 object-cover" />
                </a>
              ) : (
                <a href={msg.fileUrl} target="_blank" rel="noreferrer" className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${
                  isLight 
                    ? 'bg-slate-50 border-slate-200 hover:bg-slate-100/80 text-slate-800' 
                    : 'bg-black/20 border-white/10 hover:bg-black/30 text-white'
                }`}>
                  <FileText className="w-5 h-5 shrink-0" />
                  <div className="min-w-0 flex-1 text-xs">
                    <p className="font-bold truncate">{msg.fileName || 'Download Attachment'}</p>
                    {msg.fileSize > 0 && <p className="opacity-70">{(msg.fileSize / 1024).toFixed(1)} KB</p>}
                  </div>
                  <Download className="w-4 h-4 shrink-0" />
                </a>
              )}
            </div>
          )}

          {/* Render Interactive Poll */}
          {msg.poll && (
            <div className={`space-y-2 pt-1 border-t ${isLight ? 'border-slate-200' : 'border-white/20'}`}>
              <span className="text-xs font-bold uppercase tracking-wider opacity-90">📊 {msg.poll.question}</span>
              <div className="space-y-1.5 mt-2">
                {msg.poll.options?.map((opt) => {
                  const votesCount = (opt.votes || []).length;
                  const hasVoted = (opt.votes || []).includes(String(currentUserId));
                  return (
                    <button
                      key={opt.id}
                      onClick={() => onVotePoll && onVotePoll(msg.id, opt.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                        hasVoted 
                          ? (isLight ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white/20 border-white/40') 
                          : (isLight ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100' : 'bg-black/20 border-white/10 hover:bg-black/30')
                      }`}>
                      <span>{opt.text}</span>
                      <span className="font-bold opacity-80">{votesCount} votes</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-1 px-1">
          <span className="text-[10px] text-slate-500">{formatLocalTime(msg.ts)}</span>
          {isOwn && <RenderTicks status={msg.status || 'delivered'} />}
        </div>
      </div>
    </div>
  );
};

// ─── Chat Window (Right Panel) ────────────────────────────────────────────────

const ChatWindow = ({ chat, messages, currentUserId, onSend, onOpenCall, onOpenTasks, onOpenPoll, onBlockUser, onReportUser, onVotePoll, onOpenGroupInfo, theme }) => {
  const [inputText, setInputText] = useState('');
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);
  const isLight = theme === 'light';

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = useCallback(
    (e) => {
      e.preventDefault();
      const text = inputText.trim();
      if (!text || !chat) return;
      onSend(chat.id, text);
      setInputText('');
      inputRef.current?.focus();
    },
    [inputText, chat, onSend]
  );

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !chat) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await apiClient.post('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onSend(chat.id, '', res.fileUrl, res.fileType, res.fileName, res.fileSize);
    } catch (err) {
      console.error('[ChatWindow] File upload failed:', err);
    }
  };

  if (!chat) {
    return (
      <div className={`flex-1 flex flex-col items-center justify-center gap-4 ${
        isLight ? 'bg-slate-50' : 'bg-slate-900/50'
      }`}>
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
          isLight ? 'bg-slate-200/50 text-slate-600' : 'bg-slate-800/60 text-indigo-400'
        }`}>
          <IconMsg active />
        </div>
        <p className={`text-sm ${isLight ? 'text-slate-600' : 'text-slate-500'}`}>Select a conversation to start chatting</p>
      </div>
    );
  }

  return (
    <div className={`flex-1 flex flex-col min-w-0 transition-colors duration-200 ${
      isLight ? 'bg-white' : 'bg-slate-900/30'
    }`}>
      {/* Chat Header */}
      <header className={`flex items-center justify-between px-5 py-3.5 border-b shrink-0 ${
        isLight ? 'border-slate-200 bg-white' : 'border-slate-800/60 bg-slate-900/60 backdrop-blur-sm'
      }`}>
        <div
          onClick={chat.type !== 'direct' ? onOpenGroupInfo : undefined}
          className={`flex items-center gap-3 ${chat.type !== 'direct' ? 'cursor-pointer group hover:opacity-90' : ''}`}>
          <Avatar label={chat.avatar} color={chat.color} size="md" />
          <div>
            <h1 className={`font-semibold text-sm transition-colors flex items-center gap-1.5 ${
              isLight ? 'text-slate-900 group-hover:text-indigo-600' : 'text-slate-100 group-hover:text-indigo-300'
            }`}>
              {chat.name}
              {chat.type !== 'direct' && <Info className="w-3.5 h-3.5 text-indigo-400 opacity-80" />}
            </h1>
            <p className={`text-xs capitalize ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>
              {chat.type} · {chat.type !== 'direct' ? 'Click for group members & info' : 'Active now'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Call Buttons */}
          <button onClick={() => onOpenCall(false)} title="Start Audio Call" className={`p-2 rounded-xl transition-colors cursor-pointer ${
            isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white'
          }`}>
            <Phone className="w-4 h-4" />
          </button>
          <button onClick={() => onOpenCall(true)} title="Start Video Call" className={`p-2 rounded-xl transition-colors cursor-pointer ${
            isLight ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-600' : 'bg-indigo-500/20 hover:bg-indigo-500 text-indigo-400 hover:text-white'
          }`}>
            <VideoIcon className="w-4 h-4" />
          </button>

          {/* Task Board */}
          <button onClick={onOpenTasks} title="Project Tasks & Proof Submissions" className={`p-2 rounded-xl transition-colors cursor-pointer ${
            isLight ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600' : 'bg-slate-800/80 hover:bg-slate-700 text-emerald-400'
          }`}>
            <CheckSquare className="w-4 h-4" />
          </button>

          {/* Polls */}
          <button onClick={onOpenPoll} title="Create Poll / MCQ" className={`p-2 rounded-xl transition-colors cursor-pointer ${
            isLight ? 'bg-purple-50 hover:bg-purple-100 text-purple-600' : 'bg-slate-800/80 hover:bg-slate-700 text-purple-400'
          }`}>
            <BarChart2 className="w-4 h-4" />
          </button>

          {/* Group Details Drawer Button */}
          {chat.type !== 'direct' && (
            <button onClick={onOpenGroupInfo} title="Group Details & Members" className={`p-2 rounded-xl transition-colors cursor-pointer ${
              isLight ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-600' : 'bg-indigo-500/20 hover:bg-indigo-500 text-indigo-300 hover:text-white'
            }`}>
              <Info className="w-4 h-4" />
            </button>
          )}

          {/* Block & Report */}
          {chat.type === 'direct' && (
            <>
              <button onClick={() => onBlockUser(chat.targetUserId || chat.id)} title="Block User" className="p-2 rounded-xl hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer">
                <UserX className="w-4 h-4" />
              </button>
              <button onClick={() => onReportUser(chat.targetUserId || chat.id)} title="Report User to Admin" className="p-2 rounded-xl hover:bg-amber-500/20 text-slate-500 hover:text-amber-400 transition-colors cursor-pointer">
                <ShieldAlert className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </header>

      {/* Messages container */}
      <div id="message-list" className="flex-1 overflow-y-auto px-5 py-5 space-y-4 custom-scrollbar">
        <div className="flex items-center gap-3 my-4">
          <div className={`flex-1 h-px ${isLight ? 'bg-slate-200' : 'bg-slate-800/60'}`} />
          <span className={`text-[11px] font-medium px-2 ${isLight ? 'text-slate-400' : 'text-slate-600'}`}>Today</span>
          <div className={`flex-1 h-px ${isLight ? 'bg-slate-200' : 'bg-slate-800/60'}`} />
        </div>

        {messages.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} isOwn={msg.senderId === currentUserId} onVotePoll={onVotePoll} currentUserId={currentUserId} theme={theme} />
        ))}

        <div ref={bottomRef} />
      </div>

      {/* Message Input */}
      <div className={`px-4 py-3.5 border-t shrink-0 ${
        isLight ? 'border-slate-200 bg-white' : 'border-slate-800/60 bg-slate-900/60 backdrop-blur-sm'
      }`}>
        <form
          id="send-message-form"
          onSubmit={handleSend}
          className={`flex items-center gap-2 rounded-2xl border px-4 py-2.5 transition-all duration-200 ${
            isLight 
              ? 'bg-slate-50 border-slate-200 focus-within:ring-1 focus-within:ring-indigo-500 focus-within:border-indigo-500' 
              : 'bg-slate-800/60 border-slate-700/40 focus-within:ring-1 focus-within:ring-indigo-500/50 focus-within:border-indigo-500/30'
          }`}>
          
          {/* File Upload Button */}
          <label title="Attach File (PDF, PPT, Image, vCard)" className="p-1.5 rounded-xl hover:bg-slate-700/50 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer">
            <Paperclip className="w-4 h-4" />
            <input type="file" onChange={handleFileUpload} className="hidden" />
          </label>

          <input
            ref={inputRef}
            id="message-input"
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Message ${chat.name}…`}
            className={`flex-1 bg-transparent text-sm focus:outline-none ${
              isLight ? 'text-slate-800 placeholder:text-slate-400' : 'text-slate-200 placeholder:text-slate-500'
            }`}
          />
          <button
            type="submit"
            id="send-message-btn"
            disabled={!inputText.trim()}
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-indigo-500 text-white cursor-pointer
              transition-all duration-200 hover:bg-indigo-400 active:scale-90
              disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-indigo-500 shrink-0">
            <IconSend />
          </button>
        </form>
        <p className="text-[10px] text-slate-700 text-center mt-1.5">Press Enter to send · Attach PPT, PDF, Images or Contacts</p>
      </div>
    </div>
  );
};

// ─── Dashboard (Main Export) ──────────────────────────────────────────────────

export default function Dashboard({ theme, toggleTheme }) {
  const navigate = useNavigate();

  // Zustand selectors
  const currentUser           = useChatStore((s) => s.currentUser);
  const chats                 = useChatStore((s) => s.chats);
  const setChats              = useChatStore((s) => s.setChats);
  const addOrUpdateChat       = useChatStore((s) => s.addOrUpdateChat);
  const updateChatLastMessage = useChatStore((s) => s.updateChatLastMessage);
  const messages              = useChatStore((s) => s.messages);
  const activeChatId          = useChatStore((s) => s.activeChatId);
  const setActiveChat         = useChatStore((s) => s.setActiveChat);
  const setMessagesForChat    = useChatStore((s) => s.setMessagesForChat);
  const addReceivedMessage    = useChatStore((s) => s.addReceivedMessage);
  const clearUnread           = useChatStore((s) => s.clearUnread);
  const markMessagesSeen      = useChatStore((s) => s.markMessagesSeen);
  const removeChat            = useChatStore((s) => s.removeChat);
  const logoutStore           = useChatStore((s) => s.logout);

  // Local UI state
  const [activeTab,         setActiveTab]         = useState('direct');
  const [loadingChats,      setLoadingChats]      = useState(true);
  const [isSearchOpen,      setIsSearchOpen]      = useState(false);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [activeTag,         setActiveTag]         = useState('all');
  const [posts,             setPosts]             = useState([]);

  // Call & Overlay Modals State
  const [isCallOpen, setIsCallOpen]           = useState(false);
  const [isVideoCall, setIsVideoCall]         = useState(true);
  const [isTasksOpen, setIsTasksOpen]         = useState(false);
  const [isPollOpen, setIsPollOpen]           = useState(false);
  const [isGroupInfoOpen, setIsGroupInfoOpen] = useState(false);

  // ── 1. Fetch initial chats & posts on mount ──────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    fetchChats()
      .then((data) => {
        if (!cancelled) {
          setChats(data);
          setLoadingChats(false);
        }
      })
      .catch((err) => {
        console.error('[Dashboard] Error loading chats:', err);
        if (!cancelled) setLoadingChats(false);
      });

    apiClient.get('/posts')
      .then((data) => {
        if (!cancelled) setPosts(data || []);
      })
      .catch((err) => console.error('[Dashboard] Error loading posts:', err));

    return () => { cancelled = true; };
  }, [setChats]);

  // ── 2. Socket.IO Connection & Message Event Listeners ───────────────────────
  useEffect(() => {
    socket.connect();

    const handleNewMsg = ({ chatId, message }) => {
      addReceivedMessage(chatId, message);
      if (String(activeChatId) === String(chatId) && String(message.senderId) !== String(currentUser?.id)) {
        apiClient.post(`/chats/${chatId}/read`).catch(() => {});
      }
    };

    const handleChatUpdate = ({ chatId, lastMessage, community }) => {
      if (community) {
        addOrUpdateChat(community);
      } else {
        updateChatLastMessage(chatId, lastMessage);
      }
    };

    const handleChatCreated = (newChat) => {
      addOrUpdateChat(newChat);
    };

    const handleMessagesSeen = ({ chatId }) => {
      markMessagesSeen(chatId);
    };

    const handleNewPost = (newPost) => {
      setPosts((prev) => [newPost, ...prev.filter((p) => p.id !== newPost.id)]);
    };

    const handlePostUpdated = (updatedPost) => {
      setPosts((prev) => prev.map((p) => (p.id === updatedPost.id ? updatedPost : p)));
    };

    const handleChatDeleted = ({ chatId }) => {
      removeChat(chatId);
      if (String(activeChatId) === String(chatId)) {
        setActiveChat(null);
      }
    };

    socket.on('newMessage', handleNewMsg);
    socket.on('chatUpdated', handleChatUpdate);
    socket.on('chatCreated', handleChatCreated);
    socket.on('messagesSeen', handleMessagesSeen);
    socket.on('newPostCreated', handleNewPost);
    socket.on('postUpdated', handlePostUpdated);
    socket.on('chatDeleted', handleChatDeleted);

    return () => {
      socket.off('newMessage', handleNewMsg);
      socket.off('chatUpdated', handleChatUpdate);
      socket.off('chatCreated', handleChatCreated);
      socket.off('messagesSeen', handleMessagesSeen);
      socket.off('newPostCreated', handleNewPost);
      socket.off('postUpdated', handlePostUpdated);
      socket.off('chatDeleted', handleChatDeleted);
      socket.disconnect();
    };
  }, [addReceivedMessage, updateChatLastMessage, addOrUpdateChat, markMessagesSeen, activeChatId, setActiveChat, removeChat, currentUser]);

  // ── 3. Handle changing active chat: fetch message history & join room ──────
  useEffect(() => {
    if (!activeChatId) return;

    clearUnread(activeChatId);
    apiClient.post(`/chats/${activeChatId}/read`).catch(() => {});

    fetchMessages(activeChatId)
      .then((list) => {
        setMessagesForChat(activeChatId, list);
      })
      .catch((err) => console.error('[Dashboard] Error loading messages:', err));

    if (socket.connected) {
      socket.emit('joinChat', activeChatId);
    } else {
      socket.once('connect', () => {
        socket.emit('joinChat', activeChatId);
      });
    }
  }, [activeChatId, setMessagesForChat, clearUnread]);

  // Derive active chat object and its messages
  const activeChat     = useMemo(() => chats.find((c) => c.id === activeChatId) || null, [chats, activeChatId]);
  const activeMessages = useMemo(() => messages[activeChatId] || [], [messages, activeChatId]);

  // Stable callbacks
  const handleTabChange  = useCallback((tab) => setActiveTab(tab), []);
  const handleSelectChat = useCallback((id) => setActiveChat(id), [setActiveChat]);

  const handleSelectUserToChat = useCallback(
    async (targetUser) => {
      try {
        const chat = await createDirectChat(targetUser.id);
        addOrUpdateChat(chat);
        setActiveTab('direct');
        setActiveChat(chat.id);
        setIsSearchOpen(false);
      } catch (err) {
        console.error('[Dashboard] Failed to start direct chat:', err);
      }
    },
    [addOrUpdateChat, setActiveChat]
  );

  const handleSend = useCallback(
    async (chatId, text, fileUrl, fileType, fileName, fileSize) => {
      try {
        await apiClient.post(`/chats/${chatId}/messages`, {
          text,
          fileUrl,
          fileType,
          fileName,
          fileSize,
        });
      } catch (err) {
        console.error('[Dashboard] Send message failed:', err);
      }
    },
    []
  );

  const handleBlockUser = useCallback(async (targetUserId) => {
    if (!window.confirm('Are you sure you want to block this user?')) return;
    try {
      await apiClient.post('/users/block', { targetUserId });
      alert('User blocked successfully.');
    } catch (err) {
      console.error('[Dashboard] Block user failed:', err);
    }
  }, []);

  const handleReportUser = useCallback(async (targetUserId) => {
    const reason = window.prompt('Please enter reason for reporting this user:');
    if (!reason || !reason.trim()) return;
    try {
      await apiClient.post('/users/report', { reportedUserId: targetUserId, reason });
      alert('Report submitted to Admin for review.');
    } catch (err) {
      console.error('[Dashboard] Report user failed:', err);
    }
  }, []);

  const handleVotePoll = useCallback(async (messageId, optionId) => {
    if (!activeChatId) return;
    try {
      await apiClient.post(`/polls/${activeChatId}/messages/${messageId}/vote`, { optionId });
    } catch (err) {
      console.error('[Dashboard] Vote poll failed:', err);
    }
  }, [activeChatId]);

  const handleLeaveOrDeleteGroup = useCallback((chatId) => {
    removeChat(chatId);
    setActiveChat(null);
  }, [removeChat, setActiveChat]);

  const handleSettings = useCallback(() => navigate('/settings'), [navigate]);

  const handleLogout = useCallback(() => {
    logoutStore();
    navigate('/login');
  }, [logoutStore, navigate]);

  return (
    <div className={`flex h-screen w-screen overflow-hidden font-sans ${theme === 'light' ? 'bg-slate-100 text-slate-900' : 'bg-slate-950 text-slate-100'}`}>
      {/* Left: Icon Nav */}
      <NavSidebar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        currentUser={currentUser}
        onSettings={handleSettings}
        onLogout={handleLogout}
        theme={theme}
        toggleTheme={toggleTheme}
      />

      {/* Middle: Chat List / Hashtag List */}
      <ChatList
        chats={chats}
        activeChatId={activeChatId}
        onSelect={handleSelectChat}
        activeTab={activeTab}
        loadingChats={loadingChats}
        onOpenNewDm={() => setIsSearchOpen(true)}
        onOpenNewGroup={() => setIsCreateGroupOpen(true)}
        activeTag={activeTag}
        onSelectTag={(tag) => setActiveTag(tag)}
        posts={posts}
        theme={theme}
      />

      {/* Right: Chat Window OR Community Feed */}
      {activeTab === 'trending' ? (
        <CommunityFeed currentUser={currentUser} activeTag={activeTag} posts={posts} setPosts={setPosts} theme={theme} />
      ) : (
        <ChatWindow
          chat={activeChat}
          messages={activeMessages}
          currentUserId={currentUser ? currentUser.id : null}
          onSend={handleSend}
          onOpenCall={(video) => { setIsVideoCall(video); setIsCallOpen(true); }}
          onOpenTasks={() => setIsTasksOpen(true)}
          onOpenPoll={() => setIsPollOpen(true)}
          onBlockUser={handleBlockUser}
          onReportUser={handleReportUser}
          onVotePoll={handleVotePoll}
          onOpenGroupInfo={() => setIsGroupInfoOpen(true)}
          theme={theme}
        />
      )}

      {/* Group Profile & Member Management Drawer */}
      <GroupInfoDrawer
        isOpen={isGroupInfoOpen}
        onClose={() => setIsGroupInfoOpen(false)}
        chat={activeChat}
        currentUserId={currentUser ? currentUser.id : null}
        onLeaveGroup={handleLeaveOrDeleteGroup}
        onDeleteGroup={handleLeaveOrDeleteGroup}
      />

      {/* User Search & Direct Message Modal */}
      <UserSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectUser={handleSelectUserToChat}
      />

      {/* Group & Community Creation Modal */}
      <CreateGroupModal
        isOpen={isCreateGroupOpen}
        onClose={() => setIsCreateGroupOpen(false)}
        onGroupCreated={(group) => {
          addOrUpdateChat(group);
          setActiveTab('groups');
          setActiveChat(group.id);
        }}
        currentUser={currentUser}
      />

      {/* WebRTC Video Call & Presenter Modal */}
      <CallModal
        isOpen={isCallOpen}
        onClose={() => setIsCallOpen(false)}
        activeChat={activeChat}
        isVideoCall={isVideoCall}
        currentUser={currentUser}
      />

      {/* Project Tasks & Screenshot Submissions Modal */}
      <TaskBoardModal
        isOpen={isTasksOpen}
        onClose={() => setIsTasksOpen(false)}
        activeChat={activeChat}
        currentUser={currentUser}
      />

      {/* Polls & MCQs Creation Modal */}
      <PollModal
        isOpen={isPollOpen}
        onClose={() => setIsPollOpen(false)}
        activeChat={activeChat}
      />
    </div>
  );
}
