import React, { useState, useEffect } from 'react';
import { X, CheckSquare, ExternalLink, Upload, Image as ImageIcon, CheckCircle, Clock, Plus, UserCheck } from 'lucide-react';
import apiClient from '../utils/mockApi';

export default function TaskBoardModal({ isOpen, onClose, activeChat, currentUser }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  // New task form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [externalUrl, setExternalUrl] = useState('');
  const [dueDate, setDueDate] = useState('');

  // Proof submission state
  const [proofFile, setProofFile] = useState(null);
  const [proofPreviewUrl, setProofPreviewUrl] = useState(null);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Is current user Admin or Co-Admin
  const isAdmin = activeChat?.creator === currentUser?.id || (activeChat?.coAdmins || []).includes(String(currentUser?.id));

  useEffect(() => {
    if (!isOpen || !activeChat) return;
    setLoading(true);
    apiClient.get(`/tasks/${activeChat.id}`)
      .then((data) => {
        setTasks(data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('[TaskBoardModal] Load tasks error:', err);
        setLoading(false);
      });
  }, [isOpen, activeChat]);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      const newTask = await apiClient.post('/tasks', {
        communityId: activeChat.id,
        title,
        description,
        externalPlatformUrl: externalUrl,
        dueDate,
      });
      setTasks([newTask, ...tasks]);
      setShowCreateTask(false);
      setTitle('');
      setDescription('');
      setExternalUrl('');
      setDueDate('');
    } catch (err) {
      console.error('[TaskBoardModal] Create task failed:', err);
    }
  };

  const handleProofFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await apiClient.post('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setProofPreviewUrl(res.fileUrl);
      setProofFile(res);
    } catch (err) {
      console.error('[TaskBoardModal] Proof file upload failed:', err);
    }
  };

  const handleSubmitProof = async (e) => {
    e.preventDefault();
    if (!selectedTask) return;
    setSubmitting(true);
    try {
      const res = await apiClient.post(`/tasks/${selectedTask.id}/submit-proof`, {
        proofScreenshotUrl: proofPreviewUrl,
        fileUrl: proofPreviewUrl,
        notes,
      });
      setTasks(tasks.map((t) => t.id === selectedTask.id ? { ...t, submissions: [...t.submissions, res.submission] } : t));
      setSelectedTask(null);
      setProofPreviewUrl(null);
      setProofFile(null);
      setNotes('');
      setSubmitting(false);
    } catch (err) {
      console.error('[TaskBoardModal] Proof submission failed:', err);
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">{activeChat?.name} — Project Tasks</h3>
              <p className="text-xs text-slate-500">Assign projects, link external platforms & submit proof screenshots</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && !showCreateTask && (
              <button
                onClick={() => setShowCreateTask(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-500 text-white text-xs font-semibold hover:bg-indigo-600 transition-colors cursor-pointer">
                <Plus className="w-4 h-4" />
                <span>Assign Task</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          
          {/* CREATE TASK FORM (ADMIN ONLY) */}
          {showCreateTask && (
            <form onSubmit={handleCreateTask} className="p-5 rounded-2xl bg-slate-950 border border-indigo-500/40 space-y-4 animate-scale-in">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h4 className="text-sm font-bold text-indigo-400">Assign New Community Project / Task</h4>
                <button type="button" onClick={() => setShowCreateTask(false)} className="text-slate-500 text-xs hover:text-slate-300">Cancel</button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Project Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Complete Dashboard Design on Figma"
                  className="w-full bg-slate-900 text-slate-100 text-sm rounded-xl px-4 py-2.5 border border-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Task Instructions</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what members need to do..."
                  className="w-full bg-slate-900 text-slate-100 text-sm rounded-xl px-4 py-2.5 border border-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">External Platform Link</label>
                  <input
                    type="url"
                    value={externalUrl}
                    onChange={(e) => setExternalUrl(e.target.value)}
                    placeholder="https://external-platform.com/task"
                    className="w-full bg-slate-900 text-slate-100 text-sm rounded-xl px-4 py-2.5 border border-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-slate-900 text-slate-100 text-sm rounded-xl px-4 py-2.5 border border-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer">
                Publish Project Task
              </button>
            </form>
          )}

          {/* SUBMIT PROOF MODAL/OVERLAY */}
          {selectedTask && (
            <form onSubmit={handleSubmitProof} className="p-5 rounded-2xl bg-slate-950 border border-emerald-500/40 space-y-4 animate-scale-in">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h4 className="text-sm font-bold text-emerald-400">Submit Work Proof for: {selectedTask.title}</h4>
                <button type="button" onClick={() => setSelectedTask(null)} className="text-slate-500 text-xs hover:text-slate-300">Cancel</button>
              </div>

              {selectedTask.externalPlatformUrl && (
                <a
                  href={selectedTask.externalPlatformUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 text-xs font-semibold hover:bg-indigo-500/20 transition-colors">
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open External Task Platform</span>
                </a>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Upload Completion Screenshot / File</label>
                <input type="file" onChange={handleProofFileChange} className="text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-500/20 file:text-indigo-400 hover:file:bg-indigo-500/30 cursor-pointer" />
                {proofPreviewUrl && (
                  <div className="mt-2 w-full max-h-48 rounded-xl border border-slate-800 overflow-hidden">
                    <img src={proofPreviewUrl} alt="Proof preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Notes / Completion Summary</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any details about your completion..."
                  className="w-full bg-slate-900 text-slate-100 text-sm rounded-xl px-4 py-2 border border-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting || (!proofPreviewUrl && !notes.trim())}
                className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer">
                {submitting ? 'Submitting Proof...' : 'Confirm & Submit Proof'}
              </button>
            </form>
          )}

          {/* TASKS LIST */}
          {loading ? (
            <p className="text-xs text-slate-500 text-center py-8">Loading community tasks...</p>
          ) : tasks.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <CheckSquare className="w-10 h-10 text-slate-700 mx-auto" />
              <p className="text-slate-500 text-sm">No tasks assigned in this community yet.</p>
            </div>
          ) : (
            tasks.map((task) => {
              const mySubmission = (task.submissions || []).find((s) => String(s.userId) === String(currentUser?.id));

              return (
                <div key={task.id} className="p-5 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-3 hover:border-slate-700 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="text-base font-bold text-slate-100">{task.title}</h4>
                      {task.description && <p className="text-xs text-slate-400 mt-1">{task.description}</p>}
                    </div>

                    {mySubmission ? (
                      <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/20">
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Submitted</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => setSelectedTask(task)}
                        className="px-3.5 py-1.5 rounded-xl bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500 hover:text-white text-xs font-semibold transition-colors cursor-pointer">
                        Submit Proof
                      </button>
                    )}
                  </div>

                  {task.externalPlatformUrl && (
                    <a
                      href={task.externalPlatformUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:underline">
                      <ExternalLink className="w-3 h-3" />
                      <span>{task.externalPlatformUrl}</span>
                    </a>
                  )}

                  {/* Submissions Section */}
                  {task.submissions && task.submissions.length > 0 && (
                    <div className="border-t border-slate-850 pt-3 mt-3">
                      <span className="text-[11px] font-semibold text-slate-500 uppercase">Submissions ({task.submissions.length})</span>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {task.submissions.map((sub, i) => (
                          <div key={i} className="flex items-center gap-2 p-2 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                            <span className="font-bold text-slate-300">{sub.userName}</span>
                            {sub.proofScreenshotUrl && (
                              <a href={sub.proofScreenshotUrl} target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline flex items-center gap-1">
                                <ImageIcon className="w-3 h-3" />
                                <span>Proof</span>
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
