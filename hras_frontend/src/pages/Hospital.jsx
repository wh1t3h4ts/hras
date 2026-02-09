import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Building2, Edit2, X, Bed, Activity, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';

const Hospital = () => {
  const [hospital, setHospital] = useState(null);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    beds: '',
    ots: '',
    specialties: ''
  });

  useEffect(() => {
    fetchHospitalData();
  }, []);

  const fetchHospitalData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch hospital details
      const hospitalRes = await axios.get('http://localhost:8000/api/hospitals/', { headers });
      const hospitalData = hospitalRes.data[0] || null;
      setHospital(hospitalData);
      
      if (hospitalData) {
        setFormData({
          name: hospitalData.name,
          address: hospitalData.address,
          beds: hospitalData.beds,
          ots: hospitalData.ots,
          specialties: hospitalData.specialties
        });
      }

      // Fetch staff
      try {
        const staffRes = await axios.get('http://localhost:8000/api/users/', { headers });
        setStaff(staffRes.data.slice(0, 5));
      } catch (error) {
        console.error('Error fetching staff:', error);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching hospital data:', error);
      toast.error('Failed to load hospital data');
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (hospital) {
        await axios.put(`http://localhost:8000/api/hospitals/${hospital.id}/`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Hospital updated successfully!');
      } else {
        await axios.post('http://localhost:8000/api/hospitals/', formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Hospital created successfully!');
      }
      setShowModal(false);
      fetchHospitalData();
    } catch (error) {
      console.error('Error saving hospital:', error);
      toast.error('Failed to save hospital details');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!hospital) {
    return (
      <div className="space-y-6">
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-12 text-center">
          <Building2 size={48} className="mx-auto text-slate-600 mb-4" />
          <h2 className="text-2xl font-bold text-slate-100 mb-2">No Hospital Found</h2>
          <p className="text-slate-400 mb-6">Create your hospital profile to get started</p>
          <button
            onClick={() => setShowModal(true)}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Create Hospital Profile
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Hospital Details</h1>
          <p className="text-slate-400 mt-1">Manage hospital information and resources</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <Edit2 size={18} className="mr-2" />
          Edit Details
        </button>
      </div>

      {/* Hospital Info Card */}
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-6">
        <div className="flex items-start gap-4 mb-6">
          <div className="p-4 bg-blue-500/10 rounded-lg">
            <Building2 size={32} className="text-blue-500" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-slate-100 mb-2">{hospital.name}</h2>
            <div className="flex items-center text-slate-400 mb-4">
              <MapPin size={16} className="mr-2" />
              {hospital.address}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">Total Beds</span>
              <Bed size={20} className="text-green-500" />
            </div>
            <p className="text-3xl font-bold text-slate-100">{hospital.beds}</p>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">Operating Theaters</span>
              <Activity size={20} className="text-purple-500" />
            </div>
            <p className="text-3xl font-bold text-slate-100">{hospital.ots}</p>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">Specialties</span>
              <Building2 size={20} className="text-blue-500" />
            </div>
            <p className="text-sm text-slate-300 mt-2">{hospital.specialties}</p>
          </div>
        </div>
      </div>

      {/* Staff Overview */}
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-6">
        <h3 className="text-xl font-bold text-slate-100 mb-4">Staff Overview</h3>
        <div className="space-y-3">
          {staff.length === 0 ? (
            <p className="text-slate-400 text-center py-8">No staff members found</p>
          ) : (
            staff.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-4 bg-slate-800 border border-slate-700 rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center">
                    <span className="text-blue-500 font-semibold">
                      {member.first_name?.[0] || member.username[0]}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-slate-100">
                      {member.first_name} {member.last_name}
                    </p>
                    <p className="text-sm text-slate-400">{member.specialty || member.role}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${member.availability ? 'bg-green-500' : 'bg-slate-500'}`}></div>
                  <span className="text-sm text-slate-400">
                    {member.availability ? 'Available' : 'Unavailable'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Edit Hospital Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-2xl w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-100">
                  {hospital ? 'Edit Hospital Details' : 'Create Hospital Profile'}
                </h2>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-100">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Hospital Name</label>
                  <input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Address</label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    rows="2"
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Total Beds</label>
                    <input
                      type="number"
                      name="beds"
                      value={formData.beds}
                      onChange={handleChange}
                      className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Operating Theaters</label>
                    <input
                      type="number"
                      name="ots"
                      value={formData.ots}
                      onChange={handleChange}
                      className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Specialties</label>
                  <textarea
                    name="specialties"
                    value={formData.specialties}
                    onChange={handleChange}
                    rows="2"
                    placeholder="e.g., Cardiology, Neurology, Pediatrics"
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    {hospital ? 'Update Hospital' : 'Create Hospital'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Hospital;
