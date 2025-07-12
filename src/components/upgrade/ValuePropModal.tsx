import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface ValuePropModalProps {
  isOpen: boolean;
  onClose: () => void;
  daysRemaining: number;
}

export const ValuePropModal = ({ isOpen, onClose, daysRemaining }: ValuePropModalProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  if (!isOpen) return null;

  const handleUpgradeClick = () => {
    navigate('/upgrade');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Ready to Flex Your Grind?
          </h2>
        </div>

        {/* Content */}
        <div className="space-y-4 mb-6">
          <p className="text-gray-600">
            For a one-time fee of <span className="font-bold text-gray-900">$5.99</span>, you'll unlock:
          </p>
          
          <ul className="space-y-2">
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              Your personal leaderboard rank
            </li>
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              Public profile visibility
            </li>
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              Social handles and Trainer Code sharing
            </li>
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              Continued access to PlayerZero beyond your 7-day Private Mode
            </li>
          </ul>

          <p className="text-gray-600 mt-4">
            You still have <span className="font-bold text-blue-600">{daysRemaining} days</span> left to keep exploring before deciding.
          </p>
        </div>

        {/* Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleUpgradeClick}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Upgrade Now
          </button>
          <button
            onClick={onClose}
            className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            Keep Exploring
          </button>
        </div>
      </div>
    </div>
  );
}; 