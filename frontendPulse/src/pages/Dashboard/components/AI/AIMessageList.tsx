import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot } from 'lucide-react';
import AIMessageItem from './AIMessageItem';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface AIMessageListProps {
  messages: Message[];
  isWaitingForAI: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
}

const AIMessageList: React.FC<AIMessageListProps> = ({ messages, isWaitingForAI, messagesEndRef }) => {
  return (
    <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-white/10">
      <div className="space-y-6">
        <AnimatePresence initial={false}>
          {messages.map((message) => (
            <AIMessageItem key={message.id} message={message} />
          ))}
        </AnimatePresence>
      </div>

      {isWaitingForAI && (
        <motion.div 
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-start mt-6"
        >
          <div className="flex gap-3 max-w-[85%] items-start">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center border bg-blue-500/10 border-blue-500/20">
              <Bot size={16} className="text-blue-500" />
            </div>
            <div className="bg-white dark:bg-slate-800 px-4 py-3 rounded-2xl rounded-tl-none border border-slate-100 dark:border-white/5 shadow-sm">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
                    className="w-1.5 h-1.5 rounded-full bg-blue-500"
                  />
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default AIMessageList;
