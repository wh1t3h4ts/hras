import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  Stethoscope,
  Building2,
  Calendar,
  BarChart3,
  MessageSquare,
  X,
  UserCheck,
  User,
  Zap,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import useAiAvailability from '../../hooks/useAiAvailability';
import HRASLogo from '../ui/HRASLogo';

const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { aiAvailable, aiMessage } = useAiAvailability();
  const role = user?.role;
  
  const isAdmin = role === 'admin';
  const isDoctor = role === 'doctor';
  const isStaff = ['doctor', 'nurse', 'receptionist'].includes(role);

  const menuItems = [
    {
      name: 'Dashboard',
      icon: LayoutDashboard,
      path: '/dashboard',
      roles: ['all']
    },
    {
      name: 'User Management',
      icon: UserCheck,
      path: '/user-management',
      roles: ['admin']
    },
    {
      name: 'My Workspace',
      icon: UserCheck,
      path: '/my-workspace',
      roles: ['doctor', 'nurse']
    },
    {
      name: 'Patients',
      icon: Users,
      path: '/patients',
      roles: ['all']
    },
    {
      name: 'Doctors & Staff',
      icon: Stethoscope,
      path: '/staff',
      roles: ['admin', 'doctor']
    },
    {
      name: 'Hospital Details',
      icon: Building2,
      path: '/hospital-management',
      roles: ['admin']
    },
    {
      name: 'Shifts',
      icon: Calendar,
      path: '/shifts',
      roles: ['admin', 'doctor', 'nurse']
    },
    {
      name: 'Analytics',
      icon: BarChart3,
      path: '/analytics',
      roles: ['admin', 'doctor']
    },
    {
      name: 'AI Assistant',
      icon: MessageSquare,
      path: '/ai-chat',
      roles: ['doctor']
    },
    {
      name: 'Profile',
      icon: User,
      path: '/profile',
      roles: ['all']
    }
  ];

  const filteredMenuItems = menuItems.filter(item => {
    if (role === 'receptionist') {
      // Receptionists only see Patient Queue, Patients, and Profile
      return ['Dashboard', 'Patients', 'Profile'].includes(item.name);
    }
    if (role === 'nurse') {
      // Nurses only see My Patients and Profile
      return ['My Workspace', 'Profile'].includes(item.name);
    }
    if (role === 'doctor') {
      // Doctors see My Patients, Analytics, AI Assistant, and Profile
      return ['My Workspace', 'Analytics', 'AI Assistant', 'Profile'].includes(item.name);
    }
    if (role === 'admin') {
      // Admins see Dashboard, User Management, Hospitals, Staff, Patients, Shifts, Analytics, Profile
      return ['Dashboard', 'User Management', 'Hospital Details', 'Doctors & Staff', 'Patients', 'Shifts', 'Analytics', 'Profile'].includes(item.name);
    }
    if (item.roles.includes('all')) return true;
    if (isAdmin && item.roles.includes('admin')) return true;
    if (isDoctor && item.roles.includes('doctor')) return true;
    if (isStaff && item.roles.some(role => ['doctor', 'nurse', 'receptionist'].includes(role))) return true;
    return false;
  }).map(item => {
    // Rename Dashboard to Patient Queue for receptionists
    if (role === 'receptionist' && item.name === 'Dashboard') {
      return { ...item, name: 'Patient Queue', path: '/receptionist-dashboard' };
    }
    // Rename My Workspace to My Patients for nurses
    if (role === 'nurse' && item.name === 'My Workspace') {
      return { ...item, name: 'My Patients', path: '/nurse-dashboard' };
    }
    // Rename My Workspace to My Patients for doctors
    if (role === 'doctor' && item.name === 'My Workspace') {
      return { ...item, name: 'My Patients', path: '/doctor-dashboard' };
    }
    // Rename Dashboard for hospital admins
    if (role === 'hospital_admin' && item.name === 'Dashboard') {
      return { ...item, name: 'Dashboard', path: '/hospital-admin-dashboard' };
    }
    return item;
  });

  const sidebarVariants = {
    open: {
      x: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    },
    closed: {
      x: "-100%",
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <motion.aside
        initial="closed"
        animate={isOpen ? "open" : "closed"}
        variants={sidebarVariants}
        className="fixed left-0 top-0 z-50 h-full w-64 bg-gradient-to-b from-slate-950 to-slate-900 border-r border-slate-800/50 shadow-2xl lg:relative lg:translate-x-0"
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-800/50 bg-slate-950/50">
            <HRASLogo size="header" showText={true} compact={true} />
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-lg hover:bg-slate-800/60 text-slate-400 hover:text-slate-100 transition-all"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
            {filteredMenuItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => window.innerWidth < 1024 && onClose()}
                  className={({ isActive }) =>
                    `group flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 relative ${
                      isActive
                        ? 'bg-slate-800/70 text-blue-300 shadow-lg shadow-blue-500/10 border-l-4 border-blue-500 pl-2.5 font-semibold'
                        : 'text-slate-300 hover:bg-slate-800/50 hover:text-white hover:pl-2.5'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon 
                        size={20} 
                        className={`mr-3 transition-all ${
                          isActive ? 'text-blue-300 opacity-100' : 'text-slate-300 opacity-90 group-hover:text-white group-hover:opacity-100'
                        }`} 
                      />
                      <span className="flex-1">{item.name}</span>
                      {isActive && (
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-300 animate-pulse shadow-sm shadow-blue-400/50" />
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* AI Status Indicator */}
          <div className="px-3 py-3 border-t border-slate-800/50">
            <div className="flex items-center space-x-2 text-xs">
              {aiAvailable ? (
                <Zap size={14} className="text-green-400" />
              ) : (
                <AlertTriangle size={14} className="text-orange-400" />
              )}
              <span className={aiAvailable ? 'text-green-400' : 'text-orange-400'}>
                {aiAvailable ? 'AI Online' : 'AI Offline'}
              </span>
            </div>
            <div className="text-xs text-slate-500 mt-1 truncate" title={aiMessage}>
              {aiMessage}
            </div>
          </div>
        </div>
      </motion.aside>
    </>
  );
};

export default Sidebar;