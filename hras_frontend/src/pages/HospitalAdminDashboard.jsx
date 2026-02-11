import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Building2,
  Users,
  UserCheck,
  Activity,
  Bed,
  Stethoscope,
  Edit,
  Settings,
  BarChart3
} from 'lucide-react';
import toast from 'react-hot-toast';

const HospitalAdminDashboard = () => {
  const navigate = useNavigate();
  const [hospital, setHospital] = useState(null);
  const [stats, setStats] = useState({
    staffCount: 0,
    totalPatients: 0,
    todayPatients: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch hospital details (scoped to user's hospital)
      const hospitalRes = await axios.get('http://localhost:8000/api/hospitals/', { headers });
      const hospitalData = hospitalRes.data[0] || null;
      setHospital(hospitalData);

      // Fetch staff count
      const staffRes = await axios.get('http://localhost:8000/api/accounts/staff/', { headers });
      const staffCount = staffRes.data.length;

      // Fetch patient count (scoped to hospital)
      const patientsRes = await axios.get('http://localhost:8000/api/patients/', { headers });
      const totalPatients = patientsRes.data.length;

      // Calculate today's patients (patients admitted today)
      const today = new Date().toISOString().split('T')[0];
      const todayPatients = patientsRes.data.filter(patient =>
        patient.admission_date && patient.admission_date.startsWith(today)
      ).length;

      setStats({
        staffCount,
        totalPatients,
        todayPatients
      });

      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
      setLoading(false);
    }
  };

  const quickLinks = [
    {
      title: 'Manage Staff',
      description: 'View and manage doctors and nurses',
      icon: UserCheck,
      path: '/staff',
      color: 'bg-blue-500'
    },
    {
      title: 'Edit Hospital Details',
      description: 'Update hospital information',
      icon: Edit,
      path: '/hospital-management',
      color: 'bg-green-500'
    },
    {
      title: 'View Hospital Patients',
      description: 'See all patients in your hospital',
      icon: Users,
      path: '/patients',
      color: 'bg-purple-500'
    },
    {
      title: 'Analytics',
      description: 'View hospital performance metrics',
      icon: BarChart3,
      path: '/analytics',
      color: 'bg-orange-500'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900">Hospital Admin Dashboard</h1>
        <p className="text-gray-600 mt-1">Manage your hospital operations and staff</p>
      </div>

      {/* Hospital Overview Card */}
      {hospital && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <Building2 className="h-6 w-6 mr-2 text-blue-600" />
              {hospital.name}
            </h2>
            <button
              onClick={() => navigate('/hospital-management')}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Edit Details
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center p-4 bg-blue-50 rounded-lg">
              <Bed className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Total Beds</p>
                <p className="text-2xl font-bold text-gray-900">{hospital.beds}</p>
              </div>
            </div>

            <div className="flex items-center p-4 bg-green-50 rounded-lg">
              <Activity className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Operating Theaters</p>
                <p className="text-2xl font-bold text-gray-900">{hospital.ots}</p>
              </div>
            </div>

            <div className="flex items-center p-4 bg-purple-50 rounded-lg">
              <Stethoscope className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Specialties</p>
                <p className="text-lg font-semibold text-gray-900">{hospital.specialties}</p>
              </div>
            </div>
          </div>

          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 flex items-center">
              <Building2 className="h-4 w-4 mr-2" />
              Address: {hospital.address}
            </p>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-full">
              <UserCheck className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Staff</p>
              <p className="text-2xl font-bold text-gray-900">{stats.staffCount}</p>
              <p className="text-sm text-gray-500">Doctors & Nurses</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-full">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Patients</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalPatients}</p>
              <p className="text-sm text-gray-500">All time</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 bg-orange-100 rounded-full">
              <Activity className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Today's Admissions</p>
              <p className="text-2xl font-bold text-gray-900">{stats.todayPatients}</p>
              <p className="text-sm text-gray-500">New patients</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickLinks.map((link, index) => (
            <button
              key={index}
              onClick={() => navigate(link.path)}
              className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-md transition-all duration-200 text-left group"
            >
              <div className={`p-2 rounded-lg ${link.color} w-fit mb-3 group-hover:scale-110 transition-transform duration-200`}>
                <link.icon className="h-5 w-5 text-white" />
              </div>
              <h3 className="font-medium text-gray-900 mb-1">{link.title}</h3>
              <p className="text-sm text-gray-600">{link.description}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HospitalAdminDashboard;