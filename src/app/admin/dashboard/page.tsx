'use client';

import React, { useEffect, useState } from 'react';
import { getDepartments } from '@/services/departmentService';
import { calculateEmployeePerformance } from '@/services/taskService';
import { Department, EmployeePerformance } from '@/models/types';
import AuthGuard from '@/components/auth/AuthGuard';
import Navbar from '@/components/navigation/Navbar';

const AdminDashboard = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [performanceData, setPerformanceData] = useState<EmployeePerformance[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const departmentsList = await getDepartments();
        setDepartments(departmentsList);
        setIsLoading(false);
        
        if (departmentsList.length > 0) {
          setSelectedDepartment(departmentsList[0].id);
        }
      } catch (error) {
        console.error('Error fetching departments:', error);
        setIsLoading(false);
      }
    };
    
    fetchDepartments();
  }, []);

  useEffect(() => {
    const fetchPerformanceData = async () => {
      if (!selectedDepartment) return;
      
      try {
        setIsLoading(true);
        const performance = await calculateEmployeePerformance(selectedDepartment);
        setPerformanceData(performance);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching performance data:', error);
        setIsLoading(false);
      }
    };
    
    fetchPerformanceData();
  }, [selectedDepartment]);

  const handleDepartmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedDepartment(e.target.value);
  };

  return (
    <AuthGuard allowedRoles={['admin']}>
      <Navbar userRole="admin" />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Department
          </label>
          <select
            value={selectedDepartment}
            onChange={handleDepartmentChange}
            className="block w-full max-w-md rounded-md border-0 py-2 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm"
          >
            {departments.map((department) => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
          </select>
        </div>
        
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Employee Performance</h2>
          
          {isLoading ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : performanceData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Employee
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tasks Completed
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Work Time (min)
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Avg. Completion Time (min)
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {performanceData
                    .sort((a, b) => b.tasksCompleted - a.tasksCompleted)
                    .map((performance) => (
                      <tr key={performance.employeeId}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{performance.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{performance.tasksCompleted}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{Math.round(performance.totalWorkTime)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {Math.round(performance.averageCompletionTime) || 'N/A'}
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              No performance data available for this department
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
};

export default AdminDashboard; 