import React, { useState } from 'react';
import axios from 'axios';
import LoadingSpinner from './LoadingSpinner';

const PatientForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    admission_date: '',
    severity: '',
    priority: 'Low',
    telephone: '',
    emergency_contact: '',
    symptoms: '',
  });
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAiTriage = async () => {
    if (!formData.symptoms) return;
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:8000/api/patients/ai-triage/', {
        symptoms: formData.symptoms
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setAiSuggestion(response.data);
    } catch (error) {
      alert('Error getting AI suggestion');
    } finally {
      setLoading(false);
    }
  };

  const applyAiPriority = () => {
    if (aiSuggestion) {
      setFormData({ ...formData, priority: aiSuggestion.suggested_priority });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:8000/api/patients/', formData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      alert('Patient added and assigned');
    } catch (error) {
      alert('Error adding patient');
    }
  };

  return (
    <div className="p-6 bg-gray-900 text-white min-h-screen">
      <h2 className="text-2xl mb-4">Add Patient</h2>
      <form onSubmit={handleSubmit} className="bg-gray-800 p-6 rounded shadow-md">
        <input name="name" placeholder="Name" onChange={handleChange} className="w-full p-2 mb-4 border bg-gray-700 text-white" required />
        <input name="admission_date" type="date" onChange={handleChange} className="w-full p-2 mb-4 border bg-gray-700 text-white" required />
        <input name="severity" placeholder="Severity" onChange={handleChange} className="w-full p-2 mb-4 border bg-gray-700 text-white" required />
        <select name="priority" value={formData.priority} onChange={handleChange} className="w-full p-2 mb-4 border bg-gray-700 text-white">
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
          <option value="Critical">Critical</option>
        </select>
        <input name="telephone" placeholder="Telephone" onChange={handleChange} className="w-full p-2 mb-4 border bg-gray-700 text-white" required />
        <input name="emergency_contact" placeholder="Emergency Contact" onChange={handleChange} className="w-full p-2 mb-4 border bg-gray-700 text-white" required />
        <textarea
          name="symptoms"
          placeholder="Symptoms / Chief Complaint"
          value={formData.symptoms}
          onChange={handleChange}
          className="w-full p-2 mb-4 border bg-gray-700 text-white"
          rows="4"
        />
        <p className="text-sm text-yellow-400 mb-4">⚠️ AI Triage Feature: This is an experimental demo tool. AI suggestions are NOT medical advice and should NEVER replace professional medical judgment. Consult qualified healthcare providers for all patient care decisions. This feature is for educational purposes only.</p>
        <button
          type="button"
          onClick={handleAiTriage}
          disabled={!formData.symptoms || loading}
          className="bg-blue-500 text-white p-2 mr-2 disabled:opacity-50"
        >
          {loading ? 'Getting Suggestion...' : 'Get AI Triage Suggestion'}
        </button>
        {aiSuggestion && (
          <div className="mt-4 p-4 bg-gray-700 rounded">
            <h3 className="text-lg">AI Suggestion (Demo Only)</h3>
            <p><strong>Priority:</strong> {aiSuggestion.suggested_priority}</p>
            <p><strong>Explanation:</strong> {aiSuggestion.ai_explanation}</p>
            <p className="text-xs text-red-400">⚠️ This is NOT real medical advice. Use professional judgment only.</p>
            <button onClick={applyAiPriority} className="bg-green-500 text-white p-2 mt-2">Apply to Priority (Demo)</button>
          </div>
        )}
        <p className="text-xs text-red-400 mt-4">⚠️ IMPORTANT: AI features are for demonstration in educational settings. Do not use in real healthcare scenarios without proper validation and oversight.</p>
        <button type="submit" className="w-full bg-blue-500 text-white p-2 mt-4">Add Patient</button>
      </form>
      {loading && <LoadingSpinner />}
    </div>
  );
};

export default PatientForm;