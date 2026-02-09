import React from 'react';
import PriorityBadge from './PriorityBadge';
import { Clock } from 'lucide-react';

const PatientList = ({ patients, loading }) => {
  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Patients</h3>
      <div className="space-y-3">
        {patients.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No patients found</p>
        ) : (
          patients.map((patient) => (
            <div
              key={patient.id}
              className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-semibold text-gray-900">{patient.name}</h4>
                  <p className="text-sm text-gray-600">
                    {patient.assigned_doctor 
                      ? (typeof patient.assigned_doctor === 'object' 
                          ? patient.assigned_doctor.name 
                          : patient.assigned_doctor)
                      : 'Unassigned'
                    }
                  </p>
                </div>
                <PriorityBadge priority={patient.priority} />
              </div>
              <div className="flex items-center text-xs text-gray-500">
                <Clock size={14} className="mr-1" />
                Wait: {patient.wait_time || 0} min
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PatientList;
