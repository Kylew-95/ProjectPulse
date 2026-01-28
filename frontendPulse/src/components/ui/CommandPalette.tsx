import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  LayoutDashboard, 
  Users, 
  Ticket, 
  BarChart2, 
  Settings, 
  LogOut,
  Command as CommandIcon
} from 'lucide-react';
import { supabase } from '../../supabaseClient';

interface Command {
  id: string;
  label: string;
  icon: React.ElementType;
  action: () => void;
  category: string;
  shortcut?: string;
}

const CommandPalette = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  const commands: Command[] = [
    { 
      id: 'overview', 
      label: 'Go to Overview', 
      icon: LayoutDashboard, 
      action: () => navigate('/dashboard/overview'), 
      category: 'Navigation',
      shortcut: 'G O'
    },
    { 
      id: 'team', 
      label: 'Go to Team', 
      icon: Users, 
      action: () => navigate('/dashboard/team'), 
      category: 'Navigation',
      shortcut: 'G T'
    },
    { 
      id: 'tickets', 
      label: 'Go to Tickets', 
      icon: Ticket, 
      action: () => navigate('/dashboard/tickets'), 
      category: 'Navigation',
      shortcut: 'G T'
    },
    { 
      id: 'analytics', 
      label: 'Go to Analytics', 
      icon: BarChart2, 
      action: () => navigate('/dashboard/analytics'), 
      category: 'Navigation',
      shortcut: 'G A'
    },
    { 
      id: 'settings', 
      label: 'Go to Settings', 
      icon: Settings, 
      action: () => navigate('/dashboard/settings'), 
      category: 'Navigation',
      shortcut: 'G S'
    },
    { 
      id: 'logout', 
      label: 'Log Out', 
      icon: LogOut, 
      action: async () => {
        await supabase.auth.signOut();
        navigate('/login');
      }, 
      category: 'Account'
    }
  ];

  const filteredCommands = commands.filter(cmd => 
    cmd.label.toLowerCase().includes(search.toLowerCase()) ||
    cmd.category.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      } else if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
    } else if (e.key === 'Enter') {
      if (filteredCommands[selectedIndex]) {
        filteredCommands[selectedIndex].action();
        setIsOpen(false);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh] px-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-md animate-in fade-in duration-300"
        onClick={() => setIsOpen(false)}
      />

      {/* Palette Container */}
      <div 
        className="relative w-full max-w-2xl bg-slate-900/80 border border-white/10 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-2xl animate-in zoom-in-95 fade-in duration-200"
        onKeyDown={handleKeyDown}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-white/5 bg-white/5">
          <Search size={20} className="text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or search..."
            className="w-full bg-transparent border-none outline-none text-white placeholder:text-slate-500 text-lg"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedIndex(0);
            }}
          />
          <div className="flex items-center gap-1.5 shrink-0 px-2 py-1 rounded-lg bg-white/5 border border-white/10">
            <CommandIcon size={12} className="text-slate-400" />
            <span className="text-[10px] font-bold text-slate-400 uppercase">K</span>
          </div>
        </div>

        {/* Results List */}
        <div className="max-h-[60vh] overflow-y-auto p-2 scrollbar-hide">
          {filteredCommands.length > 0 ? (
            <div className="space-y-1">
              {filteredCommands.map((cmd, index) => {
                const Icon = cmd.icon;
                const isSelected = index === selectedIndex;
                
                return (
                  <button
                    key={cmd.id}
                    onClick={() => {
                      cmd.action();
                      setIsOpen(false);
                    }}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`w-full flex items-center justify-between px-3 py-3 rounded-xl transition-all duration-200 group ${
                      isSelected 
                        ? 'bg-primary/20 text-white translate-x-1 shadow-lg shadow-primary/10' 
                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg transition-colors ${isSelected ? 'bg-primary text-white' : 'bg-slate-800 text-slate-400'}`}>
                        <Icon size={18} />
                      </div>
                      <div className="text-left">
                        <p className="font-medium">{cmd.label}</p>
                        <p className={`text-xs ${isSelected ? 'text-primary/70' : 'text-slate-500'}`}>{cmd.category}</p>
                      </div>
                    </div>
                    {cmd.shortcut && (
                      <div className="flex items-center gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                        {cmd.shortcut.split(' ').map((key, i) => (
                          <span key={i} className="px-1.5 py-0.5 rounded border border-white/20 text-[10px] font-bold uppercase">{key}</span>
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center">
              <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/5">
                <Search size={20} className="text-slate-500" />
              </div>
              <p className="text-slate-400 font-medium">No commands found</p>
              <p className="text-slate-500 text-sm mt-1">Try searching for something else</p>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="px-4 py-3 border-t border-white/5 bg-white/5 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 italic">
              <span className="px-1 rounded bg-slate-800 text-slate-300 not-italic">↑↓</span> to navigate
            </span>
            <span className="flex items-center gap-1.5 italic">
              <span className="px-1 rounded bg-slate-800 text-slate-300 not-italic">Enter</span> to select
            </span>
            <span className="flex items-center gap-1.5 italic">
              <span className="px-1 rounded bg-slate-800 text-slate-300 not-italic">Esc</span> to close
            </span>
          </div>
          <div className="flex items-center gap-1 font-bold tracking-widest uppercase opacity-30">
            Project Pulse
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
