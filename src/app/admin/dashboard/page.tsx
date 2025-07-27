'use client';

import React, { useEffect, useState, useRef } from 'react';
import { getDepartments } from '@/services/departmentService';
import { calculateEmployeePerformance, subscribeToTasks } from '@/services/taskService';
import { Department, EmployeePerformance, Task } from '@/models/types';
import AuthGuard from '@/components/auth/AuthGuard';
import Navbar from '@/components/navigation/Navbar';

const AdminDashboard = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [performanceData, setPerformanceData] = useState<EmployeePerformance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // სტატუსის მონიტორინგისთვის
  const [activeTasks, setActiveTasks] = useState<Task[]>([]);
  const [employeeStatuses, setEmployeeStatuses] = useState<Record<string, {
    isWorking: boolean;
    currentTask?: Task;
  }>>({});
  
  // useRef გამოვიყენოთ მდგომარეობების შესანახად, რომ თავიდან ავიცილოთ უსასრულო განახლებები
  const performanceDataRef = useRef<EmployeePerformance[]>([]);
  const selectedDepartmentRef = useRef<string>('');

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
  
  // განვაახლოთ ref-ები, როდესაც შესაბამისი მდგომარეობები იცვლება
  useEffect(() => {
    performanceDataRef.current = performanceData;
  }, [performanceData]);
  
  useEffect(() => {
    selectedDepartmentRef.current = selectedDepartment;
  }, [selectedDepartment]);

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
  
  // რეალურ დროში დავალებების მონიტორინგი
  useEffect(() => {
    if (!selectedDepartment) return;
    
    const unsubscribeTasks = subscribeToTasks((tasks) => {
      try {
        // ფილტრავს დავალებებს მიმდინარე დეპარტამენტისთვის და მიმდინარე სტატუსით
        const deptActiveTasks = tasks.filter(task => 
          task.departmentId === selectedDepartmentRef.current && 
          task.status === 'in_progress'
        );
        
        console.log("Active tasks:", deptActiveTasks.length);
        setActiveTasks(deptActiveTasks);
        
        // განვაახლოთ თანამშრომლების სტატუსები
        const newEmployeeStatuses: Record<string, { isWorking: boolean; currentTask?: Task }> = {};
        
        // ჯერ ყველა თანამშრომელს დავაყენოთ არამუშა სტატუსი
        performanceDataRef.current.forEach(employee => {
          newEmployeeStatuses[employee.employeeId] = { isWorking: false };
        });
        
        // შემდეგ განვაახლოთ იმ თანამშრომლების სტატუსი, რომლებიც მუშაობენ დავალებებზე
        deptActiveTasks.forEach(task => {
          if (task.assignedTo) {
            console.log(`Task ${task.id} assigned to employee ${task.assignedTo}`);
            // შევამოწმოთ, არის თუ არა ეს თანამშრომელი ჩვენი დეპარტამენტის წევრი
            if (performanceDataRef.current.some(emp => emp.employeeId === task.assignedTo)) {
              newEmployeeStatuses[task.assignedTo] = {
                isWorking: true,
                currentTask: task
              };
            }
          }
        });
        
        console.log("Employee statuses:", newEmployeeStatuses);
        setEmployeeStatuses(newEmployeeStatuses);
      } catch (err) {
        console.error("Error in real-time tasks subscription:", err);
      }
    });
    
    return () => {
      unsubscribeTasks();
    };
  }, [selectedDepartment]); // მხოლოდ selectedDepartment-ზე დამოკიდებულება

  const handleDepartmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedDepartment(e.target.value);
  };
  
  // ფუნქცია თანამშრომლის სტატუსის საჩვენებლად
  const renderEmployeeStatus = (employeeId: string) => {
    // ვნახოთ არის თუ არა ამ თანამშრომელზე მიბმული აქტიური დავალება
    const activeTask = activeTasks.find(task => task.assignedTo === employeeId);
    
    // თუ აქტიური დავალება ნაპოვნია, ვაჩვენოთ "მუშაობს" სტატუსი
    if (activeTask) {
      return (
        <div>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 mb-1">
            <svg className="w-3 h-3 mr-1 text-yellow-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
            მუშაობს
          </span>
          <div className="text-xs text-gray-600 truncate max-w-xs">
            {activeTask.title}
          </div>
        </div>
      );
    }
    
    // სხვა შემთხვევაში ვაჩვენოთ "უქმად" სტატუსი
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        <svg className="w-3 h-3 mr-1 text-gray-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
          <circle cx="10" cy="10" r="8" />
        </svg>
        უქმად
      </span>
    );
  };
  
  // ფუნქცია მიმდინარე დავალების სტატუსის საჩვენებლად
  const renderTaskStatus = (task: Task) => {
    if (task.status === 'in_progress') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <svg className="w-3 h-3 mr-1 text-yellow-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
          მიმდინარე
        </span>
      );
    } else if (task.status === 'completed') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <svg className="w-3 h-3 mr-1 text-green-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          დასრულებული
        </span>
      );
    }
    return null;
  };

  return (
    <AuthGuard allowedRoles={['admin']}>
      <Navbar userRole="admin" />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">ადმინისტრატორის პანელი</h1>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            აირჩიეთ დეპარტამენტი
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
          <h2 className="text-xl font-semibold mb-4">თანამშრომლების სტატისტიკა</h2>
          
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
                      თანამშრომელი
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      მიმდინარე სტატუსი
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      დასრულებული დავალებები
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      სამუშაო დრო (წთ)
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      საშ. შესრულების დრო (წთ)
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
                          <div className="text-sm text-gray-900">
                            {renderEmployeeStatus(performance.employeeId)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className="inline-flex items-center justify-center w-6 h-6 mr-2 rounded-full bg-green-100">
                              <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </span>
                            <span className="text-sm text-gray-900">{performance.tasksCompleted}</span>
                          </div>
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
              ამ დეპარტამენტისთვის მონაცემები არ არის
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
};

export default AdminDashboard; 