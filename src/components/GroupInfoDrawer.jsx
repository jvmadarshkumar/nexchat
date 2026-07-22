import React, { useState, useEffect } from 'react';
import { X, Users, UserPlus, ShieldCheck, Shield, UserX, Crown, Info } from 'lucide-react';
import apiClient from '../utils/mockApi';

export default function GroupInfoDrawer({ isOpen, onClose, chat, currentUserId, onLeaveGroup, onDeleteGroup }) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedAddUser, setSelectedAddUser] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const loadDetails = async () => {
    if (!chat || chat.type === 'direct') return;
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await apiClient.get(`/communities/${chat.id}/details`);
      setDetails(res);
    } catch (err) {
      console.error('[GroupInfoDrawer] Error loading details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && chat && chat.type !== 'direct') {
      loadDetails();
    }
  }, [isOpen, chat]);

  if (!isOpen || !chat || chat.type === 'direct') return null;

  const isAdmin = details && String(details.creator) === String(currentUserId);
  const isCoAdmin = details && (details.coAdmins || []).map(String).includes(String(currentUserId));
  const canManageMembers = isAdmin || isCoAdmin;

  const handleAddMember = async () => {
    if (!selectedAddUser) return;
    try {
      setErrorMsg('');
      setSuccessMsg('');
      await apiClient.post(`/communities/${chat.id}/members/add`, { targetUserId: selectedAddUser });
      setSuccessMsg('Member added successfully!');
      setSelectedAddUser('');
      setIsAddOpen(false);
      loadDetails();
    } catch (err) {
      setErrorMsg('Failed to add member.');
    }
  };

  const handleRemoveMember = async (targetUserId) => {
    if (!window.confirm('Are you sure you want to remove this member from the group?')) return;
    try {
      setErrorMsg('');
      setSuccessMsg('');
      await apiClient.post(`/communities/${chat.id}/members/remove`, { targetUserId });
      setSuccessMsg('Member removed successfully.');
      loadDetails();
    } catch (err) {
      setErrorMsg('Failed to remove member.');
    }
  };

  const handlePromoteCoAdmin = async (targetUserId) => {
    try {
      setErrorMsg('');
      setSuccessMsg('');
      await apiClient.post(`/communities/${chat.id}/coadmins`, { targetUserId });
      setSuccessMsg('Member promoted to Co-Admin (Max 2 co-admins allowed).');
      loadDetails();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to promote member.');
    }
  };

  const handleTransferAdmin = async (targetUserId) => {
    if (!window.confirm('Are you sure you want to transfer Admin leadership to this member?')) return;
    try {
      setErrorMsg('');
      setSuccessMsg('');
      await apiClient.post(`/communities/${chat.id}/transfer`, { newCreatorId: targetUserId });
      setSuccessMsg('Admin role transferred successfully.');
      loadDetails();
    } catch (err) {
      setErrorMsg('Failed to transfer admin role.');
    }
  };

  const handleLeaveGroup = async () => {
    if (!window.confirm('Are you sure you want to leave this group?')) return;
    try {
      setErrorMsg('');
      setSuccessMsg('');
      await apiClient.post(`/communities/${chat.id}/leave`);
      setSuccessMsg('You left the group successfully.');
      setTimeout(() => {
        onLeaveGroup && onLeaveGroup(chat.id);
        onClose();
      }, 1000);
    } catch (err) {
      setErrorMsg('Failed to leave group.');
    }
  };

  const handleDeleteGroup = async () => {
    if (!window.confirm('Are you sure you want to delete this group permanently? This action cannot be undone.')) return;
    try {
      setErrorMsg('');
      setSuccessMsg('');
      await apiClient.delete(`/communities/${chat.id}`);
      setSuccessMsg('Group deleted successfully.');
      setTimeout(() => {
        onDeleteGroup && onDeleteGroup(chat.id);
        onClose();
      }, 1000);
    } catch (err) {
      setErrorMsg('Failed to delete group.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <Info className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-slate-100 text-sm uppercase tracking-wide">Group Profile & Members</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
          {/* Group Avatar & Info */}
          <div className="text-center space-y-3">
            <div
              style={{ backgroundColor: chat.color || '#6366F1' }}
              className="w-20 h-20 rounded-2xl mx-auto flex items-center justify-center text-2xl font-black text-white shadow-xl ring-4 ring-white/10 overflow-hidden">
              {chat.avatar && (chat.avatar.startsWith('/') || chat.avatar.startsWith('http') || chat.avatar.includes('.')) ? (
                <img src={chat.avatar} alt="Group Avatar" className="w-full h-full object-cover" />
              ) : (
                chat.avatar || chat.name?.slice(0, 2).toUpperCase()
              )}
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center justify-center gap-2">
                {chat.name}
              </h2>
              <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {chat.type || 'Group'}
              </span>
            </div>
            {chat.description && (
              <p className="text-xs text-slate-400 bg-slate-800/50 p-3 rounded-xl border border-slate-800 leading-relaxed">
                {chat.description}
              </p>
            )}

            {/* Leave / Delete Group Buttons */}
            <div className="pt-2">
              {isAdmin ? (
                <button
                  onClick={handleDeleteGroup}
                  className="w-full py-2.5 rounded-xl text-xs font-bold bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/20 hover:border-transparent transition-all duration-200 cursor-pointer">
                  Delete Group permanently
                </button>
              ) : (
                <button
                  onClick={handleLeaveGroup}
                  className="w-full py-2.5 rounded-xl text-xs font-bold bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/20 hover:border-transparent transition-all duration-200 cursor-pointer">
                  Leave Group
                </button>
              )}
            </div>
          </div>

          {/* Alert messages */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold">
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
              {successMsg}
            </div>
          )}

          {/* Members Section Header */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Group Members ({(details?.detailedMembers || []).length})
                </span>
              </div>
              {canManageMembers && (
                <button
                  onClick={() => setIsAddOpen(!isAddOpen)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors cursor-pointer shadow-md">
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Add Member</span>
                </button>
              )}
            </div>

            {/* Add Member Dropdown Form */}
            {isAddOpen && canManageMembers && (
              <div className="p-3.5 rounded-xl bg-slate-800/80 border border-indigo-500/30 space-y-3 animate-fade-in">
                <label className="block text-xs font-bold text-slate-300">Select User to Add:</label>
                {(details?.nonMembers || []).length === 0 ? (
                  <p className="text-xs text-slate-400 italic">All registered users are already members of this group.</p>
                ) : (
                  <div className="flex gap-2">
                    <select
                      value={selectedAddUser}
                      onChange={(e) => setSelectedAddUser(e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 p-2 focus:ring-1 focus:ring-indigo-500">
                      <option value="">Choose a user...</option>
                      {details.nonMembers.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.email})
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={handleAddMember}
                      disabled={!selectedAddUser}
                      className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer">
                      Add
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Members List */}
            {loading ? (
              <div className="text-center py-6 text-xs text-slate-500">Loading group members...</div>
            ) : (
              <div className="space-y-2">
                {(details?.detailedMembers || []).map((m) => {
                  const isCurrent = String(m.id) === String(currentUserId);
                  return (
                    <div
                      key={m.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/40 border border-slate-800 hover:border-slate-700 transition-all">
                      <div className="flex items-center gap-3">
                        <div
                          style={{ backgroundColor: m.color }}
                          className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs text-white shadow-sm">
                          {m.avatar}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-200">{m.name}</span>
                            {isCurrent && <span className="text-[10px] text-indigo-400 font-medium">(You)</span>}
                          </div>
                          <span className="text-[10px] text-slate-500">{m.email}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* Role Badges */}
                        {m.role === 'admin' && (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            <Crown className="w-3 h-3" /> Admin
                          </span>
                        )}
                        {m.role === 'coadmin' && (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            <ShieldCheck className="w-3 h-3" /> Co-Admin
                          </span>
                        )}

                        {/* Admin Action Buttons */}
                        {isAdmin && !isCurrent && (
                          <div className="flex items-center gap-1">
                            {m.role === 'member' && (
                              <button
                                onClick={() => handlePromoteCoAdmin(m.id)}
                                title="Promote to Co-Admin (Max 2)"
                                className="p-1 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 transition-colors cursor-pointer">
                                <Shield className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {m.role !== 'admin' && (
                              <>
                                <button
                                  onClick={() => handleTransferAdmin(m.id)}
                                  title="Transfer Admin Leadership"
                                  className="p-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 transition-colors cursor-pointer">
                                  <Crown className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleRemoveMember(m.id)}
                                  title="Remove Member"
                                  className="p-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors cursor-pointer">
                                  <UserX className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        )}
                        {isCoAdmin && !isAdmin && !isCurrent && m.role === 'member' && (
                          <button
                            onClick={() => handleRemoveMember(m.id)}
                            title="Remove Member"
                            className="p-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors cursor-pointer">
                            <UserX className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
