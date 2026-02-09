import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const PatientAdmissionsChart = () => {
  const data = [
    { name: 'Mon', admissions: 12 },
    { name: 'Tue', admissions: 19 },
    { name: 'Wed', admissions: 15 },
    { name: 'Thu', admissions: 25 },
    { name: 'Fri', admissions: 22 },
    { name: 'Sat', admissions: 18 },
    { name: 'Sun', admissions: 14 },
  ];

  return (
    <div className="bg-slate-800 p-6 rounded-lg shadow-lg">
      <h3 className="text-lg font-semibold mb-4 text-slate-100">Patient Admissions (Last 7 Days)</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="name" stroke="#9ca3af" />
          <YAxis stroke="#9ca3af" />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: 'none',
              borderRadius: '8px',
              color: '#f1f5f9'
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="admissions"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PatientAdmissionsChart;