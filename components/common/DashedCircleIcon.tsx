import React from 'react';

interface DashedCircleIconProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

const DashedCircleIcon: React.FC<DashedCircleIconProps> = ({ children, className = '', ...props }) => (
  <div
    className={`w-16 h-16 border-2 border-dashed border-slate-600 hover:border-cyan-500 rounded-full flex items-center justify-center mb-4 transition-colors ${className}`}
    {...props}
  >
    {children}
  </div>
);

export default DashedCircleIcon; 