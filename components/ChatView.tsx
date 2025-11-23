/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, Paperclip, Settings, Menu, X, Plus, Image as ImageIcon, MessageSquare, Code } from 'lucide-react';
import { Message, Role, PersonalityMode, Attachment } from '../types';
import { geminiService } from '../services/geminiService';
import { ThinkingProcess } from './ThinkingProcess';

// --- MOCK DATA FOR SIDEBAR ---
const MOCK_CHATS = [
    { id: '1', title: 'Quantum Error Correction', date: 'Just now' },
    { id: '2', title: 'React Performance Optimization', date: '2 hrs ago' },
    { id: '3', title: 'Sci-Fi Novel Plot', date: 'Yesterday' },
];

export const ChatView: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { id: '0', role: 'assistant', text: "Systems operational. I am Nexus. How can I assist you today?", timestamp: Date.now() }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isSettingsOpen, setSettingsOpen] = useState(false);
  const [personality, setPersonality] = useState<PersonalityMode>('conversational');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingMode, setTypingMode] = useState<'reasoning' | 'image-gen'>('reasoning');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Initialize Speech Recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
        const recognition = new (window as any).webkitSpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        
        recognition.onresult = (event: any) => {
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                }
            }
            if (finalTranscript) {
                setInputValue(prev => prev + ' ' + finalTranscript);
            }
        };
        
        recognitionRef.current = recognition;
    }
  }, []);

  const toggleRecording = () => {
      if (isRecording) {
          recognitionRef.current?.stop();
          setIsRecording(false);
      } else {
          recognitionRef.current?.start();
          setIsRecording(true);
      }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          const reader = new FileReader();
          
          reader.onload = (ev) => {
              const content = ev.target?.result as string;
              const type = file.type.startsWith('image/') ? 'image' : 'text';
              setAttachments(prev => [...prev, { type, content, name: file.name }]);
          };
          
          if (file.type.startsWith('image/')) {
              reader.readAsDataURL(file); // Base64 for images
          } else {
              reader.readAsText(file); // Text for code/logs
          }
      }
  };

  const sendMessage = async () => {
    if (!inputValue.trim() && attachments.length === 0) return;

    const userMsg: Message = {
        id: Date.now().toString(),
        role: 'user',
        text: inputValue,
        attachments: [...attachments],
        timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setAttachments([]);
    setIsTyping(true);

    // Determine intent for visual feedback
    const isImageGen = geminiService.isImageGenerationRequest(userMsg.text);
    setTypingMode(isImageGen ? 'image-gen' : 'reasoning');

    try {
        const generator = geminiService.streamGemini([...messages, userMsg], personality);
        
        let assistantMsgId = (Date.now() + 1).toString();
        let currentText = '';
        
        // Initial placeholder message
        setMessages(prev => [...prev, { id: assistantMsgId, role: 'assistant', text: '', timestamp: Date.now() }]);

        for await (const update of generator) {
            currentText = update.text;
            const isError = update.error;
            
            setMessages(prev => prev.map(m => 
                m.id === assistantMsgId 
                ? { ...m, text: currentText, role: isError ? 'error' : 'assistant' } 
                : m
            ));
        }

    } catch (error) {
        console.error(error);
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'error', text: "Critical system failure. Connection terminated.", timestamp: Date.now() }]);
    } finally {
        setIsTyping(false);
    }
  };

  // Helper to parse markdown (simplified)
  const parseMarkdown = (text: string) => {
      // 1. Detect Images: ![alt](url)
      const imgRegex = /!\[(.*?)\]\((.*?)\)/g;
      const parts = [];
      let lastIndex = 0;
      let match;

      while ((match = imgRegex.exec(text)) !== null) {
          if (match.index > lastIndex) {
              parts.push(<span key={lastIndex}>{formatText(text.substring(lastIndex, match.index))}</span>);
          }
          parts.push(
              <div key={match.index} className="my-4 group relative inline-block">
                  <img src={match[2]} alt={match[1]} className="rounded-lg border border-zinc-700 shadow-lg max-w-full md:max-w-md" />
                  <a href={match[2]} download className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-medium rounded-lg">Download</a>
              </div>
          );
          lastIndex = imgRegex.lastIndex;
      }
      if (lastIndex < text.length) {
          parts.push(<span key={lastIndex}>{formatText(text.substring(lastIndex))}</span>);
      }
      return parts;
  };

  const formatText = (text: string) => {
      return text.split('\n').map((line, i) => (
          <React.Fragment key={i}>
              {line.split(/(`.*?`|\*\*.*?\*\*)/g).map((chunk, j) => {
                  if (chunk.startsWith('`') && chunk.endsWith('`')) {
                      return <code key={j} className="bg-zinc-800 text-zinc-200 px-1 py-0.5 rounded font-mono text-sm border border-zinc-700">{chunk.slice(1, -1)}</code>;
                  }
                  if (chunk.startsWith('**') && chunk.endsWith('**')) {
                      return <strong key={j} className="text-white font-semibold">{chunk.slice(2, -2)}</strong>;
                  }
                  return chunk;
              })}
              <br />
          </React.Fragment>
      ));
  }

  return (
    <div className="flex h-screen bg-nexus-bg text-zinc-300 overflow-hidden font-sans">
      
      {/* Sidebar - Overlay behavior for clean minimalist look */}
      {/* Backdrop */}
      {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity"
            onClick={() => setSidebarOpen(false)}
          />
      )}
      
      {/* Drawer */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-nexus-card border-r border-nexus-border transform transition-transform duration-300 shadow-2xl ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full p-4">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2 text-white font-bold tracking-wider">
                    <div className="w-6 h-6 bg-white rounded-sm"></div> NEXUS
                </div>
                <button onClick={() => setSidebarOpen(false)} className="text-zinc-500 hover:text-white transition-colors"><X size={20} /></button>
            </div>
            
            <button className="flex items-center gap-2 w-full p-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm text-white mb-6 transition-colors">
                <Plus size={16} /> New Session
            </button>

            <div className="flex-1 overflow-y-auto">
                <div className="text-xs font-bold text-zinc-600 uppercase tracking-widest mb-3 px-2">History</div>
                <div className="space-y-1">
                    {MOCK_CHATS.map(chat => (
                        <div key={chat.id} className="p-2 hover:bg-zinc-800/50 rounded cursor-pointer group transition-colors">
                            <div className="text-sm text-zinc-300 group-hover:text-white truncate">{chat.title}</div>
                            <div className="text-[10px] text-zinc-500">{chat.date}</div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="mt-auto border-t border-nexus-border pt-4">
                 <button onClick={() => setSettingsOpen(true)} className="flex items-center gap-3 p-2 w-full hover:bg-zinc-800 rounded-lg text-sm text-zinc-400 hover:text-white transition-colors">
                     <Settings size={18} /> Settings
                 </button>
            </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative w-full">
         
         {/* Toggle Sidebar Button (Always visible when sidebar is closed) */}
         <div className="absolute top-4 left-4 z-30">
            <button 
                onClick={() => setSidebarOpen(true)}
                className="p-2 bg-transparent text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
            >
                <Menu size={24} />
            </button>
         </div>

         {/* Chat Area */}
         <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth relative z-0">
            {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                    <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mb-4">
                        <MessageSquare size={24} />
                    </div>
                    <p className="text-sm">Ready to reason.</p>
                </div>
            ) : (
                <div className="max-w-3xl mx-auto space-y-8 pb-32 pt-12">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-white text-black' : (msg.role === 'error' ? 'bg-red-900/20 text-red-500' : 'bg-zinc-800 text-zinc-200')}`}>
                                {msg.role === 'user' ? <div className="w-2 h-2 bg-black rounded-full" /> : <Code size={14} />}
                            </div>
                            <div className={`flex flex-col max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                <div className={`px-5 py-3.5 rounded-2xl ${msg.role === 'user' ? 'bg-white text-black shadow-sm' : 'bg-zinc-800/50 text-zinc-200'}`}>
                                    {/* Render Attachments first */}
                                    {msg.attachments?.map((att, i) => (
                                        <div key={i} className="mb-2 p-2 bg-black/5 rounded text-xs flex items-center gap-2 border border-black/5">
                                            {att.type === 'image' ? <ImageIcon size={12}/> : <Paperclip size={12}/>}
                                            {att.name}
                                        </div>
                                    ))}
                                    
                                    <div className="text-sm leading-relaxed whitespace-pre-wrap">
                                        {msg.role === 'error' ? (
                                            <span className="text-red-400 font-mono">{msg.text}</span>
                                        ) : (
                                            parseMarkdown(msg.text)
                                        )}
                                    </div>
                                </div>
                                <span className="text-[10px] text-zinc-600 mt-1.5 font-medium ml-1">
                                    {msg.role === 'user' ? 'YOU' : 'NEXUS'}
                                </span>
                            </div>
                        </div>
                    ))}
                    
                    {isTyping && (
                        <div className="flex gap-4">
                            <div className="w-8 h-8 rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center shrink-0">
                                <Code size={14} />
                            </div>
                            <ThinkingProcess mode={typingMode} />
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            )}
         </div>

         {/* Input Area */}
         <div className="absolute bottom-6 left-0 right-0 px-4 md:px-0 z-20">
            <div className="max-w-3xl mx-auto">
                <div className="bg-nexus-card border border-zinc-700/50 rounded-2xl p-2 shadow-2xl relative transition-all duration-300">
                    
                    {/* Attachment Pills */}
                    {attachments.length > 0 && (
                        <div className="flex gap-2 p-2 overflow-x-auto border-b border-zinc-800/50 mb-1">
                            {attachments.map((f, i) => (
                                <div key={i} className="flex items-center gap-2 px-3 py-1 bg-zinc-800 rounded-full text-xs text-zinc-300">
                                    <span className="truncate max-w-[100px]">{f.name}</span>
                                    <button onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))} className="hover:text-white"><X size={12} /></button>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex items-end gap-2 p-1">
                         <button 
                            className="p-2.5 text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-xl transition-colors"
                            onClick={() => fileInputRef.current?.click()}
                         >
                             <Paperclip size={20} />
                         </button>
                         <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} accept="image/*,.txt,.js,.py,.json,.md" />

                         <textarea 
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    sendMessage();
                                }
                            }}
                            placeholder="Message Nexus..."
                            className="flex-1 bg-transparent border-none focus:ring-0 text-white placeholder-zinc-500 resize-none py-2.5 max-h-[200px] overflow-y-auto text-sm"
                            rows={1}
                            style={{ height: 'auto', minHeight: '44px' }}
                         />

                         <button 
                            className={`p-2.5 rounded-xl transition-colors ${isRecording ? 'text-red-500 bg-red-500/10' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'}`}
                            onClick={toggleRecording}
                         >
                             <Mic size={20} />
                         </button>

                         <button 
                            className={`p-2.5 rounded-xl transition-all ${inputValue.trim() || attachments.length > 0 ? 'bg-white text-black hover:bg-zinc-200' : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'}`}
                            onClick={sendMessage}
                            disabled={!inputValue.trim() && attachments.length === 0}
                         >
                             <Send size={18} />
                         </button>
                    </div>
                </div>
            </div>
         </div>

      </div>

      {/* Settings Modal */}
      {isSettingsOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-2xl p-6 shadow-2xl">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg font-semibold text-white">Settings</h3>
                      <button onClick={() => setSettingsOpen(false)} className="text-zinc-500 hover:text-white"><X size={20}/></button>
                  </div>
                  
                  <div className="space-y-6">
                      <div className="space-y-3">
                          <label className="text-xs font-medium uppercase text-zinc-500 tracking-wider">Personality</label>
                          <div className="grid grid-cols-2 gap-2">
                              {['conversational', 'academic', 'brainrot', 'roast-master', 'formal', 'zesty'].map((p) => (
                                  <button 
                                    key={p}
                                    onClick={() => setPersonality(p as PersonalityMode)}
                                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${personality === p ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}
                                  >
                                      {p.replace('-', ' ').charAt(0).toUpperCase() + p.replace('-', ' ').slice(1)}
                                  </button>
                              ))}
                          </div>
                      </div>
                  </div>
                  
                  <div className="mt-8 pt-6 border-t border-zinc-800 flex justify-end">
                      <button onClick={() => setSettingsOpen(false)} className="px-4 py-2 bg-white text-black rounded-lg font-medium text-sm hover:bg-zinc-200">Done</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};