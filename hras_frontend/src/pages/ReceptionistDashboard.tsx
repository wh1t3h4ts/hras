import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus } from 'lucide-react';
import PriorityBadge from '../components/dashboard/PriorityBadge';
import ReceptionistAddPatientModal from '../components/patients/ReceptionistAddPatientModal';
import toast from 'react-hot-toast';

const ReceptionistDashboard = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await axios.get('http://localhost:8000/api/patients/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPatients(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching patients:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      } else {
        toast.error('Failed to load patients');
      }
      setLoading(false);
    }
  };

  const calculateWaitTime = (admissionDate) => {
    const now = new Date();
    const admission = new Date(admissionDate);
    const diffMs = now - admission;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m`;
    } else {
      return `${diffMinutes}m`;
    }
  };

  const handlePatientAdded = () => {
    fetchPatients();
    setShowModal(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Patient Queue</h1>
          <p className="text-gray-600 mt-1">Manage patient admissions and queue</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
        >
          <Plus size={20} className="mr-2" />
          Register New Patient
        </button>
      </div>

      {/* Patients Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Priority</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Assigned To</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Wait Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {patients.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                    No patients in queue
                  </td>
                </tr>
              ) : (
                patients.map((patient) => (
                  <tr key={patient.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">
                        {patient.name}
                      </div>
                      <div className="text-sm text-gray-600">
                        Age: {patient.age}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <PriorityBadge priority={patient.priority} />
                    </td>
                    <td className="px-6 py-4 text-gray-900">
                      {patient.assigned_doctor ? patient.assigned_doctor.name : 'Unassigned'}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {calculateWaitTime(patient.admission_date)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        patient.status === 'High' ? 'bg-red-100 text-red-700' :
                        patient.status === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                        patient.status === 'Low' ? 'bg-green-100 text-green-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {patient.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Patient Modal */}
      <ReceptionistAddPatientModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={handlePatientAdded}
      />
    </div>
  );
};

export default ReceptionistDashboard;