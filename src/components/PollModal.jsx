import React, { useState } from 'react';
import { X, BarChart2, Plus, Trash2 } from 'lucide-react';
import apiClient from '../utils/mockApi';

export default function PollModal({ isOpen, onClose, activeChat }) {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['Option 1', 'Option 2']);
  const [submitting, setSubmitting] = useState(false);

  const handleAddOption = () => {
    if (options.length < 5) {
      setOptions([...options, `Option ${options.length + 1}`]);
    }
  };

  const handleOptionChange = (idx, text) => {
    const updated = [...options];
    updated[idx] = text;
    setOptions(updated);
  };

  const handleRemoveOption = (idx) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== idx));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question.trim() || options.some((o) => !o.trim())) return;
    setSubmitting(true);
    try {
      await apiClient.post('/polls', {
        chatId: activeChat.id,
        question: question.trim(),
        options: options.map((o) => o.trim()),
      });
      setSubmitting(false);
      setQuestion('');
      setOptions(['Option 1', 'Option 2']);
      onClose();
    } catch (err) {
      console.error('[PollModal] Failed to create poll:', err);
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-slate-100">Create Poll / MCQ</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Question / Prompt</label>
            <input
              type="text"
              required
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g. Which framework should we use?"
              className="w-full bg-slate-850 text-slate-100 text-sm rounded-xl px-4 py-2.5 border border-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-400 uppercase">Options</label>
            {options.map((opt, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  required
                  value={opt}
                  onChange={(e) => handleOptionChange(idx, e.target.value)}
                  className="flex-1 bg-slate-850 text-slate-100 text-sm rounded-xl px-4 py-2 border border-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                {options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveOption(idx)}
                    className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {options.length < 5 && (
            <button
              type="button"
              onClick={handleAddOption}
              className="flex items-center gap-1.5 text-xs text-indigo-400 font-semibold hover:text-indigo-300">
              <Plus className="w-3.5 h-3.5" />
              <span>Add Option</span>
            </button>
          )}

          <button
            type="submit"
            disabled={submitting || !question.trim()}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:opacity-40 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer">
            {submitting ? 'Posting Poll...' : 'Post Poll to Chat'}
          </button>
        </form>
      </div>
    </div>
  );
}
