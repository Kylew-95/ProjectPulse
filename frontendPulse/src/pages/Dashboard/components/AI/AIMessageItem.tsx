import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion } from 'framer-motion';
import { Bot, User } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface AIMessageItemProps {
  message: Message;
}

const AIMessageItem: React.FC<AIMessageItemProps> = ({ message }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} mb-1`}
    >
      <div className={`flex gap-2 sm:gap-3 max-w-[95%] sm:max-w-[85%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
        <div className={`flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center border ${
          message.role === 'user' 
            ? 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10' 
            : 'bg-blue-500/10 border-blue-500/20'
        }`}>
          {message.role === 'user' ? <User size={14} className="text-slate-500 sm:w-4 sm:h-4" /> : <Bot size={14} className="text-blue-500 sm:w-4 sm:h-4" />}
        </div>
        <div className={`flex flex-col gap-1 ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
          <div className={`px-3 sm:px-4 py-2 sm:py-3 rounded-2xl text-[13px] sm:text-sm leading-relaxed shadow-sm prose prose-slate dark:prose-invert max-w-none ${
            message.role === 'user'
              ? 'bg-blue-600 text-white rounded-tr-none'
              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-white/5 rounded-tl-none'
          }`}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content}
            </ReactMarkdown>
          </div>
          <span className="text-[9px] sm:text-[10px] font-medium text-slate-400 px-1">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </motion.div>

  );
};

export default AIMessageItem;
