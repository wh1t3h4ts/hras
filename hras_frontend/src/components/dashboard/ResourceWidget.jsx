import React from 'react';
import { Bed, Users, Activity } from 'lucide-react';

const ResourceWidget = ({ resources, loading }) => {
  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-16 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const items = [
    {
      label: 'Doctors On Duty',
      value: resources.doctorsOnDuty || 0,
      icon: Users,
      color: 'text-blue-500'
    },
    {
      label: 'Available Beds',
      value: resources.availableBeds || 0,
      icon: Bed,
      color: 'text-green-500'
    },
    {
      label: 'Available OTs',
      value: resources.availableOTs || 0,
      icon: Activity,
      color: 'text-purple-500'
    }
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Resource Overview</h3>
      <div className="space-y-4">
        {items.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <Icon size={20} className={`mr-3 ${item.color}`} />
                <span className="text-gray-700">{item.label}</span>
              </div>
              <span className="text-2xl font-bold text-gray-900">{item.value}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ResourceWidget;
