import React from 'react';
import { motion } from 'framer-motion'; // Added import for motion

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
  glass?: boolean;
  style?: React.CSSProperties; // Added style prop
}

const Card = ({ children, className = '', hoverable = false, glass = false, style }: CardProps) => { // Added style to destructuring
  // Removed baseStyles, hoverStyles, variantStyles variables
  return (
    <motion.div // Changed div to motion.div
      whileHover={hoverable ? { y: -5, transition: { duration: 0.2 } } : undefined} // Added whileHover prop
      className={`
        rounded-2xl border transition-all duration-300
        ${glass // Updated glass styles
          ? 'bg-surface/40 backdrop-blur-xl border-border-main/50'
          : 'bg-surface border-border-main shadow-sm'
        }
        ${className}
      `}
      style={style} // Added style prop
    >
      {children}
    </motion.div>
  );
};

export default Card;
