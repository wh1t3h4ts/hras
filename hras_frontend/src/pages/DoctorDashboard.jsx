import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Activity, Clock, User, FileText, TestTube, Pill, Edit } from 'lucide-react';
import toast from 'react-hot-toast';
import PriorityBadge from '../components/dashboard/PriorityBadge';
import DoctorDiagnosisModal from '../components/doctor/DoctorDiagnosisModal';
import DoctorTestOrderModal from '../components/doctor/DoctorTestOrderModal';
import DoctorPrescriptionModal from '../components/doctor/DoctorPrescriptionModal';

const DoctorDashboard = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDiagnosisModal, setShowDiagnosisModal] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);

  useEffect(() => {
    fetchAssignedPatients();
  }, []);

  const fetchAssignedPatients = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8000/api/patients/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPatients(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching patients:', error);
      toast.error('Failed to load assigned patients');
      setLoading(false);
    }
  };

  const getPriorityColor = (priority) => {
    const colors = {
      Critical: 'bg-red-100 text-red-800 border-red-300',
      High: 'bg-orange-100 text-orange-800 border-orange-300',
      Medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      Low: 'bg-green-100 text-green-800 border-green-300'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const calculateResponseTime = (admissionDate) => {
    const now = new Date();
    const admission = new Date(admissionDate);
    const diffMs = now - admission;
    const diffHours = Math.floor(diffMs / 3600000);
    
    if (diffHours < 24) return `${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d`;
  };

  const handleViewDetails = (patient) => {
    setSelectedPatient(patient);
    setShowDetailsModal(true);
  };

  const handleAddDiagnosis = (patient) => {
    setSelectedPatient(patient);
    setShowDiagnosisModal(true);
  };

  const handleOrderTests = (patient) => {
    setSelectedPatient(patient);
    setShowTestModal(true);
  };

  const handlePrescribe = (patient) => {
    setSelectedPatient(patient);
    setShowPrescriptionModal(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Patients</h1>
          <p className="text-gray-600 mt-1">Patients assigned to your care</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
          <p className="text-sm text-blue-600 font-medium">
            {patients.length} Patient{patients.length !== 1 ? 's' : ''} Assigned
          </p>
        </div>
      </div>

      {/* Patients List */}
      {patients.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <Activity size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Patients Assigned</h3>
          <p className="text-gray-600">You don't have any patients assigned to you at the moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {patients.map((patient) => (
            <div
              key={patient.id}
              className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Patient Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <User size={24} className="text-blue-600" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-semibold text-gray-900">{patient.name}</h3>
                    <p className="text-sm text-gray-500">Age: {patient.age}</p>
                  </div>
                </div>
                <PriorityBadge priority={patient.priority} />
              </div>

              {/* Patient Info */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <Clock size={16} className="mr-2" />
                  <span>Admitted: {new Date(patient.admission_date).toLocaleDateString()}</span>
                  <span className="ml-4 text-orange-600 font-medium">
                    Response time: {calculateResponseTime(patient.admission_date)}
                  </span>
                </div>
                {patient.status && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Activity size={16} className="mr-2" />
                    <span>Status: {patient.status}</span>
                  </div>
                )}
              </div>

              {/* Symptoms */}
              {patient.symptoms && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs font-medium text-gray-700 mb-1">Symptoms:</p>
                  <p className="text-sm text-gray-600">{patient.symptoms}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleViewDetails(patient)}
                  className="flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  <FileText size={16} className="mr-1" />
                  View Details
                </button>
                <button
                  onClick={() => handleAddDiagnosis(patient)}
                  className="flex items-center justify-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                >
                  <Edit size={16} className="mr-1" />
                  Add Diagnosis
                </button>
                <button
                  onClick={() => handleOrderTests(patient)}
                  className="flex items-center justify-center px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                >
                  <TestTube size={16} className="mr-1" />
                  Order Tests
                </button>
                <button
                  onClick={() => handlePrescribe(patient)}
                  className="flex items-center justify-center px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                >
                  <Pill size={16} className="mr-1" />
                  Prescribe
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {showDetailsModal && selectedPatient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Patient Details: {selectedPatient.name}</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-700">Age:</p>
                <p className="text-gray-900">{selectedPatient.age}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Symptoms:</p>
                <p className="text-gray-900">{selectedPatient.symptoms}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Priority:</p>
                <PriorityBadge priority={selectedPatient.priority} />
              </div>
              {selectedPatient.ai_suggestion && (
                <div>
                  <p className="text-sm font-medium text-gray-700">AI Suggestion:</p>
                  <p className="text-gray-900">{selectedPatient.ai_suggestion}</p>
                </div>
              )}
            </div>
            <button
              onClick={() => setShowDetailsModal(false)}
              className="mt-6 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {showDiagnosisModal && selectedPatient && (
        <DoctorDiagnosisModal
          patient={selectedPatient}
          onClose={() => setShowDiagnosisModal(false)}
          onSuccess={fetchAssignedPatients}
        />
      )}

      {showTestModal && selectedPatient && (
        <DoctorTestOrderModal
          patient={selectedPatient}
          onClose={() => setShowTestModal(false)}
          onSuccess={fetchAssignedPatients}
        />
      )}

      {showPrescriptionModal && selectedPatient && (
        <DoctorPrescriptionModal
          patient={selectedPatient}
          onClose={() => setShowPrescriptionModal(false)}
          onSuccess={fetchAssignedPatients}
        />
      )}
    </div>
  );
};

export default DoctorDashboard;
