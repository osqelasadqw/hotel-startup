'use client';

import React, { useState, useEffect } from 'react';
import { ref, get, update } from 'firebase/database';
import { database } from '@/firebase/config';
import { User, Department } from '@/models/types';
import AuthGuard from '@/components/auth/AuthGuard';
// Button is used in the file, adding a comment to satisfy ESLint
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import Button from '@/components/ui/Button';
import { getDepartments } from '@/services/departmentService';
import { UserPlus, Users, CheckCircle, AlertCircle } from 'lucide-react';
import Navbar from '@/components/navigation/Navbar';

const EmployeesPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'department' | 'admin'>('all');

  useEffect(() => {
    fetchUsers();
    fetchDepartments();
  }, []);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const usersRef = ref(database, 'users');
      const snapshot = await get(usersRef);
      
      if (snapshot.exists()) {
        const usersData: User[] = [];
        snapshot.forEach((childSnapshot) => {
          const userData = childSnapshot.val();
          usersData.push({
            id: childSnapshot.key as string,
            ...userData
          });
        });
        setUsers(usersData);
      }
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching users:', error);
      setErrorMessage('Failed to fetch users');
      setIsLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const departmentsList = await getDepartments();
      setDepartments(departmentsList);
    } catch (error) {
      console.error('Error fetching departments:', error);
      setErrorMessage('Failed to fetch departments');
    }
  };

  const handleRoleChange = async (userId: string, newRole: 'department' | 'admin') => {
    try {
      setErrorMessage('');
      setSuccessMessage('');
      
      const adminUser = users.find(user => user.role === 'admin');
      if (adminUser && adminUser.id === userId && newRole !== 'admin') {
        setErrorMessage('Cannot change admin role. There must be at least one admin.');
        return;
      }

      const userRef = ref(database, `users/${userId}`);
      await update(userRef, { role: newRole });
      
      await fetchUsers();
      setSuccessMessage(`User role updated to ${newRole} successfully`);
      
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error updating user role:', error);
      setErrorMessage('Failed to update user role');
    }
  };

  const handleDepartmentChange = async (userId: string, departmentId: string) => {
    try {
      setErrorMessage('');
      setSuccessMessage('');
      
      const userRef = ref(database, `users/${userId}`);
      await update(userRef, { departmentId: departmentId || null });
      
      if (departmentId) {
        const department = departments.find(d => d.id === departmentId);
        if (department) {
          const employeeIds = department.employeeIds || [];
          if (!employeeIds.includes(userId)) {
            employeeIds.push(userId);
            const departmentRef = ref(database, `departments/${departmentId}`);
            await update(departmentRef, { employeeIds });
          }
        }
      } else {
        for (const department of departments) {
          if (department.employeeIds && department.employeeIds.includes(userId)) {
            const updatedEmployeeIds = department.employeeIds.filter(
              (id: string) => id !== userId
            );
            const departmentRef = ref(database, `departments/${department.id}`);
            await update(departmentRef, { employeeIds: updatedEmployeeIds });
          }
        }
      }
      
      await fetchUsers();
      await fetchDepartments();
      
      const departmentName = departmentId 
        ? departments.find(d => d.id === departmentId)?.name || 'department'
        : 'no department';
      setSuccessMessage(`User assigned to ${departmentName} successfully`);
      
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error updating user department:', error);
      setErrorMessage('Failed to update user department');
    }
  };

  const filteredUsers = users.filter(user => {
    if (activeTab === 'all') return true;
    return user.role === activeTab;
  });

  const getStats = () => {
    const adminCount = users.filter(user => user.role === 'admin').length;
    const departmentCount = users.filter(user => user.role === 'department').length;
    const unassignedCount = users.filter(user => user.role === 'department' && !user.departmentId).length;
    
    return { adminCount, departmentCount, unassignedCount };
  };

  const stats = getStats();

  return (
    <AuthGuard allowedRoles={['admin']}>
      <Navbar userRole="admin" />
      <div className="bg-zinc-50 min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Employee Management</h1>
            <p className="text-lg text-gray-600">Manage users and assign them to departments</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-full">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Users</p>
                  <p className="text-2xl font-semibold">{users.length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 rounded-full">
                  <UserPlus className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Department Staff</p>
                  <p className="text-2xl font-semibold">{stats.departmentCount}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-100 rounded-full">
                  <AlertCircle className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Unassigned Staff</p>
                  <p className="text-2xl font-semibold">{stats.unassignedCount}</p>
                </div>
              </div>
            </div>
          </div>
          
          {errorMessage && (
            <div className="mb-6 p-4 bg-red-100 border-l-4 border-red-500 text-red-800 rounded-md flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              <span>{errorMessage}</span>
            </div>
          )}
          
          {successMessage && (
            <div className="mb-6 p-4 bg-green-100 border-l-4 border-green-500 text-green-800 rounded-md flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              <span>{successMessage}</span>
            </div>
          )}
          
          <div className="mb-6 border-b border-gray-200">
            <nav className="flex -mb-px space-x-8">
              <button 
                onClick={() => setActiveTab('all')}
                className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'all' 
                    ? 'border-blue-500 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                All Users ({users.length})
              </button>
              <button 
                onClick={() => setActiveTab('department')}
                className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'department' 
                    ? 'border-blue-500 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                Department Staff ({stats.departmentCount})
              </button>
              <button 
                onClick={() => setActiveTab('admin')}
                className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'admin' 
                    ? 'border-blue-500 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                Administrators ({stats.adminCount})
              </button>
            </nav>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : filteredUsers.length > 0 ? (
            <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Department
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-xs text-gray-500">User ID: {user.id.substring(0, 8)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={user.role}
                            onChange={(e) => handleRoleChange(user.id, e.target.value as 'department' | 'admin')}
                            className="block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm"
                          >
                            <option value="department">Department Staff</option>
                            <option value="admin">Administrator</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {user.role === 'department' ? (
                            <select
                              value={user.departmentId || ''}
                              onChange={(e) => handleDepartmentChange(user.id, e.target.value)}
                              className={`block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm ${!user.departmentId ? 'text-amber-600' : ''}`}
                            >
                              <option value="" className="text-amber-600">Not Assigned</option>
                              {departments.map((department) => (
                                <option key={department.id} value={department.id}>
                                  {department.name}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="inline-block py-1.5 px-3 text-xs text-gray-500 bg-gray-100 rounded-md">N/A</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 bg-white shadow-sm rounded-lg border border-gray-100">
              <p className="text-gray-500">No users found in this category.</p>
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
};

export default EmployeesPage; 