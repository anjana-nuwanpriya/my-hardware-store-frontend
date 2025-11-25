'use client';

import { useEffect, useState } from 'react';
import { Wifi, WifiOff, CheckCircle } from 'lucide-react';

export default function SyncIndicator() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg shadow-sm border">
      {isOnline ? (
        <Wifi className="w-5 h-5 text-green-500" />
      ) : (
        <WifiOff className="w-5 h-5 text-orange-500" />
      )}
      <div className="text-sm">
        {isOnline ? (
          <span className="text-gray-600">Online</span>
        ) : (
          <span className="text-orange-600 font-medium">Offline Mode</span>
        )}
      </div>
      <CheckCircle className="w-4 h-4 text-green-500" />
    </div>
  );
}