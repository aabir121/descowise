import React from 'react';

interface NotificationProps {
  message: string;
  type?: 'info' | 'warning' | 'error';
  className?: string;
}

const Notification: React.FC<NotificationProps> = ({ message, type = 'info', className = '' }) => {
  const getNotificationStyles = () => {
    switch (type) {
      case 'warning':
        return 'bg-yellow-600 text-white';
      case 'error':
        return 'bg-red-600 text-white';
      default:
        return 'bg-green-600 text-white';
    }
  };

  return (
    <div className={`fixed top-5 left-1/2 z-[60] ${getNotificationStyles()} px-6 py-3 rounded-full shadow-lg animate-fade-in-down -translate-x-1/2 ${className}`}>
      {message}
    </div>
  );
};

export default Notification; 