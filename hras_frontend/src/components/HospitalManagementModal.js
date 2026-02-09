import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';

const HospitalManagementModal = () => {
  const [hospitals, setHospitals] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', address: '', beds: 0, ots: 0, specialties: '' });

  useEffect(() => {
    fetchHospitals();
    fetchDoctors();
  }, []);

  const fetchHospitals = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/hospitals/', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setHospitals(response.data);
    } catch (error) {
      console.error('Error fetching hospitals:', error);
    }
  };

  const fetchDoctors = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/users/?role=doctor', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setDoctors(response.data);
    } catch (error) {
      console.error('Error fetching doctors:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:8000/api/hospitals/', formData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      toast.success('Hospital added successfully!');
      fetchHospitals();
      setShowModal(false);
      setFormData({ name: '', address: '', beds: 0, ots: 0, specialties: '' });
    } catch (error) {
      console.error('Error adding hospital:', error);
      toast.error('Failed to add hospital');
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Hospital Management</h2>
        <button 
          onClick={() => setShowModal(true)} 
          className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm"
        >
          <Building2 size={18} className="mr-2" />
          Add Hospital
        </button>
      </div>

      {/* Hospitals List */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Hospitals</h3>
        {hospitals.length === 0 ? (
          <p className="text-gray-500">No hospitals found</p>
        ) : (
          <ul className="space-y-2">
            {hospitals.map(h => (
              <li key={h.id} className="p-3 bg-gray-50 rounded-lg text-gray-900 hover:bg-gray-100 transition-colors">
                {h.name}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Doctors List */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Doctors</h3>
        {doctors.length === 0 ? (
          <p className="text-gray-500">No doctors found</p>
        ) : (
          <ul className="space-y-2">
            {doctors.map(d => (
              <li key={d.id} className="p-3 bg-gray-50 rounded-lg text-gray-900 hover:bg-gray-100 transition-colors">
                {d.username}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-gray-200 rounded-xl max-w-lg w-full shadow-2xl">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Add New Hospital</h3>
                <button 
                  onClick={() => setShowModal(false)} 
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hospital Name <span className="text-red-500">*</span>
                  </label>
                  <input 
                    name="name" 
                    placeholder="Enter hospital name" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})} 
                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address <span className="text-red-500">*</span>
                  </label>
                  <input 
                    name="address" 
                    placeholder="Enter address" 
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})} 
                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Beds <span className="text-red-500">*</span>
                    </label>
                    <input 
                      name="beds" 
                      type="number" 
                      placeholder="0" 
                      value={formData.beds}
                      onChange={(e) => setFormData({...formData, beds: parseInt(e.target.value) || 0})} 
                      className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      OTs <span className="text-red-500">*</span>
                    </label>
                    <input 
                      name="ots" 
                      type="number" 
                      placeholder="0" 
                      value={formData.ots}
                      onChange={(e) => setFormData({...formData, ots: parseInt(e.target.value) || 0})} 
                      className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Specialties
                  </label>
                  <input 
                    name="specialties" 
                    placeholder="e.g., Cardiology, Neurology" 
                    value={formData.specialties}
                    onChange={(e) => setFormData({...formData, specialties: e.target.value})} 
                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button 
                    type="button"
                    onClick={() => setShowModal(false)} 
                    className="flex-1 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium shadow-lg shadow-blue-500/20"
                  >
                    Save Hospital
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HospitalManagementModal;