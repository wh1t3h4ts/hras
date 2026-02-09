import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import axios from 'axios';
import LoadingSpinner from './LoadingSpinner';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const AnalyticsDashboard = () => {
  const [assignmentData, setAssignmentData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const assignmentRes = await axios.get('http://localhost:8000/api/analytics/assignment-times/', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setAssignmentData(assignmentRes.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching analytics', error);
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  const assignmentChartData = {
    labels: ['Average'],
    datasets: [{
      label: 'Assignment Time',
      data: [assignmentData?.average_assignment_time ? parseFloat(assignmentData.average_assignment_time.split(':')[0]) : 0],
      borderColor: 'rgba(75,192,192,1)',
      backgroundColor: 'rgba(75,192,192,0.2)',
    }]
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl mb-4">Analytics Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h3 className="text-xl mb-2">Patient Allocation Time</h3>
          <Line key="assignment" data={assignmentChartData} />
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;