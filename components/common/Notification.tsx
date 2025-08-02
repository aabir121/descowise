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
    <div className={`fixed top-4 left-1/2 z-[60] ${getNotificationStyles()} px-4 py-3 rounded-lg shadow-lg animate-fade-in-down -translate-x-1/2 max-w-[calc(100vw-2rem)] w-auto mx-2 sm:max-w-md sm:px-6 sm:py-4 text-center text-sm sm:text-base ${className}`}>
      {message}
    </div>
  );
};

export default Notification;