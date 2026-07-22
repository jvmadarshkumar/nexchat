import React, { useState, useEffect } from 'react';
import { X, Users, Hash, Briefcase, Plus, Check, Search } from 'lucide-react';
import apiClient, { searchUsers } from '../utils/mockApi';

const COLORS = [
  '#6366F1', '#EC4899', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#06B6D4'
];

export default function CreateGroupModal({ isOpen, onClose, onGroupCreated, currentUser }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('group'); // 'group', 'workspace', 'channel'
  const [selectedColor, setSelectedColor] = useState('#6366F1');
  
  const [userQuery, setUserQuery] = useState('');
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setLoadingUsers(true);
    searchUsers('')
      .then((users) => {
        setAvailableUsers(users.filter((u) => String(u.id) !== String(currentUser?.id)));
        setLoadingUsers(false);
      })
      .catch((err) => {
        console.error('[CreateGroupModal] Failed to load users:', err);
        setLoadingUsers(false);
      });
  }, [isOpen, currentUser]);

  const toggleUserSelection = (userId) => {
    const strId = String(userId);
    if (selectedUserIds.includes(strId)) {
      setSelectedUserIds(selectedUserIds.filter((id) => id !== strId));
    } else {
      setSelectedUserIds([...selectedUserIds, strId]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);

    try {
      const avatarLabel = type === 'channel' ? '#C' : name.trim().slice(0, 2).toUpperCase();
      const newComm = await apiClient.post('/communities', {
        name: name.trim(),
        description: description.trim(),
        type,
        avatar: avatarLabel,
        color: selectedColor,
        members: [String(currentUser?.id), ...selectedUserIds],
      });

      setSubmitting(false);
      setName('');
      setDescription('');
      setSelectedUserIds([]);
      onGroupCreated(newComm);
      onClose();
    } catch (err) {
      console.error('[CreateGroupModal] Failed to create group:', err);
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const filteredUsers = availableUsers.filter((u) =>
    u.name.toLowerCase().includes(userQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(userQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Create Group / Community</h3>
              <p className="text-xs text-slate-500">Form a new workspace, team group, or channel</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 flex-1 overflow-y-auto space-y-5 custom-scrollbar">
          
          {/* Group Type */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Group Type</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setType('group')}
                className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl border text-xs font-semibold transition-all cursor-pointer ${
                  type === 'group'
                    ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300'
                    : 'bg-slate-850 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}>
                <Users className="w-5 h-5" />
                <span>Group Chat</span>
              </button>

              <button
                type="button"
                onClick={() => setType('workspace')}
                className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl border text-xs font-semibold transition-all cursor-pointer ${
                  type === 'workspace'
                    ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300'
                    : 'bg-slate-850 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}>
                <Briefcase className="w-5 h-5" />
                <span>Workspace</span>
              </button>

              <button
                type="button"
                onClick={() => setType('channel')}
                className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl border text-xs font-semibold transition-all cursor-pointer ${
                  type === 'channel'
                    ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300'
                    : 'bg-slate-850 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}>
                <Hash className="w-5 h-5" />
                <span>Channel</span>
              </button>
            </div>
          </div>

          {/* Group Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Group Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={type === 'channel' ? 'e.g. announcements' : 'e.g. Product Engineering'}
              className="w-full bg-slate-850 text-slate-100 text-sm rounded-xl px-4 py-2.5 border border-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Group Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Description (Optional)</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this group about?"
              className="w-full bg-slate-850 text-slate-100 text-sm rounded-xl px-4 py-2.5 border border-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
            />
          </div>

          {/* Accent Color */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Theme Accent Color</label>
            <div className="flex items-center gap-2">
              {COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  style={{ backgroundColor: color }}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform cursor-pointer ${
                    selectedColor === color ? 'ring-2 ring-white scale-110' : 'opacity-70 hover:opacity-100'
                  }`}>
                  {selectedColor === color && <Check className="w-3.5 h-3.5 text-white" />}
                </button>
              ))}
            </div>
          </div>

          {/* Add Members */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-400 uppercase">
              Add Initial Members ({selectedUserIds.length} selected)
            </label>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
                placeholder="Search team members..."
                className="w-full pl-9 pr-4 py-2 bg-slate-850 text-xs text-slate-200 rounded-xl border border-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="max-h-36 overflow-y-auto space-y-1 custom-scrollbar pr-1">
              {loadingUsers ? (
                <p className="text-xs text-slate-500 py-4 text-center">Loading users...</p>
              ) : filteredUsers.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">No matching users found</p>
              ) : (
                filteredUsers.map((u) => {
                  const isSelected = selectedUserIds.includes(String(u.id));
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => toggleUserSelection(u.id)}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs transition-colors cursor-pointer ${
                        isSelected ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'bg-slate-850 hover:bg-slate-800 text-slate-300'
                      }`}>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center font-bold text-[10px]">
                          {u.avatar || u.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold">{u.name}</p>
                          <p className="text-[10px] text-slate-500">{u.email}</p>
                        </div>
                      </div>
                      <div className={`w-4 h-4 rounded-md border flex items-center justify-center ${isSelected ? 'bg-indigo-500 border-indigo-400 text-white' : 'border-slate-700'}`}>
                        {isSelected && <Check className="w-3 h-3" />}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting || !name.trim()}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:opacity-40 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-indigo-500/20">
            {submitting ? 'Creating Group...' : 'Create Group / Community'}
          </button>
        </form>
      </div>
    </div>
  );
}
