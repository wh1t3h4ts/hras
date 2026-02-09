import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Users,
  Clock,
  CheckCircle,
  AlertTriangle,
  Search,
  RefreshCw,
  Eye,
  Play,
  FileText,
  XCircle,
  Filter,
  UserCheck,
  Timer,
  UserPlus
} from 'lucide-react';
import toast from 'react-hot-toast';
import StatCard from '../components/dashboard/StatCard';
import PatientDetailsModal from '../components/patients/PatientDetailsModal';
import AddNoteModal from '../components/patients/AddNoteModal';
import PriorityBadge from '../components/dashboard/PriorityBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import PatientAssignmentCard from '../components/patients/PatientAssignmentCard';

const MyWorkspace = () => {
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [stats, setStats] = useState({
    pending: 0,
    inProgress: 0,
    completed: 0,
    avgResponseTime: 0
  });
  const [isPatientDetailsModalOpen, setIsPatientDetailsModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isAddNoteModalOpen, setIsAddNoteModalOpen] = useState(false);
  const [notePatient, setNotePatient] = useState(null);

  // Fetch assigned patients
  const fetchPatients = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/patients/', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      // For demo purposes, simulate assigned patients
      // In a real app, this would be filtered by the logged-in user's assignments
      const assignedPatients = response.data.slice(0, 5).map((patient, index) => ({
        ...patient,
        status: index < 2 ? 'pending' : index < 4 ? 'in_progress' : 'completed',
        assignedAt: new Date(Date.now() - Math.random() * 3600000), // Random time within last hour
        assignedTo: 'Dr. Smith',
        estimatedResponseTime: 30 // minutes
      }));

      setPatients(assignedPatients);
      calculateStats(assignedPatients);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching patients:', error);
      toast.error('Failed to load assigned patients');
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const calculateStats = (patientList) => {
    const pending = patientList.filter(p => p.status === 'pending').length;
    const inProgress = patientList.filter(p => p.status === 'in_progress').length;
    const completed = patientList.filter(p => p.status === 'completed').length;
    const avgResponseTime = patientList.length > 0
      ? Math.round(patientList.reduce((acc, p) => acc + (p.estimatedResponseTime || 30), 0) / patientList.length)
      : 0;

    setStats({ pending, inProgress, completed, avgResponseTime });
  };

  // Filter patients based on search and status
  useEffect(() => {
    let filtered = patients;

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => p.status === statusFilter);
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.symptoms && p.symptoms.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredPatients(filtered);
  }, [patients, searchTerm, statusFilter]);

  // Initial load and polling
  useEffect(() => {
    fetchPatients();

    // Check for demo mode (faster polling)
    const urlParams = new URLSearchParams(window.location.search);
    const isDemo = urlParams.get('demo') === 'fast';
    const pollInterval = isDemo ? 5000 : 30000; // 5 seconds for demo, 30 seconds normal

    // Poll for updates
    const interval = setInterval(fetchPatients, pollInterval);
    return () => clearInterval(interval);
  }, []);

  // FAB setup effect
  useEffect(() => {
    const fabContainer = document.getElementById('fab-container');
    if (fabContainer) {
      fabContainer.innerHTML = `
        <button
          onclick="window.dispatchEvent(new CustomEvent('fab-add-patient'))"
          class="flex items-center justify-center w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-all hover:shadow-xl hover:scale-105 touch-manipulation"
          style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);"
          title="Add New Patient"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
          </svg>
        </button>
      `;

      const handleFabClick = () => {
        toast.success('Add Patient modal coming soon!');
      };

      const listener = () => handleFabClick();
      window.addEventListener('fab-add-patient', listener);

      return () => {
        window.removeEventListener('fab-add-patient', listener);
        if (fabContainer) fabContainer.innerHTML = '';
      };
    }
  }, []);

  // Calculate time since assignment
  const getTimeSinceAssignment = (assignedAt) => {
    const now = new Date();
    const diffMs = now - assignedAt;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just assigned';
    if (diffMins < 60) return `${diffMins} min ago`;
    const diffHours = Math.floor(diffMins / 60);
    return `${diffHours} hr ago`;
  };

  // Get time color based on urgency
  const getTimeColor = (assignedAt, estimatedResponseTime = 30) => {
    const now = new Date();
    const diffMins = (now - assignedAt) / 60000;

    if (diffMins > estimatedResponseTime) return 'text-red-400';
    if (diffMins > estimatedResponseTime * 0.7) return 'text-yellow-400';
    return 'text-green-400';
  };

  // Handle patient actions
  const handleStatusChange = async (patientId, newStatus) => {
    try {
      // In a real app, this would update the backend
      setPatients(prev => prev.map(p =>
        p.id === patientId ? { ...p, status: newStatus } : p
      ));
      toast.success(`Patient status updated to ${newStatus.replace('_', ' ')}`);
    } catch (error) {
      toast.error('Failed to update patient status');
    }
  };

  const handleAddNote = (patientId) => {
    const patient = patients.find(p => p.id === patientId);
    setNotePatient(patient);
    setIsAddNoteModalOpen(true);
  };

  const handleNoteAdded = (patientId, note) => {
    // Here you could update the patient with the new note
    // For now, we'll just show a success message
    console.log('Note added for patient', patientId, note);
  };

  const handleViewDetails = (patientId) => {
    const patient = patients.find(p => p.id === patientId);
    setSelectedPatient(patient);
    setIsPatientDetailsModalOpen(true);
  };

  const statusOptions = [
    { value: 'all', label: 'All Patients', count: patients.length },
    { value: 'pending', label: 'Pending', count: stats.pending },
    { value: 'in_progress', label: 'In Progress', count: stats.inProgress },
    { value: 'completed', label: 'Completed', count: stats.completed }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Assigned Patients</h1>
          <p className="text-gray-700 text-sm">
            Manage your patient assignments and track response times
          </p>
        </div>
        <div className="flex items-center space-x-2 text-xs text-gray-500">
          <RefreshCw className="h-3 w-3" />
          <span>Last updated: {getTimeSinceAssignment(lastUpdated)}</span>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search patients by name or symptoms..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        <div className="flex space-x-2">
          {statusOptions.map(option => (
            <button
              key={option.value}
              onClick={() => setStatusFilter(option.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === option.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {option.label} ({option.count})
            </button>
          ))}
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Pending Cases"
          value={stats.pending}
          icon={<AlertTriangle className="h-6 w-6" />}
          color={stats.pending > 3 ? 'red' : stats.pending > 1 ? 'orange' : 'blue'}
          subtitle="Require immediate attention"
        />
        <StatCard
          title="In Progress"
          value={stats.inProgress}
          icon={<Play className="h-6 w-6" />}
          color="yellow"
          subtitle="Currently being handled"
        />
        <StatCard
          title="Completed Today"
          value={stats.completed}
          icon={<CheckCircle className="h-6 w-6" />}
          color="green"
          subtitle="Successfully resolved"
        />
        <StatCard
          title="Avg Response Time"
          value={`${stats.avgResponseTime}m`}
          icon={<Timer className="h-6 w-6" />}
          color="blue"
          subtitle="Target: < 30 minutes"
        />
      </div>

      {/* Patient Cards */}
      {filteredPatients.length === 0 ? (
        <div className="text-center py-12">
          <UserCheck className="h-16 w-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-300 mb-2">No patients found</h3>
          <p className="text-slate-500">
            {searchTerm || statusFilter !== 'all'
              ? 'Try adjusting your search or filter criteria.'
              : 'No patients assigned at the moment. New cases will appear here automatically.'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredPatients.map((patient) => (
            <PatientAssignmentCard
              key={patient.id}
              patient={patient}
              onStatusChange={handleStatusChange}
              onAddNote={handleAddNote}
              onViewDetails={handleViewDetails}
            />
          ))}
        </div>
      )}

      {/* FAB - Add Patient */}
      <button
        onClick={() => toast.success('Add Patient modal coming soon!')}
        className="fixed bottom-6 right-6 flex items-center justify-center w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-all hover:shadow-xl hover:scale-105 touch-manipulation z-50"
        style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' }}
        title="Add New Patient"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
        </svg>
      </button>

      {/* Patient Details Modal */}
      <PatientDetailsModal
        isOpen={isPatientDetailsModalOpen}
        onClose={() => setIsPatientDetailsModalOpen(false)}
        patient={selectedPatient}
      />

      {/* Add Note Modal */}
      <AddNoteModal
        isOpen={isAddNoteModalOpen}
        onClose={() => setIsAddNoteModalOpen(false)}
        patient={notePatient}
        onNoteAdded={handleNoteAdded}
      />
    </div>
  );
};

export default MyWorkspace;