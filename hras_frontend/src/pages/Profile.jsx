import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Shield, CheckCircle, Clock, Building } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import HRASLogo from '../components/ui/HRASLogo';

const Profile = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user, logout } = useAuth();

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/accounts/users/me/', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      setUserData(response.data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      toast.error('Failed to load profile information');
    } finally {
      setLoading(false);
    }
  };

  const getRoleDisplay = (role) => {
    const roleMap = {
      'super_admin': 'Super Administrator',
      'hospital_admin': 'Hospital Administrator',
      'doctor': 'Doctor',
      'nurse': 'Nurse',
      'receptionist': 'Receptionist'
    };
    return roleMap[role] || role;
  };

  const getStatusDisplay = (isApproved) => {
    return isApproved ? 'Approved' : 'Pending Approval';
  };

  const getStatusColor = (isApproved) => {
    return isApproved ? 'text-green-600' : 'text-yellow-600';
  };

  const getStatusIcon = (isApproved) => {
    return isApproved ? <CheckCircle size={20} /> : <Clock size={20} />;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white border border-gray-200 rounded-xl shadow-2xl p-8"
        >
          <div className="text-center mb-8">
            <div className="mb-6 flex justify-center">
              <HRASLogo size="large" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Profile</h1>
            <p className="text-gray-600">View your account information and permissions</p>
          </div>

          {userData && (
            <div className="space-y-6">
              {/* User Info Card */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <User className="text-blue-600 mr-3" size={24} />
                  <h2 className="text-xl font-semibold text-gray-900">Account Information</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <p className="text-gray-900 bg-white px-3 py-2 border border-gray-300 rounded-md">
                      {userData.email}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <p className="text-gray-900 bg-white px-3 py-2 border border-gray-300 rounded-md">
                      {user?.first_name} {user?.last_name}
                    </p>
                  </div>
                </div>
              </div>

              {/* Role & Permissions Card */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <Shield className="text-blue-600 mr-3" size={24} />
                  <h2 className="text-xl font-semibold text-gray-900">Role & Permissions</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center mb-2">
                      <Shield className="text-blue-600 mr-2" size={20} />
                      <span className="font-medium text-gray-700">Role</span>
                    </div>
                    <p className="text-lg font-semibold text-gray-900">
                      {getRoleDisplay(userData.role)}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      Defines your access level and permissions in the system
                    </p>
                  </div>

                  <div className="bg-white p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center mb-2">
                      {getStatusIcon(userData.is_approved)}
                      <span className={`ml-2 font-medium ${getStatusColor(userData.is_approved)}`}>
                        Account Status
                      </span>
                    </div>
                    <p className={`text-lg font-semibold ${getStatusColor(userData.is_approved)}`}>
                      {getStatusDisplay(userData.is_approved)}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {userData.is_approved
                        ? 'Your account is active and approved'
                        : 'Your account is awaiting administrator approval'
                      }
                    </p>
                  </div>
                </div>

                {userData.hospital && (
                  <div className="mt-4 bg-white p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center mb-2">
                      <Building className="text-blue-600 mr-2" size={20} />
                      <span className="font-medium text-gray-700">Hospital Assignment</span>
                    </div>
                    <p className="text-lg font-semibold text-gray-900">
                      {userData.hospital}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      Your assigned healthcare facility
                    </p>
                  </div>
                )}
              </div>

              {/* Permissions Awareness */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-3">Understanding Your Permissions</h3>
                <div className="space-y-2 text-sm text-blue-800">
                  <p><strong>Principle of Least Privilege:</strong> You only have access to the information and actions necessary for your role.</p>
                  <p><strong>Your Role ({getRoleDisplay(userData.role)}):</strong> Determines what patient data you can view and what actions you can perform.</p>
                  <p><strong>Data Security:</strong> All your actions are logged for audit and compliance purposes.</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-center space-x-4 pt-6 border-t border-gray-200">
                <button
                  onClick={() => window.history.back()}
                  className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors"
                >
                  Back to Dashboard
                </button>
                <button
                  onClick={logout}
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Profile;