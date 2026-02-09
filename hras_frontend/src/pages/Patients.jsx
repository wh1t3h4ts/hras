import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Plus, Edit, UserCheck, Save, X } from 'lucide-react';
import PriorityBadge from '../components/dashboard/PriorityBadge';
import AddPatientModal from '../components/patients/AddPatientModal';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

const Patients = () => {
  const { user } = useAuth();
  const isNurse = user?.role === 'nurse';
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [editingPatient, setEditingPatient] = useState(null);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    filterPatients();
  }, [searchTerm, filterPriority, filterStatus, patients]);

  // FAB setup effect
  useEffect(() => {
    if (isNurse) return; // Nurses cannot add patients
    
    const fabContainer = document.getElementById('fab-container');
    if (fabContainer) {
      fabContainer.innerHTML = `
        <button
          onclick="window.dispatchEvent(new CustomEvent('fab-add-patient'))"
          class="flex items-center justify-center w-14 h-14 bg-green-600 hover:bg-green-700 text-white rounded-full shadow-lg transition-all hover:shadow-xl hover:scale-105 touch-manipulation"
          style="background: linear-gradient(135deg, #10b981 0%, #059669 100%);"
          title="Add New Patient"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
          </svg>
        </button>
      `;

      const handleFabClick = () => {
        setShowModal(true);
      };

      const listener = () => handleFabClick();
      window.addEventListener('fab-add-patient', listener);

      return () => {
        window.removeEventListener('fab-add-patient', listener);
        if (fabContainer) fabContainer.innerHTML = '';
      };
    }
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
      setFilteredPatients(response.data);
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

  const filterPatients = () => {
    let filtered = patients;
    
    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.telephone.includes(searchTerm)
      );
    }
    
    if (filterPriority !== 'All') {
      filtered = filtered.filter(p => p.priority === filterPriority);
    }
    
    if (filterStatus !== 'All') {
      filtered = filtered.filter(p => p.status === filterStatus);
    }
    
    setFilteredPatients(filtered);
  };

  const startEditing = (patient) => {
    setEditingPatient(patient.id);
    setEditForm({
      name: patient.name,
      telephone: patient.telephone,
      emergency_contact: patient.emergency_contact,
      symptoms: patient.symptoms,
      priority: patient.priority,
      status: patient.status
    });
  };

  const cancelEditing = () => {
    setEditingPatient(null);
    setEditForm({});
  };

  const savePatient = async (patientId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`http://localhost:8000/api/patients/${patientId}/`, 
        editForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update local state
      setPatients(prev => prev.map(p => 
        p.id === patientId ? { ...p, ...editForm } : p
      ));
      
      setEditingPatient(null);
      setEditForm({});
      toast.success('Patient information updated');
    } catch (error) {
      console.error('Error updating patient:', error);
      toast.error('Failed to update patient');
    }
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
          <h1 className="text-3xl font-bold text-gray-900">Patients</h1>
          <p className="text-gray-600 mt-1">
            {isNurse ? 'View your assigned patients' : 'Manage patient records and admissions'}
          </p>
        </div>
        {!isNurse && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center px-4 py-3 min-h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors touch-manipulation"
          >
            <Plus size={18} className="mr-2" />
            <span className="hidden sm:inline">Add Patient</span>
            <span className="sm:hidden">Add</span>
          </button>
        )}
      </div>

      {/* Search and Filter */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by name or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="All">All Priorities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="All">All Status</option>
            <option value="Waiting">Waiting</option>
            <option value="In Treatment">In Treatment</option>
            <option value="Discharged">Discharged</option>
          </select>
        </div>
      </div>

      {/* Patients List - Table on desktop, Cards on mobile */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Patient</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Priority</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Assigned To</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Admission</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                    No patients found
                  </td>
                </tr>
              ) : (
                filteredPatients.map((patient) => (
                  <tr key={patient.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">
                          {editingPatient === patient.id ? (
                            <input
                              type="text"
                              value={editForm.name}
                              onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                          ) : (
                            patient.name
                          )}
                        </div>
                        <div className="text-sm text-gray-600 truncate max-w-xs">
                          {editingPatient === patient.id ? (
                            <input
                              type="text"
                              value={editForm.symptoms}
                              onChange={(e) => setEditForm({...editForm, symptoms: e.target.value})}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              placeholder="Symptoms"
                            />
                          ) : (
                            patient.symptoms || 'No symptoms recorded'
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {editingPatient === patient.id ? (
                        <select
                          value={editForm.priority}
                          onChange={(e) => setEditForm({...editForm, priority: e.target.value})}
                          className="px-2 py-1 border border-gray-300 rounded text-sm"
                        >
                          <option value="Low">Low</option>
                          <option value="Medium">Medium</option>
                          <option value="High">High</option>
                          <option value="Critical">Critical</option>
                        </select>
                      ) : (
                        <PriorityBadge priority={patient.priority} />
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-gray-900">
                          {editingPatient === patient.id ? (
                            <input
                              type="text"
                              value={editForm.telephone}
                              onChange={(e) => setEditForm({...editForm, telephone: e.target.value})}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                          ) : (
                            patient.telephone
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          Emergency: {editingPatient === patient.id ? (
                            <input
                              type="text"
                              value={editForm.emergency_contact}
                              onChange={(e) => setEditForm({...editForm, emergency_contact: e.target.value})}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm mt-1"
                            />
                          ) : (
                            patient.emergency_contact
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {patient.assigned_staff ? (
                        <div className="flex items-center space-x-2">
                          <UserCheck size={16} className="text-green-600" />
                          <span className="text-sm text-gray-900">
                            {patient.assigned_staff.role === 'doctor' ? 'Dr.' : 'Nurse'} {patient.assigned_staff.name}
                          </span>
                        </div>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                          ⏳ Waiting
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-900">
                      {new Date(patient.admission_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      {editingPatient === patient.id ? (
                        <select
                          value={editForm.status}
                          onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                          className="px-2 py-1 border border-gray-300 rounded text-sm"
                        >
                          <option value="Waiting">Waiting</option>
                          <option value="In Treatment">In Treatment</option>
                          <option value="Discharged">Discharged</option>
                        </select>
                      ) : (
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          patient.status === 'Discharged' ? 'bg-green-100 text-green-700' :
                          patient.status === 'In Treatment' ? 'bg-blue-100 text-blue-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {patient.status || 'Waiting'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        {!isNurse && (
                          editingPatient === patient.id ? (
                            <>
                              <button
                                onClick={() => savePatient(patient.id)}
                                className="text-green-600 hover:text-green-800 p-1"
                                title="Save changes"
                              >
                                <Save size={16} />
                              </button>
                              <button
                                onClick={cancelEditing}
                                className="text-red-600 hover:text-red-800 p-1"
                                title="Cancel editing"
                              >
                                <X size={16} />
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => startEditing(patient)}
                              className="text-blue-600 hover:text-blue-800 p-1"
                              title="Edit patient"
                            >
                              <Edit size={16} />
                            </button>
                          )
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-4 p-4">
          {filteredPatients.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No patients found
            </div>
          ) : (
            filteredPatients.map((patient) => (
              <div key={patient.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-semibold text-gray-900">
                        {editingPatient === patient.id ? (
                          <input
                            type="text"
                            value={editForm.name}
                            onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm font-semibold"
                          />
                        ) : (
                          patient.name
                        )}
                      </h3>
                      {editingPatient === patient.id ? (
                        <select
                          value={editForm.priority}
                          onChange={(e) => setEditForm({...editForm, priority: e.target.value})}
                          className="px-2 py-1 border border-gray-300 rounded text-sm"
                        >
                          <option value="Low">Low</option>
                          <option value="Medium">Medium</option>
                          <option value="High">High</option>
                          <option value="Critical">Critical</option>
                        </select>
                      ) : (
                        <PriorityBadge priority={patient.priority} />
                      )}
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {editingPatient === patient.id ? (
                        <input
                          type="text"
                          value={editForm.symptoms}
                          onChange={(e) => setEditForm({...editForm, symptoms: e.target.value})}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          placeholder="Symptoms"
                        />
                      ) : (
                        patient.symptoms || 'No symptoms recorded'
                      )}
                    </p>
                  </div>
                  <div className="flex space-x-2 ml-2">
                    {editingPatient === patient.id ? (
                      <>
                        <button
                          onClick={() => savePatient(patient.id)}
                          className="text-green-600 hover:text-green-800 p-1"
                          title="Save changes"
                        >
                          <Save size={16} />
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="text-red-600 hover:text-red-800 p-1"
                          title="Cancel editing"
                        >
                          <X size={16} />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => startEditing(patient)}
                        className="text-blue-600 hover:text-blue-800 p-1"
                        title="Edit patient"
                      >
                        <Edit size={16} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Phone:</span>
                    <span className="text-gray-900">
                      {editingPatient === patient.id ? (
                        <input
                          type="text"
                          value={editForm.telephone}
                          onChange={(e) => setEditForm({...editForm, telephone: e.target.value})}
                          className="w-32 px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      ) : (
                        patient.telephone
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Assigned:</span>
                    {patient.assigned_staff ? (
                      <div className="flex items-center space-x-1">
                        <UserCheck size={14} className="text-green-600" />
                        <span className="text-xs text-gray-900">
                          {patient.assigned_staff.role === 'doctor' ? 'Dr.' : 'Nurse'} {patient.assigned_staff.name}
                        </span>
                      </div>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                        ⏳ Waiting
                      </span>
                    )}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Emergency:</span>
                    <span className="text-gray-900 text-xs">
                      {editingPatient === patient.id ? (
                        <input
                          type="text"
                          value={editForm.emergency_contact}
                          onChange={(e) => setEditForm({...editForm, emergency_contact: e.target.value})}
                          className="w-32 px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      ) : (
                        patient.emergency_contact
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Admission:</span>
                    <span className="text-gray-900 text-xs">
                      {new Date(patient.admission_date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Status:</span>
                    {editingPatient === patient.id ? (
                      <select
                        value={editForm.status}
                        onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                        className="px-2 py-1 border border-gray-300 rounded text-sm"
                      >
                        <option value="Waiting">Waiting</option>
                        <option value="In Treatment">In Treatment</option>
                        <option value="Discharged">Discharged</option>
                      </select>
                    ) : (
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        patient.status === 'Discharged' ? 'bg-green-100 text-green-700' :
                        patient.status === 'In Treatment' ? 'bg-blue-100 text-blue-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {patient.status || 'Waiting'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Patient Modal */}
      <AddPatientModal 
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={fetchPatients}
      />
    </div>
  );
};

export default Patients;
