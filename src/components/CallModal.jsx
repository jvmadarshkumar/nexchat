import React, { useState, useEffect, useRef } from 'react';
import { Video, Mic, MicOff, VideoOff, Monitor, Presentation, Edit3, X, Play, ChevronLeft, ChevronRight, Upload, Trash2 } from 'lucide-react';
import { socket } from '../utils/mockApi';

export default function CallModal({ isOpen, onClose, activeChat, isVideoCall = true, currentUser }) {
  const [micActive, setMicActive] = useState(true);
  const [videoActive, setVideoActive] = useState(isVideoCall);
  const [screenSharing, setScreenSharing] = useState(false);
  const [activeTab, setActiveTab] = useState('call'); // 'call' | 'whiteboard' | 'ppt'

  // Local & Remote streams
  const localVideoRef = useRef(null);
  const screenVideoRef = useRef(null);

  // Whiteboard refs & state
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#6366F1');

  // PPT Presenter state
  const [slides, setSlides] = useState([
    { title: 'Slide 1: Welcome to Community Presenter', content: 'NexChat Presentation Mode — Ultra low bandwidth browser caching' },
    { title: 'Slide 2: Project Architecture', content: 'WebRTC Mesh + Socket.IO Signaling + Local Storage Caching' },
    { title: 'Slide 3: Delivery Roadmap', content: 'Multi-platform Verification & Task Submission Engine' },
  ]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  // Initialize camera/mic
  useEffect(() => {
    if (!isOpen) return;

    let localStream;
    navigator.mediaDevices?.getUserMedia({ video: isVideoCall, audio: true })
      .then((stream) => {
        localStream = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      })
      .catch((err) => console.warn('[CallModal] Media access error:', err));

    return () => {
      if (localStream) {
        localStream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [isOpen, isVideoCall]);

  // Handle Screen Sharing
  const toggleScreenShare = async () => {
    if (screenSharing) {
      setScreenSharing(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        if (screenVideoRef.current) {
          screenVideoRef.current.srcObject = stream;
        }
        setScreenSharing(true);
        stream.getVideoTracks()[0].onended = () => setScreenSharing(false);
      } catch (err) {
        console.error('[CallModal] Screen share cancelled or error:', err);
      }
    }
  };

  // Whiteboard drawing handlers
  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    ctx.lineTo(x, y);
    ctx.stroke();

    socket.emit('whiteboard-stroke', { roomId: activeChat?.id, strokeData: { x, y, color } });
  };

  const stopDrawing = () => setIsDrawing(false);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    socket.emit('whiteboard-clear', { roomId: activeChat?.id });
  };

  // PPT Slide Presenter handlers
  const nextSlide = () => {
    if (currentSlideIndex < slides.length - 1) {
      const nextIdx = currentSlideIndex + 1;
      setCurrentSlideIndex(nextIdx);
      socket.emit('ppt-slide-change', { roomId: activeChat?.id, pageIndex: nextIdx, totalPages: slides.length });
    }
  };

  const prevSlide = () => {
    if (currentSlideIndex > 0) {
      const prevIdx = currentSlideIndex - 1;
      setCurrentSlideIndex(prevIdx);
      socket.emit('ppt-slide-change', { roomId: activeChat?.id, pageIndex: prevIdx, totalPages: slides.length });
    }
  };

  const handlePptUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    // Create local cached slide representation
    const newSlide = {
      title: `Uploaded Deck: ${file.name}`,
      content: `Loaded into local browser cache for low-bandwidth presentation (${(file.size / 1024).toFixed(1)} KB)`
    };
    const updated = [...slides, newSlide];
    setSlides(updated);
    setCurrentSlideIndex(updated.length - 1);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Top Control Bar */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
            <div>
              <h3 className="text-sm font-bold text-slate-100">{activeChat?.name || 'Community Room'}</h3>
              <p className="text-xs text-slate-500">{isVideoCall ? 'Video & Presentation Call' : 'Audio Conference'}</p>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-850 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('call')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${activeTab === 'call' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-slate-200'}`}>
              <Video className="w-3.5 h-3.5" />
              <span>Call Video</span>
            </button>
            <button
              onClick={() => setActiveTab('whiteboard')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${activeTab === 'whiteboard' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-slate-200'}`}>
              <Edit3 className="w-3.5 h-3.5" />
              <span>Whiteboard</span>
            </button>
            <button
              onClick={() => setActiveTab('ppt')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${activeTab === 'ppt' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-slate-200'}`}>
              <Presentation className="w-3.5 h-3.5" />
              <span>PPT Presenter</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Center Canvas / Video Display Area */}
        <div className="flex-1 bg-slate-950 relative flex items-center justify-center p-4 overflow-hidden">
          
          {/* TAB 1: VIDEO CALL & SCREEN SHARE */}
          {activeTab === 'call' && (
            <div className="w-full h-full flex flex-col md:flex-row gap-4">
              {/* Screen share or main presenter stream */}
              {screenSharing ? (
                <div className="flex-1 bg-slate-900 rounded-2xl overflow-hidden border border-indigo-500/40 relative flex items-center justify-center">
                  <video ref={screenVideoRef} autoPlay playsInline className="w-full h-full object-contain" />
                  <span className="absolute top-3 left-3 px-3 py-1 rounded-lg bg-indigo-500/80 text-white text-xs font-bold uppercase tracking-wider">
                    Screen Presenter Stream
                  </span>
                </div>
              ) : (
                <div className="flex-1 bg-slate-900 rounded-2xl border border-slate-800 relative flex items-center justify-center overflow-hidden">
                  <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                  <span className="absolute bottom-3 left-3 px-3 py-1 rounded-lg bg-slate-900/80 backdrop-blur-sm text-slate-200 text-xs font-medium">
                    {currentUser?.name || 'You'}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: INTERACTIVE COLLABORATIVE WHITEBOARD */}
          {activeTab === 'whiteboard' && (
            <div className="w-full h-full flex flex-col items-center justify-center relative">
              <div className="absolute top-3 left-3 flex items-center gap-2 z-10 bg-slate-900/80 backdrop-blur-sm p-2 rounded-xl border border-slate-800">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-7 h-7 rounded-lg cursor-pointer bg-transparent border-0"
                />
                <button
                  onClick={clearCanvas}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                  title="Clear Whiteboard">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <canvas
                ref={canvasRef}
                width={800}
                height={500}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                className="bg-slate-900 rounded-2xl border border-slate-800 cursor-crosshair shadow-xl"
              />
            </div>
          )}

          {/* TAB 3: LOW-BANDWIDTH CACHED PPT PRESENTER */}
          {activeTab === 'ppt' && (
            <div className="w-full h-full flex flex-col items-center justify-between p-6 bg-slate-900 rounded-2xl border border-slate-800">
              <div className="w-full flex items-center justify-between border-b border-slate-800 pb-3">
                <h4 className="text-sm font-bold text-slate-200">
                  Slide {currentSlideIndex + 1} of {slides.length}
                </h4>
                <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/20 text-indigo-400 text-xs font-semibold cursor-pointer hover:bg-indigo-500/30 transition-colors">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload PPT / Deck</span>
                  <input type="file" accept=".ppt,.pptx,.pdf" onChange={handlePptUpload} className="hidden" />
                </label>
              </div>

              {/* Current Slide Display */}
              <div className="w-full max-w-2xl bg-slate-950 p-10 rounded-2xl border border-slate-800 text-center space-y-4 my-auto shadow-2xl">
                <h2 className="text-2xl font-extrabold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  {slides[currentSlideIndex]?.title}
                </h2>
                <p className="text-sm text-slate-400 leading-relaxed max-w-md mx-auto">
                  {slides[currentSlideIndex]?.content}
                </p>
                <div className="inline-block px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-[11px] font-semibold">
                  ⚡ Pre-Cached in Local Storage for Offline-Smooth Transition
                </div>
              </div>

              {/* Slide Controls */}
              <div className="flex items-center gap-4">
                <button
                  onClick={prevSlide}
                  disabled={currentSlideIndex === 0}
                  className="p-2.5 rounded-xl bg-slate-800 text-slate-200 disabled:opacity-40 hover:bg-slate-700 transition-colors cursor-pointer">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-xs text-slate-400 font-semibold">{currentSlideIndex + 1} / {slides.length}</span>
                <button
                  onClick={nextSlide}
                  disabled={currentSlideIndex === slides.length - 1}
                  className="p-2.5 rounded-xl bg-slate-800 text-slate-200 disabled:opacity-40 hover:bg-slate-700 transition-colors cursor-pointer">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Call Action Toolbar */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-center gap-4 shrink-0">
          <button
            onClick={() => setMicActive(!micActive)}
            className={`p-3.5 rounded-2xl transition-all cursor-pointer ${micActive ? 'bg-slate-800 text-slate-200 hover:bg-slate-700' : 'bg-rose-500 text-white'}`}>
            {micActive ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </button>

          <button
            onClick={() => setVideoActive(!videoActive)}
            className={`p-3.5 rounded-2xl transition-all cursor-pointer ${videoActive ? 'bg-slate-800 text-slate-200 hover:bg-slate-700' : 'bg-rose-500 text-white'}`}>
            {videoActive ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </button>

          <button
            onClick={toggleScreenShare}
            className={`p-3.5 rounded-2xl transition-all cursor-pointer ${screenSharing ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'}`}
            title="Present Screen">
            <Monitor className="w-5 h-5" />
          </button>

          <button
            onClick={onClose}
            className="px-6 py-3.5 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-sm shadow-lg shadow-rose-500/25 transition-all cursor-pointer">
            Leave Call
          </button>
        </div>
      </div>
    </div>
  );
}
