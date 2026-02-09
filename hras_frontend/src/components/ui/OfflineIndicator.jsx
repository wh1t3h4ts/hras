import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, AlertTriangle, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

const OfflineIndicator = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showMessage, setShowMessage] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Connection restored!');
      setTimeout(() => setShowMessage(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowMessage(true);
      toast.error('Connection lost - working offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showMessage && isOnline) return null;

  return (
    <div className={`fixed bottom-4 left-4 z-50 transition-all duration-300 ${
      showMessage ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
    }`}>
      <div className={`flex items-center space-x-3 px-4 py-3 rounded-lg shadow-lg ${
        isOnline
          ? 'bg-green-600/90 text-white border border-green-500/30'
          : 'bg-red-600/90 text-white border border-red-500/30'
      }`}>
        {isOnline ? (
          <Wifi className="h-5 w-5" />
        ) : (
          <WifiOff className="h-5 w-5" />
        )}
        <div className="flex-1">
          <p className="text-sm font-medium">
            {isOnline ? 'Connection Restored' : 'Backend Offline'}
          </p>
          <p className="text-xs opacity-90">
            {isOnline
              ? 'All features available'
              : 'Using cached data - some features limited'
            }
          </p>
        </div>
        {!isOnline && (
          <button
            onClick={() => window.location.reload()}
            className="flex items-center space-x-1 px-2 py-1 bg-white/20 hover:bg-white/30 rounded text-xs transition-colors"
          >
            <RefreshCw className="h-3 w-3" />
            <span>Retry</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default OfflineIndicator;