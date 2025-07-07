// @ts-nocheck
import React from 'react';

interface DashboardNotificationProps {
  message: string;
}

const DashboardNotification: React.FC<DashboardNotificationProps> = ({ message }) => (
  <div className="fixed top-5 left-1/2 z-[60] bg-green-600 text-white px-6 py-3 rounded-full shadow-lg animate-fade-in-down">
    {message}
  </div>
);

export default DashboardNotification; 