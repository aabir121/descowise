import React from 'react';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
  title?: string;
}

const IconButton: React.FC<IconButtonProps> = ({ children, className = '', title, ...props }) => (
  <button
    type="button"
    title={title}
    className={`flex items-center gap-2 font-bold rounded-full transition-all duration-200 ${className}`}
    {...props}
  >
    {children}
  </button>
);

export default IconButton; 