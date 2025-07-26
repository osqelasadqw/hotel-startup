import React, { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInWithPopup 
} from 'firebase/auth';
import { ref, set, get } from 'firebase/database';
import { auth, database, googleProvider } from '@/firebase/config';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { FcGoogle } from 'react-icons/fc';

type Variant = 'LOGIN' | 'REGISTER';
type Role = 'department' | 'admin';

// Predefined admin email
const ADMIN_EMAIL = 'osqelan1@gmail.com';

const AuthForm = () => {
  const router = useRouter();
  const [variant, setVariant] = useState<Variant>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<Role>('department');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [adminExists, setAdminExists] = useState(false);

  useEffect(() => {
    // Check if admin account already exists
    const checkAdminAccount = async () => {
      try {
        const usersRef = ref(database, 'users');
        const snapshot = await get(usersRef);
        
        if (snapshot.exists()) {
          let adminFound = false;
          snapshot.forEach((childSnapshot) => {
            const userData = childSnapshot.val();
            if (userData.email === ADMIN_EMAIL && userData.role === 'admin') {
              adminFound = true;
            }
          });
          setAdminExists(adminFound);
        }
      } catch (error) {
        console.error('Error checking admin account:', error);
      }
    };
    
    checkAdminAccount();
  }, []);

  const toggleVariant = useCallback(() => {
    setVariant((prev) => (prev === 'LOGIN' ? 'REGISTER' : 'LOGIN'));
    setError('');
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (variant === 'REGISTER') {
        // Validate admin registration
        if (role === 'admin' && email !== ADMIN_EMAIL) {
          setError(`Admin registration is restricted to ${ADMIN_EMAIL}`);
          setIsLoading(false);
          return;
        }

        // Check if admin account already exists
        if (role === 'admin' && adminExists) {
          setError('Admin account already exists');
          setIsLoading(false);
          return;
        }

        // Create user with email and password
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Store user data in Realtime Database
        await set(ref(database, `users/${user.uid}`), {
          name,
          email,
          role,
          createdAt: new Date().toISOString()
        });

        // Redirect to appropriate page based on role
        if (role === 'admin') {
          router.push('/admin/dashboard');
        } else if (role === 'department') {
          router.push('/tasks');
        }
      } else {
        // Sign in with email and password
        await signInWithEmailAndPassword(auth, email, password);
        // The redirection will be handled by the authentication context or AuthGuard
        router.push('/');
      }
    } catch (error: any) {
      console.error('Authentication error:', error);
      setError(error.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Check if user already exists in our database
      const userRef = ref(database, `users/${user.uid}`);
      const snapshot = await get(userRef);
      
      if (!snapshot.exists()) {
        // If user doesn't exist, determine role based on email
        let userRole: Role = 'department';
        if (user.email === ADMIN_EMAIL) {
          // Check if admin account already exists
          if (adminExists) {
            setError('Admin account already exists');
            await auth.signOut();
            setIsLoading(false);
            return;
          }
          userRole = 'admin';
        }
        
        // Store user data in Realtime Database
        await set(userRef, {
          name: user.displayName || 'Google User',
          email: user.email,
          role: userRole,
          createdAt: new Date().toISOString()
        });
      }
      
      // Redirect based on existing role or new role
      router.push('/');
      
    } catch (error: any) {
      console.error('Google Authentication error:', error);
      setError(error.message || 'Google Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <div className="bg-white px-4 py-8 shadow sm:rounded-lg sm:px-10">
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-md">
            {error}
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          {variant === 'REGISTER' && (
            <div>
              <label className="block text-sm font-medium leading-6 text-gray-900">
                Name
              </label>
              <div className="mt-2">
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
            </div>
          )}

          {variant === 'REGISTER' && (
            <div>
              <label className="block text-sm font-medium leading-6 text-gray-900">
                Role
              </label>
              <div className="mt-2">
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as Role)}
                  disabled={isLoading}
                  className="block w-full rounded-md border-0 py-2 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm"
                >
                  <option value="department">Department Staff</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium leading-6 text-gray-900">
              Email address
            </label>
            <div className="mt-2">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium leading-6 text-gray-900">
              Password
            </label>
            <div className="mt-2">
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
          </div>

          <div>
            <Button disabled={isLoading} fullWidth type="submit">
              {variant === 'LOGIN' ? 'Sign in' : 'Register'}
            </Button>
          </div>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-2 text-gray-500">
                Or continue with
              </span>
            </div>
          </div>

          <div className="mt-6">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full flex justify-center items-center gap-3 bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <FcGoogle size={20} />
              <span>Sign in with Google</span>
            </button>
          </div>
        </div>

        {/* Only show registration option for staff and admin */}
        <div className="mt-6">
          <div className="flex gap-2 justify-center text-sm mt-6 px-2 text-gray-500">
            <div>
              {variant === 'LOGIN' ? 'Staff or admin registration?' : 'Already have an account?'}
            </div>
            <div onClick={toggleVariant} className="underline cursor-pointer">
              {variant === 'LOGIN' ? 'Create an account' : 'Login'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthForm; 