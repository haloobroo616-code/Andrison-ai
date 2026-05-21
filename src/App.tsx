/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Bot, Send, User, Sparkles, Loader2, RefreshCw, Image as ImageIcon, X } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  imageUrl?: string;
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initial greeting
  useEffect(() => {
    setMessages([
      {
        role: 'assistant',
        content: 'Halo! Saya AndrisonXai, siap bantu kamu',
      },
    ]);
  }, []);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Gambar terlalu besar! Maksimal 5MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImageSelection = () => {
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if ((!input.trim() && !selectedImage) || isLoading) return;

    const userMessage = input.trim();
    const imageToSend = selectedImage;
    
    setInput('');
    clearImageSelection();
    
    const newMessages: Message[] = [...messages, { role: 'user', content: userMessage, imageUrl: imageToSend || undefined }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          history: messages.map(m => ({ 
            role: m.role === 'assistant' ? 'model' : 'user', 
            content: m.content,
            imageUrl: m.imageUrl
          })),
          message: userMessage,
          imageUrl: imageToSend || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      setMessages((prev) => [...prev, { role: 'assistant', content: data.text }]);
    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Maaf kak, sepertinya ada sedikit gangguan teknis. Boleh coba lagi?',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleReset = () => {
    setMessages([
      {
        role: 'assistant',
        content: 'Halo! Saya AndrisonXai, siap bantu kamu',
      },
    ]);
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 font-sans text-slate-800">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 shadow-sm z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-xl">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">AndrisonXai</h1>
            <p className="text-sm text-slate-500 font-medium tracking-wide">AI Assistant</p>
          </div>
        </div>
        <button
          onClick={handleReset}
          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
          title="Reset Chat"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto w-full max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            {/* Avatar */}
            <div className="shrink-0 mt-1">
              {msg.role === 'user' ? (
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-200 flex items-center justify-center border border-slate-300">
                  <User className="w-5 h-5 text-slate-600" />
                </div>
              ) : (
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-indigo-100 flex items-center justify-center border border-indigo-200">
                  <Bot className="w-5 h-5 text-indigo-600" />
                </div>
              )}
            </div>

            {/* Message Bubble */}
            <div
              className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-5 py-3 shadow-sm flex flex-col gap-2 ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-tr-none'
                  : 'bg-white border border-slate-100 text-slate-800 rounded-tl-none'
              }`}
            >
              {msg.imageUrl && (
                <img 
                  src={msg.imageUrl} 
                  alt="Uploaded" 
                  className="rounded-lg max-h-64 object-cover"
                />
              )}
              {msg.content && (
                msg.role === 'assistant' ? (
                  <div className="prose prose-slate prose-sm sm:prose-base max-w-none prose-p:leading-relaxed prose-pre:bg-slate-800 prose-pre:text-slate-50">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                )
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-4 flex-row">
            <div className="shrink-0 mt-1">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-indigo-100 flex items-center justify-center border border-indigo-200">
                <Bot className="w-5 h-5 text-indigo-600" />
              </div>
            </div>
            <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-none px-5 py-4 shadow-sm flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
              <span className="text-sm text-slate-500 animate-pulse">AndrisonXai sedang mengetik...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* Input Area */}
      <footer className="bg-white border-t border-slate-200 p-4 sm:p-6 shrink-0 z-10">
        <div className="max-w-4xl mx-auto flex flex-col gap-3">
          {selectedImage && (
            <div className="relative self-start mt-[-2rem] mb-2 p-2 bg-white rounded-xl shadow-md border border-slate-200 animate-in fade-in slide-in-from-bottom-2">
              <img src={selectedImage} alt="Preview" className="h-20 w-20 object-cover rounded-lg" />
              <button 
                onClick={clearImageSelection}
                className="absolute -top-2 -right-2 bg-slate-800 text-white rounded-full p-1 shadow-sm hover:bg-slate-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          <div className="flex items-end gap-3 w-full">
            <div className="relative flex-1 bg-slate-50 border border-slate-200 rounded-2xl shadow-sm focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 transition-all flex items-center">
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                ref={fileInputRef}
                onChange={handleImageSelect}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="pl-4 pr-2 py-4 text-slate-400 hover:text-indigo-600 transition-colors"
                title="Kirim Gambar"
              >
                <ImageIcon className="w-6 h-6" />
              </button>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Tanya AndrisonXai tentang apa saja..."
                className="w-full max-h-32 min-h-[56px] py-4 pl-2 pr-4 bg-transparent border-none focus:ring-0 resize-none outline-none text-slate-800 placeholder-slate-400"
                rows={1}
              />
            </div>
            <button
              onClick={handleSend}
              disabled={(!input.trim() && !selectedImage) || isLoading}
              className="flex-shrink-0 bg-indigo-600 text-white p-4 rounded-xl hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="text-center mt-3">
          <p className="text-xs text-slate-400 font-medium">AndrisonXai dapat membuat kesalahan. Harap periksa info penting.</p>
        </div>
      </footer>
    </div>
  );
}
