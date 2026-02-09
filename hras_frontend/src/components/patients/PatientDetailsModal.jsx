import React from 'react';
import { X, User, Phone, AlertTriangle, Calendar, MapPin, Clock, CheckCircle } from 'lucide-react';
import PriorityBadge from '../dashboard/PriorityBadge';

const PatientDetailsModal = ({ isOpen, onClose, patient }) => {
  if (!isOpen || !patient) return null;

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTimeSinceAssignment = (assignedAt) => {
    if (!assignedAt) return 'Not assigned';
    const now = new Date();
    const assigned = new Date(assignedAt);
    const diffMs = now.getTime() - assigned.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just assigned';
    if (diffMins < 60) return `${diffMins} min ago`;
    const diffHours = Math.floor(diffMins / 60);
    return `${diffHours} hr ago`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <User className="h-6 w-6 text-gray-400" />
            <h2 className="text-xl font-semibold text-gray-900">Patient Details</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Patient Name and Status */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <h3 className="text-2xl font-bold text-gray-900">{patient.name}</h3>
              <PriorityBadge priority={patient.severity || patient.priority} />
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(patient.status)}`}>
              {patient.status?.replace('_', ' ').toUpperCase() || 'UNKNOWN'}
            </div>
          </div>

          {/* Patient Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-900 mb-3">Basic Information</h4>

              <div className="flex items-center space-x-3">
                <User className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Age</p>
                  <p className="text-gray-900">{patient.age || 'Not specified'}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="text-gray-900">{patient.telephone || 'Not provided'}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <MapPin className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Room</p>
                  <p className="text-gray-900">{patient.room || 'Triage'}</p>
                </div>
              </div>
            </div>

            {/* Assignment Info */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-900 mb-3">Assignment Details</h4>

              <div className="flex items-center space-x-3">
                <User className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Assigned To</p>
                  <p className="text-gray-900">{patient.assignedTo || 'Unassigned'}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Clock className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Assigned</p>
                  <p className="text-gray-900">{getTimeSinceAssignment(patient.assignedAt)}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Calendar className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Admission Date</p>
                  <p className="text-gray-900">
                    {patient.admission_date ? new Date(patient.admission_date).toLocaleDateString() : 'Not set'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Symptoms */}
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-3">Symptoms</h4>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-700">{patient.symptoms || 'No symptoms recorded'}</p>
            </div>
          </div>

          {/* Emergency Contact */}
          {patient.emergency_contact && (
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-3">Emergency Contact</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700">{patient.emergency_contact}</p>
              </div>
            </div>
          )}

          {/* Response Time */}
          {patient.estimatedResponseTime && (
            <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <Clock className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-blue-600 font-medium">Estimated Response Time</p>
                <p className="text-blue-800">{patient.estimatedResponseTime} minutes</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PatientDetailsModal;