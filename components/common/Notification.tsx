import React from 'react';

interface NotificationProps {
  message: string;
  type?: 'info' | 'warning' | 'error';
  className?: string;
  onClose?: () => void; // Add optional onClose prop
}

const Notification: React.FC<NotificationProps> = ({ message, type = 'info', className = '', onClose }) => {
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
    <div className={`fixed top-4 left-1/2 z-[60] ${getNotificationStyles()} px-4 py-3 rounded-lg shadow-lg animate-fade-in-down -translate-x-1/2 max-w-[calc(100vw-2rem)] w-auto mx-2 sm:max-w-md sm:px-6 sm:py-4 text-center text-sm sm:text-base flex items-center justify-between ${className}`}>
      <span>{message}</span>
      {onClose && (
        <button
          onClick={onClose}
          className="ml-4 text-white opacity-70 hover:opacity-100 focus:outline-none"
          aria-label="Close notification"
        >
          &times;
        </button>
      )}
    </div>
  );
};

export default Notification;