import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, Edit2, UserX, UserCheck, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

const StaffManagement = () => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8000/api/accounts/staff/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStaff(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching staff:', error);
      toast.error('Failed to load staff data');
      setLoading(false);
    }
  };

  const handleDeactivate = async (staffMember) => {
    if (!window.confirm(`Are you sure you want to deactivate ${staffMember.name}?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:8000/api/accounts/staff/${staffMember.id}/deactivate/`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(`${staffMember.name} has been deactivated`);
      fetchStaff(); // Refresh the list
    } catch (error) {
      console.error('Error deactivating staff:', error);
      toast.error('Failed to deactivate staff member');
    }
  };

  const handleActivate = async (staffMember) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:8000/api/accounts/staff/${staffMember.id}/activate/`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(`${staffMember.name} has been activated`);
      fetchStaff(); // Refresh the list
    } catch (error) {
      console.error('Error activating staff:', error);
      toast.error('Failed to activate staff member');
    }
  };

  const getRoleBadgeColor = (role) => {
    return role === 'doctor' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800';
  };

  const getStatusBadgeColor = (isActive) => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <Users className="h-8 w-8 mr-3 text-blue-600" />
              Staff Management
            </h1>
            <p className="text-gray-600 mt-1">Manage doctors and nurses in your hospital</p>
          </div>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center">
            <Plus className="h-5 w-5 mr-2" />
            Add Staff
          </button>
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Hospital Staff ({staff.length})</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {staff.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{member.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{member.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(member.role)}`}>
                      {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(member.is_active)}`}>
                      {member.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setSelectedStaff(member);
                          setShowEditModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900 p-1"
                        title="Edit staff member"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      {member.is_active ? (
                        <button
                          onClick={() => handleDeactivate(member)}
                          className="text-red-600 hover:text-red-900 p-1"
                          title="Deactivate staff member"
                        >
                          <UserX className="h-4 w-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleActivate(member)}
                          className="text-green-600 hover:text-green-900 p-1"
                          title="Activate staff member"
                        >
                          <UserCheck className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {staff.length === 0 && (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No staff members</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by adding your first staff member.</p>
          </div>
        )}
      </div>

      {/* Edit Modal Placeholder */}
      {showEditModal && selectedStaff && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Edit Staff Member</h3>
            <p className="text-gray-600 mb-4">Edit modal for {selectedStaff.name} would go here.</p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffManagement;