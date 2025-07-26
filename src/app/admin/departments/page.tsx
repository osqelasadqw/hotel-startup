'use client';

import React, { useState, useEffect } from 'react';
import { getDepartments, createDepartment, updateDepartment, deleteDepartment, addCommonProblemToDepartment, deleteCommonProblem } from '@/services/departmentService';
import { Department, CommonProblem } from '@/models/types';
import AuthGuard from '@/components/auth/AuthGuard';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Navbar from '@/components/navigation/Navbar';

const DepartmentsPage = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingDepartment, setIsAddingDepartment] = useState(false);
  const [editingDepartmentId, setEditingDepartmentId] = useState<string | null>(null);
  const [isManagingProblems, setIsManagingProblems] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  
  const [name, setName] = useState('');
  
  // For managing common problems
  const [problemTitle, setProblemTitle] = useState('');
  const [problemDescription, setProblemDescription] = useState('');

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      setIsLoading(true);
      const departmentsList = await getDepartments();
      setDepartments(departmentsList);
    } catch (error) {
      console.error('Error fetching departments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddDepartment = () => {
    setIsAddingDepartment(true);
    setName('');
    setEditingDepartmentId(null);
    setIsManagingProblems(false);
    setSelectedDepartment(null);
  };

  const handleEditDepartment = (department: Department) => {
    setIsAddingDepartment(false);
    setEditingDepartmentId(department.id);
    setName(department.name);
    setIsManagingProblems(false);
    setSelectedDepartment(null);
  };

  const handleCancel = () => {
    setIsAddingDepartment(false);
    setEditingDepartmentId(null);
    setName('');
    setIsManagingProblems(false);
    setSelectedDepartment(null);
    setProblemTitle('');
    setProblemDescription('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (isAddingDepartment) {
        await createDepartment({
          name,
          description: "", // Empty description
          employeeIds: []
        });
      } else if (editingDepartmentId) {
        await updateDepartment(editingDepartmentId, {
          name,
          description: "" // Empty description
        });
      }
      
      fetchDepartments();
      handleCancel();
    } catch (error) {
      console.error('Error saving department:', error);
    }
  };

  const handleDeleteDepartment = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this department?')) {
      try {
        await deleteDepartment(id);
        fetchDepartments();
      } catch (error) {
        console.error('Error deleting department:', error);
      }
    }
  };
  
  const handleManageProblems = (department: Department) => {
    setIsManagingProblems(true);
    setSelectedDepartment(department);
    setIsAddingDepartment(false);
    setEditingDepartmentId(null);
    setProblemTitle('');
    setProblemDescription('');
  };
  
  const handleAddProblem = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedDepartment) return;
    
    try {
      await addCommonProblemToDepartment(selectedDepartment.id, {
        title: problemTitle,
        description: ""
      });
      
      fetchDepartments();
      setProblemTitle('');
      setProblemDescription('');
      
      // Update the selected department data
      const updatedDepartments = await getDepartments();
      const updated = updatedDepartments.find(d => d.id === selectedDepartment.id);
      if (updated) setSelectedDepartment(updated);
      
    } catch (error) {
      console.error('Error adding common problem:', error);
    }
  };
  
  const handleDeleteProblem = async (problemId: string) => {
    if (!selectedDepartment) return;
    
    if (window.confirm('Are you sure you want to delete this common problem?')) {
      try {
        await deleteCommonProblem(selectedDepartment.id, problemId);
        
        // Update the selected department data
        const updatedDepartments = await getDepartments();
        const updated = updatedDepartments.find(d => d.id === selectedDepartment.id);
        if (updated) setSelectedDepartment(updated);
        
        fetchDepartments();
      } catch (error) {
        console.error('Error deleting common problem:', error);
      }
    }
  };

  return (
    <AuthGuard allowedRoles={['admin']}>
      <Navbar userRole="admin" />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Departments</h1>
          {!isManagingProblems && (
            <Button onClick={handleAddDepartment}>Add Department</Button>
          )}
          {isManagingProblems && (
            <Button onClick={handleCancel} secondary>Back to Departments</Button>
          )}
        </div>
        
        {isManagingProblems && selectedDepartment && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                Common Problems - {selectedDepartment.name}
              </h2>
            </div>
            
            <form onSubmit={handleAddProblem} className="space-y-4 mb-6 p-4 border border-gray-200 rounded">
              <h3 className="text-lg font-medium">Add New Common Problem</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <Input
                  value={problemTitle}
                  onChange={(e) => setProblemTitle(e.target.value)}
                  placeholder="e.g., Broken AC"
                  required
                />
              </div>
              
              <Button type="submit">
                Add Problem
              </Button>
            </form>
            
            <div className="mt-4">
              <h3 className="text-lg font-medium mb-2">Existing Common Problems</h3>
              {selectedDepartment.commonProblems && selectedDepartment.commonProblems.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                  {selectedDepartment.commonProblems.map((problem) => (
                    <li key={problem.id} className="py-3">
                      <div className="flex justify-between">
                        <div>
                          <h4 className="text-md font-medium">{problem.title}</h4>
                        </div>
                        <button
                          onClick={() => handleDeleteProblem(problem.id)}
                          className="text-rose-600 hover:text-rose-900"
                        >
                          Delete
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">No common problems added yet.</p>
              )}
            </div>
          </div>
        )}
        
        {(isAddingDepartment || editingDepartmentId) && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">
              {isAddingDepartment ? 'Add New Department' : 'Edit Department'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              
              <div className="flex space-x-3">
                <Button type="submit">
                  {isAddingDepartment ? 'Add Department' : 'Update Department'}
                </Button>
                <Button onClick={handleCancel} secondary>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        )}
        
        {!isManagingProblems && !isAddingDepartment && !editingDepartmentId && (
          isLoading ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : departments.length > 0 ? (
            <div className="bg-white shadow overflow-hidden rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Employees
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Common Problems
                    </th>
                    <th scope="col" className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {departments.map((department) => (
                    <tr key={department.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{department.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {department.employeeIds ? department.employeeIds.length : 0}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {department.commonProblems ? department.commonProblems.length : 0}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleManageProblems(department)}
                          className="text-green-600 hover:text-green-900 mr-4"
                        >
                          Manage Problems
                        </button>
                        <button
                          onClick={() => handleEditDepartment(department)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteDepartment(department.id)}
                          className="text-rose-600 hover:text-rose-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-4 bg-white shadow rounded-lg">
              <p className="text-gray-500">No departments found. Add your first department!</p>
            </div>
          )
        )}
      </div>
    </AuthGuard>
  );
};

export default DepartmentsPage; 