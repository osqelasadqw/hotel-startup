import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';

interface NavbarProps {
  userRole?: 'department' | 'admin' | null;
  onBackClick?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ userRole, onBackClick }) => {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };
  
  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              {onBackClick ? (
                <button 
                  onClick={onBackClick} 
                  className="cursor-pointer"
                >
                  <Image 
                    src="/logo.png" 
                    alt="Stay Fix Logo" 
                    width={400} 
                    height={160} 
                    className="h-18 w-auto"
                  />
                </button>
              ) : (
                <Link href="/" className="transition-colors">
                  <Image 
                    src="/logo.png" 
                    alt="Stay Fix Logo" 
                    width={400} 
                    height={160} 
                    className="h-18 w-auto"
                  />
                </Link>
              )}
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link 
                href="/" 
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium
                  ${pathname === '/' 
                    ? 'border-blue-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                Home
              </Link>
              
              {userRole === 'department' && (
                <>
                  <Link 
                    href="/tasks" 
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium
                      ${pathname === '/tasks' 
                        ? 'border-blue-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }
                    `}
                  >
                    My Tasks
                  </Link>
                </>
              )}
              
              {userRole === 'admin' && (
                <>
                  <Link 
                    href="/admin/dashboard" 
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium
                      ${pathname === '/admin/dashboard' 
                        ? 'border-blue-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }
                    `}
                  >
                    Dashboard
                  </Link>
                  <Link 
                    href="/admin/departments" 
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium
                      ${pathname === '/admin/departments' 
                        ? 'border-blue-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }
                    `}
                  >
                    Departments
                  </Link>
                  <Link 
                    href="/admin/employees" 
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium
                      ${pathname === '/admin/employees' 
                        ? 'border-blue-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }
                    `}
                  >
                    Employees
                  </Link>
                </>
              )}
            </div>
          </div>
          
          {/* Desktop navigation buttons */}
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            {userRole ? (
              <Link 
                href="/auth/signout" 
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Sign Out
              </Link>
            ) : (
              <Link 
                href="/auth/signin" 
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Staff Login
              </Link>
            )}
          </div>
          
          {/* Mobile hamburger button */}
          <div className="flex items-center sm:hidden">
            <button 
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              aria-expanded={isMenuOpen}
            >
              <span className="sr-only">Open main menu</span>
              {/* Hamburger icon */}
              <svg 
                className={`${isMenuOpen ? 'hidden' : 'block'} h-6 w-6`} 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor" 
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              {/* X icon when menu is open */}
              <svg 
                className={`${isMenuOpen ? 'block' : 'hidden'} h-6 w-6`} 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor" 
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      <div className={`${isMenuOpen ? 'block' : 'hidden'} sm:hidden`}>
        <div className="pt-2 pb-3 space-y-1">
          <Link 
            href="/" 
            className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium
              ${pathname === '/' 
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
              }
            `}
            onClick={() => setIsMenuOpen(false)}
          >
            Home
          </Link>
          
          {userRole === 'department' && (
            <Link 
              href="/tasks" 
              className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium
                ${pathname === '/tasks' 
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
                }
              `}
              onClick={() => setIsMenuOpen(false)}
            >
              My Tasks
            </Link>
          )}
          
          {userRole === 'admin' && (
            <>
              <Link 
                href="/admin/dashboard" 
                className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium
                  ${pathname === '/admin/dashboard' 
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
                  }
                `}
                onClick={() => setIsMenuOpen(false)}
              >
                Dashboard
              </Link>
              <Link 
                href="/admin/departments" 
                className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium
                  ${pathname === '/admin/departments' 
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
                  }
                `}
                onClick={() => setIsMenuOpen(false)}
              >
                Departments
              </Link>
              <Link 
                href="/admin/employees" 
                className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium
                  ${pathname === '/admin/employees' 
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
                  }
                `}
                onClick={() => setIsMenuOpen(false)}
              >
                Employees
              </Link>
            </>
          )}
        </div>
        
        <div className="pt-4 pb-3 border-t border-gray-200">
          {userRole ? (
            <div className="flex items-center px-4">
              <div className="flex-shrink-0 w-full">
                <Link 
                  href="/auth/signout" 
                  className="block text-center w-full px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign Out
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex items-center px-4">
              <div className="flex-shrink-0 w-full">
                <Link 
                  href="/auth/signin" 
                  className="block text-center w-full px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Staff Login
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 