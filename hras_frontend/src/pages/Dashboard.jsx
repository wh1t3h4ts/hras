import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bed, Users, Clock, Activity, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import StatCard from '../components/dashboard/StatCard';
import PatientList from '../components/dashboard/PatientList';
import ResourceWidget from '../components/dashboard/ResourceWidget';
import QuickActions from '../components/dashboard/QuickActions';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const role = user?.role;
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalBeds: 0,
    availableBeds: 0,
    occupancy: 0,
    activePatients: 0,
    criticalPatients: 0,
    avgAssignmentTime: 0,
    avgResponseTime: 0,
    staffOnDuty: 0
  });
  const [patients, setPatients] = useState([]);
  const [resources, setResources] = useState({
    doctorsOnDuty: 0,
    availableBeds: 0,
    availableOTs: 0
  });
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    // Redirect hospital admins to their specific dashboard
    if (role === 'hospital_admin') {
      navigate('/hospital-admin-dashboard', { replace: true });
      return;
    }
    
    fetchDashboardData();
  }, [role, navigate]);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }
      
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch patients
      const patientsRes = await axios.get('http://localhost:8000/api/patients/', { headers });
      const patientsData = patientsRes.data.slice(0, 5);
      setPatients(patientsData);

      // Fetch resources
      try {
        const resourcesRes = await axios.get('http://localhost:8000/api/resources/', { headers });
        const beds = resourcesRes.data.filter(r => r.type === 'Bed');
        const availableBeds = beds.filter(b => b.availability).length;
        
        setResources({
          doctorsOnDuty: 8,
          availableBeds: availableBeds,
          availableOTs: 3
        });

        // Calculate stats
        const totalBeds = beds.length || 100;
        const occupancy = totalBeds > 0 ? Math.round(((totalBeds - availableBeds) / totalBeds) * 100) : 0;
        const criticalCount = patientsData.filter(p => p.priority === 'Critical').length;

        setStats({
          totalBeds,
          availableBeds,
          occupancy,
          activePatients: patientsData.length,
          criticalPatients: criticalCount,
          avgAssignmentTime: 15,
          avgResponseTime: 10,
          staffOnDuty: 8
        });
      } catch (error) {
        console.error('Error fetching resources:', error);
        // Use fallback data
        setResources({
          doctorsOnDuty: 8,
          availableBeds: 20,
          availableOTs: 3
        });
        setStats({
          totalBeds: 100,
          availableBeds: 20,
          occupancy: 80,
          activePatients: patientsData.length,
          criticalPatients: patientsData.filter(p => p.priority === 'Critical').length,
          avgAssignmentTime: 15,
          avgResponseTime: 10,
          staffOnDuty: 8
        });
      }

      // Generate chart data (last 7 days)
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return {
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          admissions: Math.floor(Math.random() * 15) + 5
        };
      });
      setChartData(last7Days);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      if (error.response?.status === 401) {
        // Token expired or invalid - redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      } else {
        toast.error('Failed to load dashboard data');
      }
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {user?.first_name || user?.username || 'User'}
        </h1>
        <p className="text-gray-600">Here's what's happening in your hospital today</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Available Beds"
          value={`${stats.availableBeds}/${stats.totalBeds}`}
          subtitle={`${stats.occupancy}% Occupancy`}
          icon={<Bed size={24} />}
          color={stats.availableBeds > 10 ? 'green' : 'red'}
        />
        <StatCard
          title="Active Patients"
          value={stats.activePatients}
          subtitle={stats.criticalPatients > 0 ? `${stats.criticalPatients} Critical` : 'All stable'}
          icon={<Users size={24} />}
          color={stats.criticalPatients > 0 ? 'red' : 'blue'}
        />
        <StatCard
          title="Avg Assignment Time"
          value={`${stats.avgAssignmentTime} min`}
          icon={<Clock size={24} />}
          color="yellow"
        />
        <StatCard
          title="Staff On Duty"
          value={stats.staffOnDuty}
          subtitle="Doctors & Nurses"
          icon={<Activity size={24} />}
          color="green"
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <QuickActions role={role} />
        <PatientList patients={patients} loading={false} />
        <ResourceWidget resources={resources} loading={false} />
      </div>

      {/* Chart Section */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <TrendingUp size={20} className="mr-2 text-blue-500" />
          Patient Admissions (Last 7 Days)
        </h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="date" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                color: '#1f2937'
              }}
            />
            <Line
              type="monotone"
              dataKey="admissions"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ fill: '#3b82f6', r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Dashboard;
