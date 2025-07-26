import React from 'react';

interface MobileTabBarProps {
  activeTab: 'active' | 'archive';
  onTabChange: (tab: 'active' | 'archive') => void;
}

const MobileTabBar: React.FC<MobileTabBarProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg sm:hidden">
      <div className="flex justify-around h-16">
        <button
          className={`flex flex-col items-center justify-center w-1/2 ${
            activeTab === 'active' ? 'text-blue-600' : 'text-gray-500'
          }`}
          onClick={() => onTabChange('active')}
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-6 w-6" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" 
            />
          </svg>
          <span className="text-xs mt-1">ჩემი დავალებები</span>
        </button>
        
        <button
          className={`flex flex-col items-center justify-center w-1/2 ${
            activeTab === 'archive' ? 'text-blue-600' : 'text-gray-500'
          }`}
          onClick={() => onTabChange('archive')}
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-6 w-6" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" 
            />
          </svg>
          <span className="text-xs mt-1">არქივი</span>
        </button>
      </div>
    </div>
  );
};

export default MobileTabBar; 