import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, User, Phone, Activity, Clock } from 'lucide-react';

const PatientDetailsModal = ({ patient, onClose }) => {
  const [observations, setObservations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchObservations();
  }, []);

  const fetchObservations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:8000/api/patients/${patient.id}/observations/`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setObservations(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching observations:', error);
      setLoading(false);
    }
  };

  const getPriorityColor = (priority) => {
    const colors = {
      Critical: 'bg-red-100 text-red-800',
      High: 'bg-orange-100 text-orange-800',
      Medium: 'bg-yellow-100 text-yellow-800',
      Low: 'bg-green-100 text-green-800'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
          <div className="flex items-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <User size={32} className="text-blue-600" />
            </div>
            <div className="ml-4">
              <h2 className="text-2xl font-bold text-gray-900">{patient.name}</h2>
              <p className="text-sm text-gray-600">Age: {patient.age} years</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Patient Info */}
        <div className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-xs font-medium text-gray-500 mb-1">Priority</p>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${getPriorityColor(patient.priority)}`}>
                {patient.priority}
              </span>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-xs font-medium text-gray-500 mb-1">Status</p>
              <p className="text-sm font-semibold text-gray-900">{patient.status || 'Active'}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-xs font-medium text-gray-500 mb-1">Admission Date</p>
              <p className="text-sm font-semibold text-gray-900">
                {new Date(patient.admission_date).toLocaleDateString()}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-xs font-medium text-gray-500 mb-1">Severity</p>
              <p className="text-sm font-semibold text-gray-900">{patient.severity || 'Unknown'}</p>
            </div>
          </div>

          {/* Contact Info */}
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
              <Phone size={20} className="mr-2 text-blue-600" />
              Contact Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-xs font-medium text-blue-700 mb-1">Telephone</p>
                <p className="text-sm font-semibold text-gray-900">{patient.telephone}</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-xs font-medium text-blue-700 mb-1">Emergency Contact</p>
                <p className="text-sm font-semibold text-gray-900">{patient.emergency_contact}</p>
              </div>
            </div>
          </div>

          {/* Symptoms */}
          {patient.symptoms && (
            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Symptoms</h3>
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <p className="text-sm text-gray-700">{patient.symptoms}</p>
              </div>
            </div>
          )}

          {/* Vitals History */}
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
              <Activity size={20} className="mr-2 text-blue-600" />
              Vitals History
            </h3>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : observations.length === 0 ? (
              <div className="bg-gray-50 p-8 rounded-lg text-center">
                <Activity size={32} className="mx-auto text-gray-400 mb-2" />
                <p className="text-gray-600">No vitals recorded yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {observations.map((obs) => (
                  <div key={obs.id} className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock size={16} className="mr-2" />
                        {new Date(obs.timestamp).toLocaleString()}
                      </div>
                      <span className="text-xs text-gray-500">by {obs.nurse_name}</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {obs.blood_pressure_systolic && obs.blood_pressure_diastolic && (
                        <div className="bg-red-50 p-2 rounded">
                          <p className="text-xs text-red-700 font-medium">Blood Pressure</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {obs.blood_pressure_systolic}/{obs.blood_pressure_diastolic} mmHg
                          </p>
                        </div>
                      )}
                      {obs.temperature && (
                        <div className="bg-orange-50 p-2 rounded">
                          <p className="text-xs text-orange-700 font-medium">Temperature</p>
                          <p className="text-sm font-semibold text-gray-900">{obs.temperature}°C</p>
                        </div>
                      )}
                      {obs.pulse && (
                        <div className="bg-pink-50 p-2 rounded">
                          <p className="text-xs text-pink-700 font-medium">Pulse</p>
                          <p className="text-sm font-semibold text-gray-900">{obs.pulse} bpm</p>
                        </div>
                      )}
                      {obs.respiratory_rate && (
                        <div className="bg-blue-50 p-2 rounded">
                          <p className="text-xs text-blue-700 font-medium">Respiratory Rate</p>
                          <p className="text-sm font-semibold text-gray-900">{obs.respiratory_rate} /min</p>
                        </div>
                      )}
                      {obs.oxygen_saturation && (
                        <div className="bg-green-50 p-2 rounded">
                          <p className="text-xs text-green-700 font-medium">SpO2</p>
                          <p className="text-sm font-semibold text-gray-900">{obs.oxygen_saturation}%</p>
                        </div>
                      )}
                    </div>
                    {obs.notes && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-xs font-medium text-gray-700 mb-1">Notes:</p>
                        <p className="text-sm text-gray-600">{obs.notes}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PatientDetailsModal;
