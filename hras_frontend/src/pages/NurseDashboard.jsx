import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Activity, Clock, User, Plus, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import AddVitalsModal from '../components/nurse/AddVitalsModal';
import PatientDetailsModal from '../components/nurse/PatientDetailsModal';

const NurseDashboard = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showVitalsModal, setShowVitalsModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

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

  const handleAddVitals = (patient) => {
    setSelectedPatient(patient);
    setShowVitalsModal(true);
  };

  const handleViewDetails = (patient) => {
    setSelectedPatient(patient);
    setShowDetailsModal(true);
  };

  const handleVitalsAdded = () => {
    setShowVitalsModal(false);
    toast.success('Vitals recorded successfully');
    fetchAssignedPatients();
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

      {patients.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <Activity size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Patients Assigned</h3>
          <p className="text-gray-600">You don't have any patients assigned to you at the moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
              </div>

              {/* Priority Badge */}
              <div className="mb-4">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getPriorityColor(patient.priority)}`}>
                  {patient.priority} Priority
                </span>
              </div>

              {/* Patient Info */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <Clock size={16} className="mr-2" />
                  <span>Admitted: {new Date(patient.admission_date).toLocaleDateString()}</span>
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
              <div className="flex gap-2">
                <button
                  onClick={() => handleViewDetails(patient)}
                  className="flex-1 flex items-center justify-center px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                >
                  <Eye size={16} className="mr-1" />
                  Details
                </button>
                <button
                  onClick={() => handleAddVitals(patient)}
                  className="flex-1 flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  <Plus size={16} className="mr-1" />
                  Add Vitals
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {showVitalsModal && selectedPatient && (
        <AddVitalsModal
          patient={selectedPatient}
          onClose={() => setShowVitalsModal(false)}
          onSuccess={handleVitalsAdded}
        />
      )}

      {showDetailsModal && selectedPatient && (
        <PatientDetailsModal
          patient={selectedPatient}
          onClose={() => setShowDetailsModal(false)}
        />
      )}
    </div>
  );
};

export default NurseDashboard;
