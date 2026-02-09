import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Stethoscope, Calendar, Building2, FileText } from 'lucide-react';

const QuickActions = ({ role }) => {
  const navigate = useNavigate();

  const actions = {
    admin: [
      { label: 'Add Patient', icon: UserPlus, path: '/patients', color: 'blue' },
      { label: 'Add Doctor', icon: Stethoscope, path: '/staff', color: 'green' },
      { label: 'Assign Shift', icon: Calendar, path: '/shifts', color: 'purple' },
      { label: 'Hospital Details', icon: Building2, path: '/hospital-management', color: 'orange' }
    ],
    doctor: [
      { label: 'My Patients', icon: UserPlus, path: '/patients', color: 'blue' },
      { label: 'Add Lab Report', icon: FileText, path: '/lab-reports', color: 'green' },
      { label: 'View Schedule', icon: Calendar, path: '/shifts', color: 'purple' }
    ],
    nurse: [
      { label: 'My Patients', icon: UserPlus, path: '/patients', color: 'blue' },
      { label: 'View Schedule', icon: Calendar, path: '/shifts', color: 'purple' }
    ],
    receptionist: [
      { label: 'Register Patient', icon: UserPlus, path: '/patients', color: 'blue' },
      { label: 'View Patients', icon: FileText, path: '/patients', color: 'green' }
    ]
  };

  const colorClasses = {
    blue: 'bg-blue-600 hover:bg-blue-700',
    green: 'bg-green-600 hover:bg-green-700',
    purple: 'bg-purple-600 hover:bg-purple-700',
    orange: 'bg-orange-600 hover:bg-orange-700'
  };

  const userActions = actions[role] || actions.receptionist;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
      <div className="space-y-3">
        {userActions.map((action, idx) => {
          const Icon = action.icon;
          return (
            <button
              key={idx}
              onClick={() => navigate(action.path)}
              className={`w-full flex items-center px-4 py-3 ${colorClasses[action.color]} text-white rounded-lg transition-colors`}
            >
              <Icon size={18} className="mr-3" />
              {action.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default QuickActions;
