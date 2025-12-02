import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverEffect?: boolean;
  selected?: boolean;
}

const GlassCard: React.FC<GlassCardProps> = ({ 
  children, 
  className = '', 
  onClick, 
  hoverEffect = false,
  selected = false
}) => {
  return (
    <div 
      onClick={onClick}
      className={`
        glass-panel rounded-2xl transition-all duration-300 relative overflow-hidden
        ${hoverEffect ? 'glass-panel-hover cursor-pointer' : ''}
        ${selected ? 'border-blue-400/40 bg-blue-900/20 shadow-[0_0_25px_rgba(59,130,246,0.25)]' : ''}
        ${className}
      `}
    >
      {/* Subtle shine effect on top edge */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-50 pointer-events-none" />
      
      {children}
    </div>
  );
};

export default GlassCard;