'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/firebase/config';
import { signOut } from 'firebase/auth';
import Navbar from '@/components/navigation/Navbar';

export default function SignOut() {
  const router = useRouter();

  useEffect(() => {
    const performSignOut = async () => {
      try {
        await signOut(auth);
        console.log('Successfully signed out');
      } catch (error) {
        console.error('Error signing out:', error);
      } finally {
        // Redirect to home page after sign out, whether successful or not
        router.push('/');
      }
    };

    performSignOut();
  }, [router]);

  return (
    <div>
      <Navbar />
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Signing out...</h1>
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
        </div>
      </div>
    </div>
  );
} 