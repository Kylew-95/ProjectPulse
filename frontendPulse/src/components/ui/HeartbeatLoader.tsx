import { motion } from "framer-motion";


interface HeartbeatLoaderProps {
  standalone?: boolean;
  title?: string;
  subtitle?: string;
  fullScreen?: boolean;
  onRetry?: () => void;
  retryText?: string;
}

const HeartbeatLoader = ({ 
  standalone = false, 
  title, 
  subtitle,
  fullScreen = true,
  onRetry,
  retryText = "Taking a while? Click to refresh"
}: HeartbeatLoaderProps) => {
  const content = (
    <div className="flex flex-col items-center gap-4">
      <svg
        width="200"
        height="100"
        viewBox="0 0 200 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-primary stroke-current"
      >
        <motion.path
          d="M 0 50 L 30 50 L 45 50 L 55 20 L 65 80 L 75 50 L 90 50 L 100 20 L 110 80 L 120 50 L 200 50"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ 
            pathLength: [0, 1, 1], 
            opacity: [0, 1, 0],
            x: [0, 0, 50] // subtle forward movement
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
            times: [0, 0.8, 1]
          }}
        />
      </svg>
      {(title || subtitle) && (
        <div className="flex flex-col items-center gap-1 animate-in fade-in slide-in-from-bottom-2 duration-700">
           {title && <h2 className="text-xl font-black tracking-tighter text-main uppercase italic">{title}</h2>}
           {subtitle && <p className="text-sm text-muted font-bold tracking-[0.2em] uppercase opacity-60">{subtitle}</p>}
           {onRetry && (
             <button 
               onClick={onRetry}
               className="mt-6 px-6 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-black uppercase tracking-widest transition-all duration-300 border border-white/10 hover:border-white/20 active:scale-95 shadow-xl shadow-black/20"
             >
               {retryText}
             </button>
           )}
        </div>
      )}
    </div>
  );

  if (standalone) return content;

  return (
    <div className={`flex items-center justify-center ${fullScreen ? 'fixed inset-0 z-[1000] min-h-screen bg-background text-white' : 'w-full py-20'}`}>
      {content}
    </div>
  );
};

export default HeartbeatLoader;
