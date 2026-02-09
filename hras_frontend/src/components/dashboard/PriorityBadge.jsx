import React from 'react';

const PriorityBadge = ({ priority }) => {
  const getPriorityStyles = (priority) => {
    switch (priority.toLowerCase()) {
      case 'critical':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'high':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'low':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityStyles(priority)}`}>
      {priority.toUpperCase()}
    </span>
  );
};

export default PriorityBadge;