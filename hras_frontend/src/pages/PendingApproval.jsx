import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, ArrowLeft } from 'lucide-react';
import HRASLogo from '../components/ui/HRASLogo';

const PendingApproval = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-white border border-gray-200 rounded-xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="mb-6 flex justify-center">
              <HRASLogo size="large" />
            </div>
            <div className="mb-4 flex justify-center">
              <div className="p-3 bg-yellow-100 rounded-full">
                <Clock size={32} className="text-yellow-600" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Account Pending Approval</h1>
            <p className="text-gray-600">
              Your account has been created. An administrator will review and approve it soon.
            </p>
          </div>

          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <Clock size={20} className="text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-medium text-yellow-800">What happens next?</h3>
                  <ul className="mt-2 text-sm text-yellow-700 space-y-1">
                    <li>• HR will review your application</li>
                    <li>• You'll receive approval via email</li>
                    <li>• Once approved, you can log in</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="text-center">
              <Link
                to="/login"
                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                <ArrowLeft size={16} className="mr-2" />
                Back to Login
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-gray-500 text-xs">Hospital Resource Allocation System v2.0</p>
        </div>
      </motion.div>
    </div>
  );
};

export default PendingApproval;