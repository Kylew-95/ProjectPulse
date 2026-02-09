import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'blue' | 'emerald' | 'amber' | 'red' | 'slate';
  size?: 'xs' | 'sm';
  className?: string;
}

const Badge = ({ children, variant = 'slate', size = 'sm', className = '' }: BadgeProps) => {
  const baseStyles = "inline-flex items-center gap-1.5 font-bold uppercase tracking-widest rounded-full border";
  
  const variants = {
    blue: "bg-blue-500/5 border-blue-500/10 text-blue-400",
    emerald: "bg-emerald-500/5 border-emerald-500/10 text-emerald-400",
    amber: "bg-amber-500/5 border-amber-500/10 text-amber-400",
    red: "bg-red-500/5 border-red-500/10 text-red-500",
    slate: "bg-white/5 border-white/10 text-slate-400"
  };

  const sizes = {
    xs: "px-2 py-0.5 text-[8px]",
    sm: "px-3 py-1 text-[10px]"
  };

  return (
    <span className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}>
      {children}
    </span>
  );
};

export default Badge;
