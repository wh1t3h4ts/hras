import React from 'react';
import { Activity, Heart } from 'lucide-react';

const HRASLogo = ({ className = '', showText = true, size = 'default', compact = false }) => {
  const sizeClasses = {
    small: 'h-6 w-6',
    default: 'h-8 w-8',
    large: 'h-10 w-10',
    header: 'h-8 w-8' // Match header size
  };

  const textSizeClasses = {
    small: 'text-lg',
    default: 'text-xl',
    large: 'text-2xl',
    header: 'text-xl' // Match header text size
  };

  return (
    <div className={`flex items-center ${compact ? 'space-x-1 py-1.5 px-2' : 'space-x-2'} ${className}`}>
      {/* Logo Icon */}
      <div className="relative">
        <div className={`${sizeClasses[size]} bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-lg`}>
          <Activity className="h-4 w-4 text-white" />
        </div>
        {/* Medical cross accent */}
        <div className="absolute -top-1 -right-1">
          <Heart className="h-3 w-3 text-red-500 fill-current" />
        </div>
      </div>

      {/* Logo Text */}
      {showText && (
        <div className="flex flex-col">
          <span className={`${textSizeClasses[size]} font-bold text-slate-100 leading-none ${compact ? 'text-lg' : ''}`}>
            HRAS
          </span>
          <span className={`text-xs text-slate-400 leading-none -mt-0.5 ${compact ? 'text-xs' : ''}`}>
            Hospital
          </span>
        </div>
      )}
    </div>
  );
};

export default HRASLogo;