import React from 'react';
import { Clock, Eye, Play, FileText, CheckCircle, User } from 'lucide-react';
import PriorityBadge from '../dashboard/PriorityBadge';

const PatientAssignmentCard = ({
  patient,
  onStatusChange,
  onAddNote,
  onViewDetails
}) => {
  // Calculate time since assignment
  const getTimeSinceAssignment = (assignedAt: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - assignedAt.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just assigned';
    if (diffMins < 60) return `${diffMins} min ago`;
    const diffHours = Math.floor(diffMins / 60);
    return `${diffHours} hr ago`;
  };

  // Get time color based on urgency
  const getTimeColor = (assignedAt: Date, estimatedResponseTime = 30) => {
    const now = new Date();
    const diffMins = (now.getTime() - assignedAt.getTime()) / 60000;

    if (diffMins > estimatedResponseTime) return 'text-red-400';
    if (diffMins > estimatedResponseTime * 0.7) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-red-500/20 text-red-400';
      case 'in_progress':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'completed':
        return 'bg-green-500/20 text-green-400';
      default:
        return 'bg-slate-500/20 text-slate-400';
    }
  };

  return (
    <div className="bg-slate-800/70 border border-slate-700 rounded-xl p-6 hover:shadow-xl transition-all hover:border-slate-600">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h3 className="text-lg font-semibold text-slate-100">{patient.name}</h3>
            <PriorityBadge priority={patient.priority} />
          </div>
          <p className="text-slate-400 text-sm mb-2">
            Age: {patient.age || 'N/A'} • Room: {patient.room || 'Triage'}
          </p>
          <p className="text-slate-300 text-sm mb-3 line-clamp-2">
            {patient.symptoms || 'Symptoms not specified'}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4 text-sm">
          <span className={`flex items-center space-x-1 ${getTimeColor(patient.assignedAt, patient.estimatedResponseTime)}`}>
            <Clock className="h-4 w-4" />
            <span>{getTimeSinceAssignment(patient.assignedAt)}</span>
          </span>
          <span className="text-slate-400 flex items-center space-x-1">
            <User className="h-4 w-4" />
            <span>{patient.assignedTo}</span>
          </span>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(patient.status)}`}>
          {patient.status.replace('_', ' ').toUpperCase()}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onViewDetails(patient.id)}
          className="flex items-center space-x-2 px-4 py-3 min-h-12 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-sm font-medium transition-colors touch-manipulation"
        >
          <Eye className="h-4 w-4" />
          <span>View Details</span>
        </button>

        {patient.status === 'pending' && (
          <button
            onClick={() => onStatusChange(patient.id, 'in_progress')}
            className="flex items-center space-x-2 px-4 py-3 min-h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors touch-manipulation"
          >
            <Play className="h-4 w-4" />
            <span>Start Case</span>
          </button>
        )}

        <button
          onClick={() => onAddNote(patient.id)}
          className="flex items-center space-x-2 px-4 py-3 min-h-12 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-sm font-medium transition-colors touch-manipulation"
        >
          <FileText className="h-4 w-4" />
          <span>Add Note</span>
        </button>

        {patient.status !== 'completed' && (
          <button
            onClick={() => onStatusChange(patient.id, 'completed')}
            className="flex items-center space-x-2 px-4 py-3 min-h-12 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors touch-manipulation"
          >
            <CheckCircle className="h-4 w-4" />
            <span>Complete</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default PatientAssignmentCard;