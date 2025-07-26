'use client';

import React from 'react';
import AuthForm from '@/components/auth/AuthForm';
import Navbar from '@/components/navigation/Navbar';

const SignInPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="pt-12 sm:pt-16">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
              create a new account
            </a>
          </p>
        </div>

        <AuthForm />
      </div>
    </div>
  );
};

export default SignInPage; 