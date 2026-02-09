import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ShiftForm = () => {
  const [staff, setStaff] = useState([]);
  const [formData, setFormData] = useState({
    staff: '',
    start_time: '',
    end_time: '',
    location: '',
  });

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/users/', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setStaff(response.data);
    } catch (error) {
      console.error('Error fetching staff:', error);
      // If 403, user doesn't have permission - that's okay
      if (error.response?.status === 403) {
        setStaff([]);
      }
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:8000/api/shifts/', formData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      alert('Shift assigned');
    } catch (error) {
      alert('Error assigning shift');
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl mb-4">Assign Shift</h2>
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-md">
        <select name="staff" onChange={handleChange} className="w-full p-2 mb-4 border" required>
          <option value="">Select Staff</option>
          {staff.map(s => <option key={s.id} value={s.id}>{s.username}</option>)}
        </select>
        <input name="start_time" type="datetime-local" onChange={handleChange} className="w-full p-2 mb-4 border" required />
        <input name="end_time" type="datetime-local" onChange={handleChange} className="w-full p-2 mb-4 border" required />
        <input name="location" placeholder="Location" onChange={handleChange} className="w-full p-2 mb-4 border" required />
        <button type="submit" className="w-full bg-blue-500 text-white p-2">Assign Shift</button>
      </form>
    </div>
  );
};

export default ShiftForm;