import React, { useState, useEffect } from 'react';
import axios from 'axios';

const DoctorDashboard = () => {
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [reportData, setReportData] = useState({ diagnosis: '' });

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    const response = await axios.get('http://localhost:8000/api/patients/', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    setPatients(response.data);
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:8000/api/lab-reports/', {
        patient: selectedPatient.id,
        diagnosis: reportData.diagnosis,
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      alert('Report added');
    } catch (error) {
      alert('Error adding report');
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl mb-4">Doctor Dashboard</h2>
      <h3 className="text-xl mb-2">Assigned Patients</h3>
      <ul>
        {patients.map(p => (
          <li key={p.id} onClick={() => setSelectedPatient(p)} className="cursor-pointer p-2 border mb-2">
            {p.name} - Assignment Time: {p.assignment_time}
          </li>
        ))}
      </ul>
      {selectedPatient && (
        <form onSubmit={handleReportSubmit} className="bg-white p-6 rounded shadow-md mt-4">
          <h4>Add Lab Report for {selectedPatient.name}</h4>
          <textarea
            name="diagnosis"
            placeholder="Diagnosis"
            value={reportData.diagnosis}
            onChange={(e) => setReportData({ diagnosis: e.target.value })}
            className="w-full p-2 mb-4 border"
            required
          />
          <button type="submit" className="bg-blue-500 text-white p-2">Submit Report</button>
        </form>
      )}
    </div>
  );
};

export default DoctorDashboard;