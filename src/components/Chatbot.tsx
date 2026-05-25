import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api';
import { MessageSquare, Send, X, Minimize2, Maximize2, Bot, User, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Task } from '../types';

interface Message {
  role: 'user' | 'model';
  text: string;
}

interface ChatbotProps {
  tasks: Task[];
}

export const Chatbot: React.FC<ChatbotProps> = ({ tasks }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: 'مرحباً! أنا مساعدك الذكي. كيف يمكنني مساعدتك في إدارة مهامك اليوم؟' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      const taskSummary = `Total: ${tasks.length}, Completed: ${tasks.filter(t => t.status === 'completed').length}, Ongoing: ${tasks.filter(t => t.status === 'ongoing').length}, Not Started: ${tasks.filter(t => t.status === 'not-started').length}, Overdue: ${tasks.filter(t => t.status === 'overdue').length}`;

      const history = messages.map(m => ({ role: m.role, text: m.text }));

      const response = await api.chat(userMessage, history, taskSummary);

      const aiText = response.text || response.message || 'عذراً، لم أتمكن من معالجة طلبك.';
      setMessages(prev => [...prev, { role: 'model', text: aiText }]);
    } catch (error) {
      console.error('Chatbot error:', error);
      setMessages(prev => [...prev, { role: 'model', text: 'حدث خطأ أثناء الاتصال بالمساعد الذكي. يرجى المحاولة مرة أخرى.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
              height: isMinimized ? 'auto' : '500px'
            }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="mb-4 w-80 sm:w-[400px] bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gold/10 rounded-lg border border-gold/20">
                  <Bot size={18} className="text-gold" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white leading-none">المساعد الذكي</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">متصل الآن</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-all text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-all text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {!isMinimized && (
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 dark:bg-slate-800/30 custom-scrollbar">
                  {messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex gap-2 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                        <div className={`mt-1 p-1.5 rounded-lg shrink-0 ${msg.role === 'user' ? 'bg-gold/10 text-gold' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-300'}`}>
                          {msg.role === 'user' ? <User size={12} /> : <Bot size={12} />}
                        </div>
                        <div className={`px-3 py-2 rounded-lg text-sm leading-relaxed ${
                          msg.role === 'user'
                            ? 'bg-gold text-navy'
                            : 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-600'
                        }`}>
                          {msg.text}
                        </div>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="flex gap-2 items-center bg-white dark:bg-slate-700 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600">
                        <Loader2 size={12} className="animate-spin text-gold" />
                        <span className="text-xs text-slate-500 dark:text-slate-400">جاري التفكير...</span>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700">
                  <div className="relative flex items-center gap-2">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                      placeholder="اكتب رسالتك هنا..."
                      className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-all"
                    />
                    <button
                      onClick={handleSend}
                      disabled={!input.trim() || isLoading}
                      className="p-2 bg-gold text-navy rounded-lg hover:bg-gold/90 active:scale-95 disabled:opacity-50 transition-all"
                    >
                      <Send size={16} />
                    </button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.1, rotate: 5 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-12 h-12 rounded-xl shadow-lg flex items-center justify-center transition-all duration-300 ${
          isOpen ? 'bg-navy text-gold border border-gold/50 rotate-90' : 'glassy-gold text-navy border border-white/20'
        }`}
      >
        {isOpen ? <X size={22} /> : <MessageSquare size={22} />}
      </motion.button>
    </div>
  );
};
