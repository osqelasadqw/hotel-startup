import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/context/AuthContext';

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

const AuthGuard: React.FC<AuthGuardProps> = ({ 
  children, 
  allowedRoles = [] 
}) => {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Wait until authentication state is determined
    if (!isLoading) {
      // If user is not authenticated, redirect to login
      if (!user) {
        router.push('/auth/signin');
        return;
      }

      // If specific roles are required and user doesn't have permission
      if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        // Redirect based on user role
        switch (user.role) {
          case 'admin':
            router.push('/admin/dashboard');
            break;
          case 'department':
            router.push('/tasks');
            break;
          default:
            router.push('/');
            break;
        }
      }
    }
  }, [user, isLoading, router, allowedRoles]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // If there's no auth check or the user has the required role, render children
  if ((user && allowedRoles.length === 0) || (user && allowedRoles.includes(user.role))) {
    return <>{children}</>;
  }

  // This is a fallback that should rarely be seen
  // as redirects should happen in the useEffect
  return null;
};

export default AuthGuard; 