import React, { useState } from 'react';
import axios from 'axios';
import { X, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

const AddPatientModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    telephone: '',
    emergency_contact: '',
    symptoms: '',
    severity: 'Low',
    admission_date: new Date().toISOString().split('T')[0]
  });
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const getAISuggestion = async () => {
    if (!formData.symptoms.trim()) {
      toast.error('Please enter symptoms first');
      return;
    }
    
    setLoadingAI(true);
    try {
      const response = await axios.post('http://localhost:8000/api/patients/ai-triage/', {
        symptoms: formData.symptoms
      });
      setAiSuggestion(response.data);
      toast.success('AI suggestion received!');
    } catch (error) {
      console.error('Error getting AI suggestion:', error);
      toast.error('AI suggestion unavailable');
    } finally {
      setLoadingAI(false);
    }
  };

  const applyAISuggestion = () => {
    if (aiSuggestion) {
      setFormData({ ...formData, severity: aiSuggestion.suggested_priority });
      toast.success('AI suggestion applied!');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:8000/api/patients/', {
        ...formData,
        priority: formData.severity,
        hospital: 1
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Patient registered successfully!');
      setFormData({
        name: '',
        telephone: '',
        emergency_contact: '',
        symptoms: '',
        severity: 'Low',
        admission_date: new Date().toISOString().split('T')[0]
      });
      setAiSuggestion(null);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error adding patient:', error);
      toast.error('Failed to register patient');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white border border-gray-200 rounded-xl max-w-2xl w-full max-h-[90vh] md:max-h-[90vh] h-full md:h-auto overflow-y-auto shadow-2xl">
        <div className="p-4 md:p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Register New Patient</h2>
            <button 
              onClick={onClose} 
              className="text-gray-600 hover:text-gray-900 transition-colors"
              aria-label="Close modal"
            >
              <X size={24} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name & Phone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Patient Name <span className="text-red-500">*</span>
                </label>
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  placeholder="John Doe"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  name="telephone"
                  value={formData.telephone}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  placeholder="0712345678"
                  required
                />
              </div>
            </div>

            {/* Emergency Contact */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Emergency Contact <span className="text-red-500">*</span>
              </label>
              <input
                name="emergency_contact"
                value={formData.emergency_contact}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                placeholder="0723456789"
                required
              />
            </div>

            {/* Symptoms */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Symptoms
              </label>
              <textarea
                name="symptoms"
                value={formData.symptoms}
                onChange={handleChange}
                rows="3"
                className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
                placeholder="Describe patient symptoms (e.g., chest pain, fever, headache)..."
              />
            </div>

            {/* AI Triage Button */}
            <button
              type="button"
              onClick={getAISuggestion}
              disabled={loadingAI || !formData.symptoms.trim()}
              className="w-full flex items-center justify-center px-4 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg shadow-purple-500/20"
            >
              {loadingAI ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
              ) : (
                <>
                  <Sparkles size={18} className="mr-2" />
                  Get AI Triage Suggestion
                </>
              )}
            </button>

            {/* AI Suggestion Display */}
            {aiSuggestion && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-purple-700 font-semibold mb-1">🤖 AI Analysis:</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{aiSuggestion.ai_explanation}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-purple-200">
                  <p className="text-sm text-purple-700">
                    Suggested Priority: <span className="font-bold">{aiSuggestion.suggested_priority}</span>
                  </p>
                  <button
                    type="button"
                    onClick={applyAISuggestion}
                    className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded-md transition-colors"
                  >
                    Apply Suggestion
                  </button>
                </div>
              </div>
            )}

            {/* Priority & Admission Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority Level <span className="text-red-500">*</span>
                </label>
                <select
                  name="severity"
                  value={formData.severity}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  required
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Admission Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="admission_date"
                  value={formData.admission_date}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  required
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20"
              >
                {submitting ? (
                  <span className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                    Registering...
                  </span>
                ) : (
                  'Register Patient'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddPatientModal;
