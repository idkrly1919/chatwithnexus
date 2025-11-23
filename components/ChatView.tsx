/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, Paperclip, Settings, X, Plus, Image as ImageIcon, Layers, MapPin } from 'lucide-react';
import { Message, PersonalityMode, Attachment } from '../types';
import { geminiService } from '../services/geminiService';
import { ThinkingProcess } from './ThinkingProcess';

interface ChatViewProps {
  isTyping: boolean;
  setIsTyping: (isTyping: boolean) => void;
  typingMode: 'reasoning' | 'image-gen';
  setTypingMode: (mode: 'reasoning' | 'image-gen') => void;
}

export const ChatView: React.FC<ChatViewProps> = ({ isTyping, setIsTyping, typingMode, setTypingMode }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isSettingsOpen, setSettingsOpen] = useState(false);
  const [personality, setPersonality] = useState<PersonalityMode>('conversational');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isRecording, setIsRecording] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            setInputValue(prev => prev + event.results[i][0].transcript);
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
      };
      recognitionRef.current = recognition;
    }
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
        textareaRef.current.style.height = '0px';
        const scrollHeight = textareaRef.current.scrollHeight;
        textareaRef.current.style.height = Math.min(scrollHeight, 200) + 'px';
    }
  }, [inputValue]);


  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    } else {
      recognitionRef.current?.start();
      setIsRecording(true);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (ev) => {
        const content = ev.target?.result as string;
        const type = file.type.startsWith('image/') ? 'image' : 'text';
        setAttachments(prev => [...prev, { type, content, name: file.name }]);
      };
      if (file.type.startsWith('image/')) reader.readAsDataURL(file);
      else reader.readAsText(file);
    }
  };
  
  const handleNewChat = () => {
    setMessages([]);
    setInputValue('');
    setAttachments([]);
    setIsTyping(false);
  };

  const sendMessage = async () => {
    if (!inputValue.trim() && attachments.length === 0) return;
    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: inputValue, attachments: [...attachments], timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setAttachments([]);
    setIsTyping(true);
    setTypingMode(geminiService.isImageGenerationRequest(userMsg.text) ? 'image-gen' : 'reasoning');

    try {
      const generator = geminiService.streamGemini([...messages, userMsg], personality);
      let assistantMsgId = (Date.now() + 1).toString();
      let currentText = '';
      setMessages(prev => [...prev, { id: assistantMsgId, role: 'assistant', text: '', timestamp: Date.now() }]);
      for await (const update of generator) {
        currentText = update.text;
        setMessages(prev => prev.map(m => m.id === assistantMsgId ? { ...m, text: currentText, role: update.error ? 'error' : 'assistant' } : m));
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'error', text: "A critical error occurred.", timestamp: Date.now() }]);
    } finally {
      setIsTyping(false);
    }
  };

  const parseMarkdown = (text: string) => {
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
                  <a href={match[2]} download target="_blank" rel="noopener noreferrer" className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-medium rounded-lg cursor-pointer">Download</a>
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
          if (chunk.startsWith('`') && chunk.endsWith('`')) return <code key={j} className="bg-zinc-800 text-cyan-300 px-1.5 py-1 rounded font-mono text-sm border border-zinc-700">{chunk.slice(1, -1)}</code>;
          if (chunk.startsWith('**') && chunk.endsWith('**')) return <strong key={j} className="font-bold text-white">{chunk.slice(2, -2)}</strong>;
          return chunk;
        })}
        {i < text.split('\n').length - 1 && <br />}
      </React.Fragment>
    ));
  }

  return (
    <div className="flex h-screen bg-transparent text-zinc-300 overflow-hidden font-sans">
      <div className="flex-1 flex flex-col relative w-full">
        {/* Top Header */}
        <header className="fixed top-0 left-0 right-0 z-30 p-4">
          <div className="max-w-4xl mx-auto flex justify-between items-center">
            <button onClick={handleNewChat} className="p-2 text-zinc-400 hover:text-white transition-colors">
              <Plus size={20} />
            </button>
            <span className="font-brand font-medium text-lg text-zinc-200">Nexus</span>
            <button onClick={() => setSettingsOpen(true)} className="p-2 text-zinc-400 hover:text-white transition-colors">
              <Settings size={20} />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto pt-24 pb-40 px-4 md:px-8 scroll-smooth">
          {messages.length === 0 && !isTyping ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-zinc-500">
                <div className="relative mb-4">
                  <Layers size={32} className="text-zinc-600 relative z-10" />
                  <div className="absolute inset-0 -m-2 bg-blue-500/10 blur-xl rounded-full"></div>
                </div>
                <h2 className="text-xl font-medium text-zinc-300">How can I help you?</h2>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-8">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className="flex flex-col max-w-[85%]">
                    <div className={`px-5 py-3.5 rounded-2xl ${msg.role === 'user' ? 'bg-zinc-800 text-zinc-200 rounded-br-none' : 'bg-transparent text-zinc-200 rounded-bl-none'}`}>
                      {msg.attachments?.map((att, i) => (<div key={i} className={`mb-2 p-2 rounded text-xs flex items-center gap-2 bg-zinc-700/50 text-zinc-300 border border-zinc-700`}> {att.type === 'image' ? <ImageIcon size={12}/> : <Paperclip size={12}/>} {att.name}</div>))}
                      <div className="text-sm leading-relaxed whitespace-pre-wrap">{msg.role === 'error' ? <span className="text-red-400 font-mono">{msg.text}</span> : parseMarkdown(msg.text)}</div>
                    </div>
                  </div>
                </div>
              ))}
              {isTyping && (<div className="flex gap-4"><ThinkingProcess mode={typingMode} /></div>)}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-4 md:pb-6 z-20 bg-gradient-to-t from-[#121212] via-[#121212]/90 to-transparent">
          <div className="max-w-3xl mx-auto">
            {attachments.length > 0 && (
              <div className="flex gap-2 p-2 overflow-x-auto mb-2 scrollbar-hide">
                {attachments.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 pl-3 pr-2 py-1 bg-zinc-800 border border-zinc-700 rounded-full text-xs text-zinc-300">
                    <span className="truncate max-w-[100px]">{f.name}</span>
                    <button onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))} className="hover:text-white text-zinc-400">
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="bg-[#1c1c1c] border border-zinc-700/50 rounded-lg p-2">
              <div className="flex items-end gap-2">
                <button className="p-2.5 text-zinc-400 hover:text-white" onClick={() => fileInputRef.current?.click()}>
                  <Paperclip size={20} />
                </button>
                <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} accept="image/*,.txt,.js,.py,.json,.md" />
                <textarea ref={textareaRef} value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }} placeholder="Message Nexus..." className="flex-1 bg-transparent border-none focus:ring-0 text-zinc-200 placeholder-zinc-500 resize-none py-2 max-h-[200px] overflow-y-auto text-sm scrollbar-hide" rows={1} />
                <button className={`p-2.5 rounded-lg ${isRecording ? 'text-red-400 bg-red-500/10' : 'text-zinc-400 hover:text-white'}`} onClick={toggleRecording}>
                  <Mic size={20} />
                </button>
                <button className="p-2.5 text-zinc-400 hover:text-white">
                  <MapPin size={20} />
                </button>
                <button className={`p-2.5 rounded-lg transition-colors ${inputValue.trim() || attachments.length > 0 ? 'bg-zinc-700 text-white hover:bg-zinc-600' : 'bg-transparent text-zinc-400 cursor-not-allowed'}`} onClick={sendMessage} disabled={!inputValue.trim() && attachments.length === 0}>
                  <Send size={18} />
                </button>
              </div>
            </div>
            <div className="text-center text-[10px] text-zinc-600 mt-2 font-mono uppercase tracking-wider">
              Nexus v2.0 &bull; Real-time Reasoning
            </div>
          </div>
        </div>
      </div>

      {isSettingsOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-2xl p-6 shadow-2xl text-zinc-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-white">Settings</h3>
              <button onClick={() => setSettingsOpen(false)} className="text-zinc-500 hover:text-white"><X size={20}/></button>
            </div>
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase text-zinc-500 tracking-wider">Personality</label>
                <div className="grid grid-cols-2 gap-2">
                  {['conversational', 'academic', 'brainrot', 'roast-master', 'formal', 'zesty'].map((p) => (
                    <button key={p} onClick={() => setPersonality(p as PersonalityMode)} className={`px-3 py-2 rounded-lg text-xs font-medium ${personality === p ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}>
                      {p.replace('-', ' ').charAt(0).toUpperCase() + p.replace('-', ' ').slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-8 pt-6 border-t border-zinc-800 flex justify-end">
              <button onClick={() => setSettingsOpen(false)} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-500">Done</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
