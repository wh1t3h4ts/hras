import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Building2, Edit2, Bed, Activity, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import HospitalEditModal from '../components/hospital/HospitalEditModal';

const Hospital = () => {
  const [hospital, setHospital] = useState(null);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

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
      {/* Hospital Edit Modal */}
      <HospitalEditModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        hospital={hospital}
        onUpdate={(updatedHospital) => {
          setHospital(updatedHospital);
        }}
      />
    </div>
  );
};

export default Hospital;
