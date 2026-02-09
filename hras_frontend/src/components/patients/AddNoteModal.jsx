import React, { useState } from 'react';
import { X, FileText, Save } from 'lucide-react';
import toast from 'react-hot-toast';

const AddNoteModal = ({ isOpen, onClose, patient, onNoteAdded }) => {
  const [noteText, setNoteText] = useState('');
  const [noteType, setNoteType] = useState('general');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !patient) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!noteText.trim()) {
      toast.error('Please enter a note');
      return;
    }

    setIsSubmitting(true);

    try {
      // Make API call to save the note
      const response = await fetch('http://localhost:8000/api/notes/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          patient: patient.id,
          note_type: noteType,
          text: noteText.trim()
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save note');
      }

      const savedNote = await response.json();

      // Call the callback to notify parent component
      if (onNoteAdded) {
        onNoteAdded(patient.id, {
          ...savedNote,
          created_by_name: 'Current User', // This will come from the API response
          created_by_role: 'Doctor' // This will come from the API response
        });
      }

      toast.success('Note added successfully!');
      setNoteText('');
      setNoteType('general');
      onClose();
    } catch (error) {
      toast.error('Failed to add note');
      console.error('Error adding note:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const noteTypes = [
    { value: 'general', label: 'General Note', color: 'bg-gray-100 text-gray-800' },
    { value: 'medical', label: 'Medical Update', color: 'bg-blue-100 text-blue-800' },
    { value: 'treatment', label: 'Treatment Note', color: 'bg-green-100 text-green-800' },
    { value: 'lab', label: 'Lab Results', color: 'bg-purple-100 text-purple-800' },
    { value: 'discharge', label: 'Discharge Note', color: 'bg-orange-100 text-orange-800' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <FileText className="h-6 w-6 text-gray-400" />
            <h2 className="text-xl font-semibold text-gray-900">Add Note</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Patient Info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500 mb-1">Patient</h3>
            <p className="text-gray-900 font-medium">{patient.name}</p>
            <p className="text-gray-600 text-sm">ID: {patient.id}</p>
          </div>

          {/* Note Type */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Note Type
            </label>
            <select
              value={noteType}
              onChange={(e) => setNoteType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {noteTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Note Text */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Note Content
            </label>
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Enter your note here..."
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
              required
            />
            <p className="text-gray-500 text-xs mt-1">
              {noteText.length} characters
            </p>
          </div>

          {/* Footer */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !noteText.trim()}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Save Note</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddNoteModal;