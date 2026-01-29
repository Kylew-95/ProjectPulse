import { Moon, Sun } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="flex items-center gap-3 p-1.5 px-3 rounded-full bg-slate-900/10 dark:bg-white/5 hover:bg-slate-900/20 dark:hover:bg-white/10 border border-slate-900/10 dark:border-white/10 transition-all duration-300 shadow-sm group relative"
      aria-label="Toggle theme"
    >
      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={theme}
            initial={{ y: 20, opacity: 0, rotate: -45 }}
            animate={{ y: 0, opacity: 1, rotate: 0 }}
            exit={{ y: -20, opacity: 0, rotate: 45 }}
            transition={{ duration: 0.2, ease: "backOut" }}
            className="absolute"
          >
            {theme === 'dark' ? (
              <Moon size={12} className="text-blue-400 fill-blue-400/20" />
            ) : (
              <Sun size={12} className="text-amber-500 fill-amber-500/20" />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
      <span className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 group-hover:text-primary dark:group-hover:text-white transition-colors">
        {theme} mode
      </span>

      {/* Subtle pulse animation for "Pulse" vibe */}
      <div className="absolute inset-0 rounded-full animate-pulse bg-primary/5 pointer-events-none group-hover:hidden" />
    </button>
  );
};

export default ThemeToggle;
