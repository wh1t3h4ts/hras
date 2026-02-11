import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Building2, Save } from 'lucide-react';
import toast from 'react-hot-toast';

const HospitalEditModal = ({ isOpen, onClose, hospital, onUpdate }) => {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    beds: '',
    ots: '',
    specialties: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (hospital) {
      setFormData({
        name: hospital.name || '',
        address: hospital.address || '',
        beds: hospital.beds || '',
        ots: hospital.ots || '',
        specialties: hospital.specialties || ''
      });
    }
  }, [hospital]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!hospital?.id) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.patch(
        `http://localhost:8000/api/hospitals/${hospital.id}/`,
        {
          name: formData.name,
          address: formData.address,
          beds: parseInt(formData.beds) || 0,
          ots: parseInt(formData.ots) || 0,
          specialties: formData.specialties
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      toast.success('Hospital updated successfully!');
      onUpdate(response.data);
      onClose();
    } catch (error) {
      console.error('Error updating hospital:', error);
      toast.error('Failed to update hospital. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <Building2 className="h-6 w-6 text-blue-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">Edit Hospital</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Hospital Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Hospital Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter hospital name"
            />
          </div>

          {/* Address */}
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
              Address *
            </label>
            <textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              required
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter hospital address"
            />
          </div>

          {/* Beds */}
          <div>
            <label htmlFor="beds" className="block text-sm font-medium text-gray-700 mb-1">
              Total Beds *
            </label>
            <input
              type="number"
              id="beds"
              name="beds"
              value={formData.beds}
              onChange={handleInputChange}
              required
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter number of beds"
            />
          </div>

          {/* Operating Theaters */}
          <div>
            <label htmlFor="ots" className="block text-sm font-medium text-gray-700 mb-1">
              Operating Theaters *
            </label>
            <input
              type="number"
              id="ots"
              name="ots"
              value={formData.ots}
              onChange={handleInputChange}
              required
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter number of operating theaters"
            />
          </div>

          {/* Specialties */}
          <div>
            <label htmlFor="specialties" className="block text-sm font-medium text-gray-700 mb-1">
              Specialties
            </label>
            <textarea
              id="specialties"
              name="specialties"
              value={formData.specialties}
              onChange={handleInputChange}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter hospital specialties (e.g., Cardiology, Neurology, Emergency)"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HospitalEditModal;