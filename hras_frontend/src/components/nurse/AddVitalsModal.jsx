import React, { useState } from 'react';
import axios from 'axios';
import { X, Activity } from 'lucide-react';
import toast from 'react-hot-toast';

const AddVitalsModal = ({ patient, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    blood_pressure_systolic: '',
    blood_pressure_diastolic: '',
    temperature: '',
    pulse: '',
    respiratory_rate: '',
    oxygen_saturation: '',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      
      // Filter out empty values
      const dataToSubmit = Object.entries(formData).reduce((acc, [key, value]) => {
        if (value !== '') {
          acc[key] = value;
        }
        return acc;
      }, {});

      await axios.post(
        `http://localhost:8000/api/patients/${patient.id}/observations/`,
        dataToSubmit,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      onSuccess();
    } catch (error) {
      console.error('Error recording vitals:', error);
      toast.error(error.response?.data?.error || 'Failed to record vitals');
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <Activity className="text-blue-600 mr-3" size={24} />
            <div>
              <h2 className="text-xl font-bold text-gray-900">Record Vitals</h2>
              <p className="text-sm text-gray-600">{patient.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Blood Pressure */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Blood Pressure (mmHg)
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <input
                  type="number"
                  name="blood_pressure_systolic"
                  value={formData.blood_pressure_systolic}
                  onChange={handleChange}
                  placeholder="Systolic"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Systolic (top number)</p>
              </div>
              <div>
                <input
                  type="number"
                  name="blood_pressure_diastolic"
                  value={formData.blood_pressure_diastolic}
                  onChange={handleChange}
                  placeholder="Diastolic"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Diastolic (bottom number)</p>
              </div>
            </div>
          </div>

          {/* Temperature */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Temperature (°C)
            </label>
            <input
              type="number"
              step="0.1"
              name="temperature"
              value={formData.temperature}
              onChange={handleChange}
              placeholder="37.0"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Pulse */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pulse (bpm)
            </label>
            <input
              type="number"
              name="pulse"
              value={formData.pulse}
              onChange={handleChange}
              placeholder="72"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Respiratory Rate */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Respiratory Rate (breaths/min)
            </label>
            <input
              type="number"
              name="respiratory_rate"
              value={formData.respiratory_rate}
              onChange={handleChange}
              placeholder="16"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Oxygen Saturation */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Oxygen Saturation (SpO2 %)
            </label>
            <input
              type="number"
              name="oxygen_saturation"
              value={formData.oxygen_saturation}
              onChange={handleChange}
              placeholder="98"
              min="0"
              max="100"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observations / Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="4"
              placeholder="Patient observations, behavior, concerns..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Recording...' : 'Record Vitals'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddVitalsModal;
