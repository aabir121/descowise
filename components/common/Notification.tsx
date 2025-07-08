import React from 'react';

interface NotificationProps {
  message: string;
  className?: string;
}

const Notification: React.FC<NotificationProps> = ({ message, className = '' }) => (
  <div className={`fixed top-5 left-1/2 z-[60] bg-green-600 text-white px-6 py-3 rounded-full shadow-lg animate-fade-in-down -translate-x-1/2 ${className}`}>
    {message}
  </div>
);

export default Notification; 