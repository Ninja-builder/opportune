import React, { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import { Send, User, Bot, Sparkles, FileText, PenTool } from 'lucide-react';

const MODES = [
  { id: 'mentor', label: 'Mentor', icon: Sparkles, desc: 'General advice & strategy' },
  { id: 'application', label: 'App Coach', icon: FileText, desc: 'Resume & portfolio feedback' },
  { id: 'essay', label: 'Essay Expert', icon: PenTool, desc: 'Brainstorming & hooks' }
];

export default function Assistant() {
  const [mode, setMode] = useState('mentor');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const endRef = useRef(null);
  
  // Track separate session IDs per mode
  const sessionPrefix = `session-${Math.random().toString(36).substr(2, 5)}`;
  const sessionId = `${sessionPrefix}-${mode}`;

  useEffect(() => {
    // Clear messages when mode changes (in a real app we might load history)
    setMessages([
      { role: 'assistant', content: `Hi! I'm your AI ${MODES.find(m => m.id === mode).label}. How can I help you today?` }
    ]);
  }, [mode]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, busy]);

  const send = async (e) => {
    e.preventDefault();
    if (!input.trim() || busy) return;
    
    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setBusy(true);

    try {
      const res = await api.post('/ai/chat', { 
        message: userMsg.content,
        mode,
        session_id: sessionId
      });
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I'm having trouble connecting to the network right now." }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col space-y-4">
      <header>
        <h1 className="font-display text-3xl font-semibold tracking-tight">AI Assistant</h1>
        <p className="text-zinc-400 mt-1 text-sm">Powered by Claude 4.5 & Gemini 3</p>
      </header>

      <div className="flex gap-2">
        {MODES.map(m => (
          <button
            key={m.id} onClick={() => setMode(m.id)}
            className={`flex-1 p-3 rounded-xl border transition-all flex flex-col items-center justify-center gap-2 ${
              mode === m.id 
                ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300' 
                : 'bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10 hover:text-zinc-200'
            }`}
          >
            <m.icon size={20} />
            <div className="text-center">
              <div className="text-sm font-medium">{m.label}</div>
              <div className="text-[10px] opacity-70 hidden md:block">{m.desc}</div>
            </div>
          </button>
        ))}
      </div>

      <div className="flex-1 glass-card border border-white/10 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-4 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded flex items-center justify-center shrink-0 ${
                m.role === 'user' ? 'bg-zinc-800' : 'bg-gradient-to-br from-indigo-500 to-purple-600'
              }`}>
                {m.role === 'user' ? <User size={16} /> : <Bot size={16} className="text-white" />}
              </div>
              <div className={`max-w-[80%] rounded-2xl px-5 py-3 ${
                m.role === 'user' 
                  ? 'bg-white/10 text-white rounded-tr-sm' 
                  : 'bg-transparent border border-white/10 text-zinc-300 rounded-tl-sm'
              }`}>
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{m.content}</p>
              </div>
            </div>
          ))}
          {busy && (
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0">
                <Bot size={16} className="text-white" />
              </div>
              <div className="bg-transparent border border-white/10 rounded-2xl rounded-tl-sm px-5 py-3 flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        <form onSubmit={send} className="p-4 border-t border-white/10 bg-black/20">
          <div className="relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={`Message ${MODES.find(m => m.id === mode).label}...`}
              className="w-full bg-white/5 border border-white/10 rounded-full pl-5 pr-12 py-3 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
            />
            <button 
              type="submit" 
              disabled={!input.trim() || busy}
              className="absolute right-2 p-2 rounded-full bg-indigo-500 text-white hover:bg-indigo-600 disabled:opacity-50 disabled:hover:bg-indigo-500 transition-colors"
            >
              <Send size={16} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
