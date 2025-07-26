'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getDepartments } from '@/services/departmentService';
import { createTask, assignTask } from '@/services/taskService';
import { Department, CommonProblem } from '@/models/types';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Navbar from '@/components/navigation/Navbar';
import { ref, push, set, get, query, orderByChild, equalTo, onValue } from 'firebase/database';
import { database } from '@/firebase/config';
import { StagewiseLoader } from './_stagewise';

export default function Home() {
  const { user } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [guestName, setGuestName] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    departmentId: '',
    roomNumber: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  // New state for handling department and problem selection
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [selectedProblem, setSelectedProblem] = useState<CommonProblem | null>(null);
  const [roomNumber, setRoomNumber] = useState('');
  const [showRoomPrompt, setShowRoomPrompt] = useState(false);
  
  // New state for department service requests
  const [departmentRequests, setDepartmentRequests] = useState<any[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);

  useEffect(() => {
    fetchDepartments();
  }, []);
  
  // New effect to fetch department requests when a department is selected
  useEffect(() => {
    if (selectedDepartment && selectedDepartment.id) {
      fetchDepartmentRequests(selectedDepartment.id);
    }
  }, [selectedDepartment]);

  const fetchDepartments = async () => {
    try {
      const departmentsList = await getDepartments();
      setDepartments(departmentsList);
      
      if (departmentsList.length > 0) {
        setFormData(prev => ({
          ...prev,
          departmentId: departmentsList[0].id
        }));
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching departments:', error);
      setIsLoading(false);
    }
  };
  
  // New function to fetch service requests for a department
  const fetchDepartmentRequests = async (departmentId: string) => {
    try {
      setIsLoadingRequests(true);
      
      // Fetch all guest requests and filter on client side instead of using a query
      // This avoids the need for a Firebase index on departmentId
      const requestsRef = ref(database, 'guestRequests');
      
      const snapshot = await get(requestsRef);
      const requests: any[] = [];
      
      if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
          const request = childSnapshot.val();
          // Filter by departmentId on the client side
          if (request.departmentId === departmentId) {
            requests.push({
              id: childSnapshot.key,
              ...request
            });
          }
        });
      }
      
      setDepartmentRequests(requests.filter(req => req.status === 'pending'));
      setIsLoadingRequests(false);
    } catch (error) {
      console.error('Error fetching department requests:', error);
      setIsLoadingRequests(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleDepartmentSelect = (department: Department) => {
    setSelectedDepartment(department);
    setSelectedProblem(null);
    setShowRoomPrompt(false);
  };
  
  const handleProblemSelect = (problem: CommonProblem) => {
    setSelectedProblem(problem);
    setShowRoomPrompt(true);
  };
  
  const handleRoomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedDepartment || !selectedProblem) return;
    
    try {
      setIsSubmitting(true);
      
      // Create a guest request reference
      const guestRequestsRef = ref(database, 'guestRequests');
      const newRequestRef = push(guestRequestsRef);
      const requestId = newRequestRef.key;
      
      // Save the guest request
      await set(newRequestRef, {
        title: selectedProblem.title,
        roomNumber: roomNumber,
        departmentId: selectedDepartment.id,
        guestName: guestName || 'Anonymous Guest',
        status: 'pending',
        createdAt: new Date().toISOString()
      });
      
      // Assign the task to an employee in the department if possible
      if (requestId) {
        try {
          await assignTask(requestId, selectedDepartment.id);
        } catch (error) {
          console.error('Error assigning task:', error);
          // Continue even if assignment fails
        }
      }
      
      // Reset form and show success message
      setRoomNumber('');
      setGuestName('');
      setSelectedDepartment(null);
      setSelectedProblem(null);
      setShowRoomPrompt(false);
      
      setSuccessMessage('თქვენი მოთხოვნა წარმატებით გაიგზავნა!');
      setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
    } catch (error) {
      console.error('Error submitting request:', error);
      alert('Error submitting request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleBackToProblems = () => {
    setSelectedProblem(null);
    setShowRoomPrompt(false);
  };
  
  const handleBackToDepartments = () => {
    setSelectedDepartment(null);
    setSelectedProblem(null);
    setShowRoomPrompt(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);
      setSuccessMessage('');
      
      // Create a guest request reference
      const guestRequestsRef = ref(database, 'guestRequests');
      const newRequestRef = push(guestRequestsRef);
      const requestId = newRequestRef.key;
      
      // Save the guest request
      await set(newRequestRef, {
        title: formData.title,
        roomNumber: formData.roomNumber,
        departmentId: formData.departmentId,
        guestName: guestName,
        status: 'pending',
        createdAt: new Date().toISOString()
      });
      
      // Assign the task to an employee in the department if possible
      if (requestId) {
        try {
          await assignTask(requestId, formData.departmentId);
        } catch (error) {
          console.error('Error assigning task:', error);
          // Continue even if assignment fails
        }
      }
      
      // Reset form and show success message
      setFormData({
        title: '',
        departmentId: departments.length > 0 ? departments[0].id : '',
        roomNumber: ''
      });
      setGuestName('');
      
      setSuccessMessage('თქვენი მოთხოვნა წარმატებით გაიგზავნა!');
      setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
    } catch (error) {
      console.error('Error submitting request:', error);
      alert('Error submitting request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Admin and department staff see different interface
  if (user) {
    return (
      <main>
        <Navbar userRole={user.role} />
        
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">HotelTasker</h1>
              <p className="text-lg text-gray-600">
                {user.role === 'admin' ? 
                  'Welcome to the admin dashboard.' : 
                  'Welcome to the department staff portal.'}
              </p>
            </div>
            
            <div className="bg-white shadow-md rounded-lg p-6">
              {user.role === 'admin' && (
                <div className="text-center">
                  <Button onClick={() => window.location.href = '/admin/dashboard'}>
                    Go to Admin Dashboard
                  </Button>
                </div>
              )}
              
              {user.role === 'department' && (
                <div className="text-center">
                  <Button onClick={() => window.location.href = '/tasks'}>
                    View My Tasks
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Guest interface
  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar userRole={null} onBackClick={handleBackToDepartments} />
      <StagewiseLoader />
      
      <div className="container mx-auto px-3 py-3 sm:px-4 sm:py-4">
        <div className="max-w-4xl mx-auto min-h-[calc(100vh-120px)] flex flex-col justify-center">
          {!selectedDepartment && (
            <>
              <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-gray-900 mb-2">აპარტამენტები</h1>
              </div>
              
              {successMessage && (
                <div className="mb-6 p-4 bg-green-100 text-green-800 rounded-md text-center">
                  {successMessage}
                </div>
              )}
            
              <div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                  {departments.map(department => (
                    <div 
                      key={department.id}
                      className="transform transition duration-300 hover:scale-105 cursor-pointer"
                      onClick={() => handleDepartmentSelect(department)}
                    >
                      <div className="bg-white rounded-xl shadow-lg p-3 sm:p-4 md:p-6 h-full border border-gray-100 relative overflow-hidden transform transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-blue-100 opacity-50"></div>
                        <div className="relative z-10">
                          <h3 className="text-xl font-bold text-gray-900 mb-2">{department.name}</h3>
                          <p className="text-gray-600 mb-4">{department.description}</p>
                          {department.commonProblems && department.commonProblems.length > 0 ? (
                            <p className="text-sm text-blue-600">{department.commonProblems.length} ხშირი პრობლემა</p>
                          ) : (
                            <p className="text-sm text-gray-500">პრობლემები არ არის განსაზღვრული</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-8 text-center">
                  <p className="text-gray-500 text-sm">
                    გჭირდებათ სხვა რამ? <a href="/auth/signin" className="text-blue-600 hover:underline">პერსონალის შესვლა</a>
                  </p>
                </div>
              </div>
            </>
          )}
          
          {selectedDepartment && !showRoomPrompt && (
            <div className="bg-gradient-to-br from-blue-50 via-white to-blue-50 shadow-lg rounded-lg p-6 backdrop-blur-sm border border-blue-100 h-auto max-h-[90vh] my-2 overflow-auto">
              <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-gray-900 mb-2">{selectedDepartment.name}</h1>
              </div>
              
              <div className="flex justify-between items-center mb-4">
                <button 
                  onClick={handleBackToDepartments}
                  className="text-blue-600 hover:underline flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  დეპარტამენტებში დაბრუნება
                </button>
              </div>
              
              {/* Show pending service requests for this department */}
              {!isLoadingRequests && (
                <div className="mb-6">
                  <h2 className="text-xl font-semibold mb-3">აქტიური მოთხოვნები ({departmentRequests.length})</h2>
                  <div className="max-h-[200px] overflow-y-auto bg-white rounded-lg border border-gray-200 p-3">
                    {departmentRequests.length > 0 ? (
                      <ul className="space-y-2">
                        {departmentRequests.map(request => (
                          <li key={request.id} className="border-b border-gray-100 pb-2 last:border-b-0">
                            <div className="flex justify-between">
                              <div>
                                <p className="font-medium">{request.title}</p>
                                <p className="text-sm text-gray-600">ოთახი: {request.roomNumber}</p>
                                {request.guestName && <p className="text-sm text-gray-600">სტუმარი: {request.guestName}</p>}
                                <p className="text-xs text-gray-500">{new Date(request.createdAt).toLocaleString('ka-GE')}</p>
                              </div>
                              <div>
                                <span className="inline-block px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                                  მოლოდინში
                                </span>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-center text-gray-500 py-4">მოთხოვნები არ არის</p>
                    )}
                  </div>
                </div>
              )}
              
              {isLoadingRequests && (
                <div className="flex justify-center items-center my-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              )}
              
              {selectedDepartment.commonProblems && selectedDepartment.commonProblems.length > 0 ? (
                <>
                  <div className="max-h-[400px] overflow-y-auto">
                    <ul className="space-y-4">
                      {selectedDepartment.commonProblems.map(problem => (
                        <li 
                          key={problem.id}
                          className="bg-white hover:bg-blue-50 rounded-xl p-5 cursor-pointer transform transition-all duration-300 hover:-translate-y-1 shadow-md hover:shadow-xl border border-gray-100"
                          onClick={() => handleProblemSelect(problem)}
                        >
                          <h4 className="text-lg font-medium text-gray-900">{problem.title}</h4>
                        </li>
                      ))}
                    </ul>
                  </div>
                
                  <div className="mt-8 pt-6 border-t border-gray-200">
                    
                    <button 
                      onClick={() => handleProblemSelect({
                        id: 'custom',
                        title: 'Custom Problem',
                        description: ''
                      })}
                      className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition duration-200 shadow-md hover:shadow-lg flex items-center justify-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      მოთხოვნის გაგზავნა
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">ამ დეპარტამენტისთვის არ არის განსაზღვრული პრობლემები.</p>
                  <p className="text-gray-500 mt-2">გთხოვთ გამოიყენოთ ქვემოთ მოცემული ფორმა.</p>
                </div>
              )}
              
              {(!selectedDepartment.commonProblems || selectedDepartment.commonProblems.length === 0) && (
                <form onSubmit={handleSubmit} className="space-y-4 mt-6 border-t pt-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      თქვენი სახელი
                    </label>
                    <Input
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      placeholder="Enter your name"
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ოთახის ნომერი
                    </label>
                    <Input
                      name="roomNumber"
                      value={formData.roomNumber}
                      onChange={handleInputChange}
                      placeholder="e.g., 101"
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      მოთხოვნის აღწერა
                    </label>
                    <Input
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder="მაგ., გაფუჭებული ვენტილატორი საჭიროებს შეცვლას"
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                  
                  <Button type="submit" fullWidth disabled={isSubmitting}>
                    {isSubmitting ? 'იგზავნება...' : 'გაგზავნა'}
                  </Button>
                </form>
              )}
            </div>
          )}
          
          {showRoomPrompt && selectedProblem && (
            <div className="bg-gradient-to-br from-blue-50 via-white to-blue-50 shadow-lg rounded-lg p-6 backdrop-blur-sm border border-blue-100 h-auto max-h-[90vh] my-2 overflow-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold">მოთხოვნის გაგზავნა</h2>
                <button 
                  onClick={handleBackToProblems}
                  className="text-blue-600 hover:underline flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  უკან
                </button>
              </div>
              
              <div className="mb-6 bg-blue-50 p-4 rounded-lg shadow-inner border border-blue-100">
                <p className="font-medium">არჩეული პრობლემა:</p>
                <p className="text-lg">{selectedProblem.title === 'Custom Problem' ? 'სხვა მოთხოვნა' : selectedProblem.title}</p>
              </div>
              
              <form onSubmit={handleRoomSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    თქვენი სახელი (არჩევითი)
                  </label>
                  <Input
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="Enter your name"
                    disabled={isSubmitting}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ოთახის ნომერი
                  </label>
                  <Input
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                    placeholder="e.g., 101"
                    disabled={isSubmitting}
                    required
                  />
                </div>
                
                {selectedProblem.id === 'custom' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      პრობლემის აღწერა
                    </label>
                    <textarea
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      placeholder="გთხოვთ, აღწეროთ თქვენი პრობლემა დეტალურად"
                      rows={4}
                      className="block w-full rounded-md border-0 py-2 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm"
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                )}
                
                <Button type="submit" fullWidth disabled={isSubmitting} className="mt-2">
                  {isSubmitting ? 'იგზავნება...' : 'გაგზავნა'}
                </Button>
              </form>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
