import React, { useState, useEffect } from 'react';
import { Heart, MessageSquare, Share2, Paperclip, Send, Flame, Image as ImageIcon, Sparkles, User } from 'lucide-react';
import apiClient, { socket } from '../utils/mockApi';

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
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return String(ts);
  }
};

export default function CommunityFeed({ currentUser, activeTag, posts: externalPosts, setPosts: externalSetPosts, theme }) {
  const [internalPosts, setInternalPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const posts = externalPosts || internalPosts;
  const setPosts = externalSetPosts || setInternalPosts;
  const isLight = theme === 'light';

  // New Post Form State
  const [postText, setPostText] = useState('');
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaUrl, setMediaUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [publishing, setPublishing] = useState(false);

  // Comments State
  const [activeCommentPostId, setActiveCommentPostId] = useState(null);
  const [commentInput, setCommentInput] = useState('');

  // 1. Fetch Posts
  useEffect(() => {
    setLoading(true);
    apiClient.get('/posts')
      .then((data) => {
        setPosts(data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('[CommunityFeed] Failed to load posts:', err);
        setLoading(false);
      });
  }, []);

  // 2. Real-time Socket listeners
  useEffect(() => {
    const handleNewPost = (newPost) => {
      setPosts((prev) => [newPost, ...prev.filter((p) => p.id !== newPost.id)]);
    };

    const handlePostUpdated = (updatedPost) => {
      setPosts((prev) => prev.map((p) => (p.id === updatedPost.id ? updatedPost : p)));
    };

    socket.on('newPostCreated', handleNewPost);
    socket.on('postUpdated', handlePostUpdated);

    return () => {
      socket.off('newPostCreated', handleNewPost);
      socket.off('postUpdated', handlePostUpdated);
    };
  }, []);

  // Handle file attachment upload
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await apiClient.post('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMediaUrl(res.fileUrl);
      setMediaFile({
        fileName: res.fileName,
        fileType: res.fileType,
        fileSize: res.fileSize
      });
      setUploading(false);
    } catch (err) {
      console.error('[CommunityFeed] File upload failed:', err);
      setUploading(false);
    }
  };

  // Create Post
  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!postText.trim() && !mediaUrl) return;
    setPublishing(true);

    try {
      await apiClient.post('/posts', {
        text: postText,
        mediaUrl: mediaUrl,
      });

      setPostText('');
      setMediaUrl(null);
      setMediaFile(null);
      setPublishing(false);
    } catch (err) {
      console.error('[CommunityFeed] Post creation failed:', err);
      setPublishing(false);
    }
  };

  // Toggle Like
  const handleLike = async (postId) => {
    try {
      const updated = await apiClient.post(`/posts/${postId}/like`);
      setPosts(posts.map((p) => (p.id === postId ? updated : p)));
    } catch (err) {
      console.error('[CommunityFeed] Like failed:', err);
    }
  };

  // Submit Comment
  const handleAddComment = async (postId) => {
    if (!commentInput.trim()) return;
    try {
      const commentRes = await apiClient.post(`/posts/${postId}/comments`, {
        text: commentInput.trim(),
      });
      
      setPosts(posts.map((p) => {
        if (p.id === postId) {
          return {
            ...p,
            comments: [...(p.comments || []), commentRes],
          };
        }
        return p;
      }));

      setCommentInput('');
    } catch (err) {
      console.error('[CommunityFeed] Add comment failed:', err);
    }
  };

  // Filter posts by active tag if selected
  const filteredPosts = posts.filter((p) => {
    if (!activeTag || activeTag === 'all') return true;
    return p.text.toLowerCase().includes(activeTag.toLowerCase());
  });

  return (
    <div className={`flex-1 flex flex-col min-w-0 transition-colors duration-200 overflow-y-auto custom-scrollbar ${
      isLight ? 'bg-white' : 'bg-slate-900/30'
    }`}>
      
      {/* Header */}
      <header className={`sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b ${
        isLight ? 'border-slate-200 bg-white' : 'border-slate-800/60 bg-slate-900/80 backdrop-blur-md'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-rose-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Flame className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className={`font-bold text-base flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
              Community Feed & Trending
              {activeTag && activeTag !== 'all' && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-500 font-mono">
                  #{activeTag}
                </span>
              )}
            </h1>
            <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>Share updates, announcements, and ideas with the community</p>
          </div>
        </div>

        <div className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-full border ${
          isLight ? 'text-slate-600 bg-slate-100 border-slate-200' : 'text-slate-400 bg-slate-800/60 border-slate-700/40'
        }`}>
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Public Feed</span>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-2xl w-full mx-auto p-4 sm:p-6 space-y-6">
        
        {/* NEW POST COMPOSER */}
        <form onSubmit={handleCreatePost} className={`p-4 sm:p-5 rounded-3xl border shadow-xl space-y-3 ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/90 border-slate-800/80'
        }`}>
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white text-xs shrink-0 mt-1 shadow-md">
              {currentUser?.avatar || currentUser?.name?.slice(0, 2).toUpperCase() || 'ME'}
            </div>
            <div className="flex-1 min-w-0">
              <textarea
                rows={3}
                value={postText}
                onChange={(e) => setPostText(e.target.value)}
                placeholder="What's happening in your community? Share an update or #hashtag..."
                className={`w-full bg-transparent text-sm focus:outline-none resize-none ${
                  isLight ? 'text-slate-800 placeholder:text-slate-400' : 'text-slate-100 placeholder:text-slate-500'
                }`}
              />

              {/* Media Preview */}
              {mediaUrl && (
                <div className={`relative mt-2 rounded-2xl overflow-hidden border max-h-64 ${
                  isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
                }`}>
                  {mediaFile?.fileType?.startsWith('image/') || mediaUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                    <img src={mediaUrl} alt="Upload preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="p-4 text-xs text-indigo-500 flex items-center gap-2">
                      <ImageIcon className="w-4 h-4" />
                      <span>Attached: {mediaFile?.fileName || mediaUrl}</span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => { setMediaUrl(null); setMediaFile(null); }}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-950/80 text-slate-400 hover:text-white">
                    ✕
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className={`flex items-center justify-between border-t pt-3 ${isLight ? 'border-slate-200' : 'border-slate-850'}`}>
            <label title="Attach Image or Document" className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer border ${
              isLight 
                ? 'bg-white hover:bg-slate-100 text-slate-600 hover:text-indigo-600 border-slate-200' 
                : 'bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-indigo-400 border-slate-800'
            }`}>
              <Paperclip className="w-4 h-4" />
              <span>{uploading ? 'Uploading...' : 'Attach File'}</span>
              <input type="file" onChange={handleFileUpload} className="hidden" />
            </label>

            <button
              type="submit"
              disabled={publishing || (!postText.trim() && !mediaUrl)}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:opacity-40 text-white font-bold text-xs transition-all shadow-md cursor-pointer">
              <Send className="w-3.5 h-3.5" />
              <span>{publishing ? 'Posting...' : 'Post Update'}</span>
            </button>
          </div>
        </form>

        {/* FEED POSTS LIST */}
        {loading ? (
          <div className="text-center py-12 space-y-3">
            <Flame className="w-8 h-8 text-slate-400 mx-auto animate-bounce" />
            <p className="text-xs text-slate-500">Loading community updates...</p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className={`text-center py-12 p-6 rounded-3xl border space-y-3 ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/50 border-slate-800/60'
          }`}>
            <Flame className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className={`font-bold text-sm ${isLight ? 'text-slate-800' : 'text-slate-300'}`}>No community posts yet</h3>
            <p className="text-slate-500 text-xs">Be the first to post an update or announcement!</p>
          </div>
        ) : (
          filteredPosts.map((post) => {
            const isLiked = (post.likes || []).includes(String(currentUser?.id));
            const isOwner = String(post.authorId) === String(currentUser?.id);

            return (
              <article key={post.id} className={`p-5 rounded-3xl border space-y-4 transition-colors shadow-lg animate-fade-in ${
                isLight ? 'bg-white border-slate-200 hover:border-slate-300' : 'bg-slate-950/80 border-slate-800/80 hover:border-slate-750'
              }`}>
                
                {/* Post Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white text-xs shadow-md">
                      {post.authorAvatar || post.authorName?.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>{post.authorName}</h4>
                        {isOwner && (
                          <span className="text-[10px] bg-indigo-500/20 text-indigo-500 font-bold px-1.5 py-0.5 rounded">You</span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500">
                        {new Date(post.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · Public
                      </span>
                    </div>
                  </div>
                </div>

                {/* Post Content */}
                {post.text && (
                  <p className={`text-sm leading-relaxed whitespace-pre-wrap ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>{post.text}</p>
                )}

                {/* Attached Media */}
                {post.mediaUrl && (
                  <div className={`rounded-2xl overflow-hidden border max-h-96 ${isLight ? 'border-slate-200 bg-slate-50' : 'border-slate-800 bg-slate-900'}`}>
                    {post.mediaUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                      <img src={post.mediaUrl} alt="Post attachment" className="w-full h-full object-cover" />
                    ) : (
                      <a href={post.mediaUrl} target="_blank" rel="noreferrer" className="p-4 text-xs text-indigo-500 flex items-center gap-2 hover:underline">
                        <ImageIcon className="w-4 h-4" />
                        <span>View Attached File</span>
                      </a>
                    )}
                  </div>
                )}

                {/* Post Actions (Like, Comment, Share) */}
                <div className={`flex items-center justify-between border-t pt-3 text-xs ${isLight ? 'border-slate-200 text-slate-500' : 'border-slate-850 text-slate-400'}`}>
                  <button
                    onClick={() => handleLike(post.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-colors cursor-pointer ${
                      isLiked 
                        ? 'text-rose-500 bg-rose-500/10 font-bold' 
                        : (isLight ? 'hover:text-rose-600 hover:bg-slate-100' : 'hover:text-rose-400 hover:bg-slate-900')
                    }`}>
                    <Heart className={`w-4 h-4 ${isLiked ? 'fill-rose-500' : ''}`} />
                    <span>{(post.likes || []).length} Likes</span>
                  </button>

                  <button
                    onClick={() => setActiveCommentPostId(activeCommentPostId === post.id ? null : post.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-colors cursor-pointer ${
                      isLight ? 'hover:text-indigo-600 hover:bg-slate-100' : 'hover:text-indigo-400 hover:bg-slate-900'
                    }`}>
                    <MessageSquare className="w-4 h-4" />
                    <span>{(post.comments || []).length} Comments</span>
                  </button>

                  <button
                    onClick={() => navigator.clipboard.writeText(window.location.href)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-colors cursor-pointer ${
                      isLight ? 'hover:text-emerald-600 hover:bg-slate-100' : 'hover:text-emerald-400 hover:bg-slate-900'
                    }`}>
                    <Share2 className="w-4 h-4" />
                    <span>Share</span>
                  </button>
                </div>

                {/* COMMENTS SECTION */}
                {activeCommentPostId === post.id && (
                  <div className={`border-t pt-4 space-y-3 animate-scale-in ${isLight ? 'border-slate-200' : 'border-slate-850'}`}>
                    
                    {/* Add Comment Input */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={commentInput}
                        onChange={(e) => setCommentInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                        placeholder="Write a comment..."
                        className={`flex-1 text-xs rounded-xl px-4 py-2 border focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                          isLight 
                            ? 'bg-slate-50 text-slate-800 border-slate-200 placeholder:text-slate-400' 
                            : 'bg-slate-900 text-slate-200 border-slate-800 placeholder:text-slate-500'
                        }`}
                      />
                      <button
                        onClick={() => handleAddComment(post.id)}
                        className="px-3.5 py-2 rounded-xl bg-indigo-500 text-white text-xs font-semibold hover:bg-indigo-600 transition-colors cursor-pointer">
                        Post
                      </button>
                    </div>

                    {/* Comments List */}
                    <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                      {(post.comments || []).length === 0 ? (
                        <p className="text-[11px] text-slate-500 text-center py-2">No comments yet. Start the conversation!</p>
                      ) : (
                        post.comments.map((comment) => (
                          <div key={comment.id} className={`flex gap-2.5 p-2.5 rounded-xl border text-xs ${
                            isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-slate-900/70 border-slate-800 text-slate-300'
                          }`}>
                            <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center font-bold text-[10px] text-white shrink-0 mt-0.5">
                              {comment.userAvatar || comment.userName?.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <span className={`font-bold ${isLight ? 'text-slate-800' : 'text-slate-300'}`}>{comment.userName}</span>
                                <span className="text-[10px] text-slate-500">{formatLocalTime(comment.ts)}</span>
                              </div>
                              <p className={`mt-0.5 ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>{comment.text}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
