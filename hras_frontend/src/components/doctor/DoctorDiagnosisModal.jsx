import React, { useState } from 'react';
import axios from 'axios';
import { X, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

const DoctorDiagnosisModal = ({ patient, onClose, onSuccess }) => {
  const [diagnosisText, setDiagnosisText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!diagnosisText.trim()) {
      toast.error('Please enter a diagnosis');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:8000/api/patients/${patient.id}/diagnosis/`,
        { diagnosis_text: diagnosisText },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('Diagnosis added successfully');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error adding diagnosis:', error);
      toast.error(error.response?.data?.error || 'Failed to add diagnosis');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
              <FileText size={20} className="text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Add Diagnosis</h2>
              <p className="text-sm text-gray-600">{patient.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Age:</p>
                  <p className="font-medium text-gray-900">{patient.age}</p>
                </div>
                <div>
                  <p className="text-gray-600">Priority:</p>
                  <p className="font-medium text-gray-900">{patient.priority}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-gray-600">Symptoms:</p>
                  <p className="font-medium text-gray-900">{patient.symptoms || 'None recorded'}</p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Diagnosis & Clinical Findings *
              </label>
              <textarea
                value={diagnosisText}
                onChange={(e) => setDiagnosisText(e.target.value)}
                rows={8}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                placeholder="Enter detailed diagnosis, clinical findings, and assessment..."
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Include primary diagnosis, differential diagnoses, and clinical assessment
              </p>
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Adding...' : 'Add Diagnosis'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DoctorDiagnosisModal;
