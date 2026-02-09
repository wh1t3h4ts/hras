import React, { useState } from 'react';
import axios from 'axios';
import { X, TestTube } from 'lucide-react';
import toast from 'react-hot-toast';

const DoctorTestOrderModal = ({ patient, onClose, onSuccess }) => {
  const [testType, setTestType] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const commonTests = [
    'Complete Blood Count (CBC)',
    'Blood Glucose',
    'Lipid Panel',
    'Liver Function Test',
    'Kidney Function Test',
    'Chest X-Ray',
    'ECG',
    'Ultrasound',
    'CT Scan',
    'MRI',
    'Urinalysis',
    'COVID-19 Test'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!testType.trim()) {
      toast.error('Please select or enter a test type');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:8000/api/patients/${patient.id}/tests/`,
        { test_type: testType, notes },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('Test ordered successfully');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error ordering test:', error);
      toast.error(error.response?.data?.error || 'Failed to order test');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
              <TestTube size={20} className="text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Order Test</h2>
              <p className="text-sm text-gray-600">{patient.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Test Type *
              </label>
              <select
                value={testType}
                onChange={(e) => setTestType(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              >
                <option value="">Select a test...</option>
                {commonTests.map((test) => (
                  <option key={test} value={test}>{test}</option>
                ))}
                <option value="other">Other (specify in notes)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Notes / Instructions
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                placeholder="Enter any special instructions or urgency notes..."
              />
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
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Ordering...' : 'Order Test'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DoctorTestOrderModal;
