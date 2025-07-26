'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getTasksByAssignee, completeTask, acceptTaskAssignment, rejectTaskAssignment, subscribeToTasks, subscribeToGuestRequests, acceptGuestRequest } from '@/services/taskService';
import { getDepartmentById } from '@/services/departmentService';
import { Task, Department, GuestRequest } from '@/models/types';
import AuthGuard from '@/components/auth/AuthGuard';
import Button from '@/components/ui/Button';
import Navbar from '@/components/navigation/Navbar';
import MobileTabBar from '@/components/navigation/MobileTabBar';

const TasksPage = () => {
  const { user } = useAuth();
  const [assignedTasks, setAssignedTasks] = useState<Task[]>([]);
  const [pendingTasks, setPendingTasks] = useState<Task[]>([]);
  const [completedTasks, setCompletedTasks] = useState<Task[]>([]);
  const [departmentTasks, setDepartmentTasks] = useState<Task[]>([]);
  const [departmentRequests, setDepartmentRequests] = useState<GuestRequest[]>([]);
  const [department, setDepartment] = useState<Department | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'archive'>('active');

  const fetchTasks = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);
      
      console.log("Fetching tasks for user:", user.id);
      const tasks = await getTasksByAssignee(user.id);
      console.log("Tasks loaded:", tasks.length);
      
      // Filter tasks by status
      const pending = tasks.filter(task => task.status === 'assigned');
      const inProgress = tasks.filter(task => task.status === 'in_progress');
      const completed = tasks.filter(task => task.status === 'completed');
      
      console.log(`Tasks by status: Pending: ${pending.length}, In Progress: ${inProgress.length}, Completed: ${completed.length}`);
      
      setPendingTasks(pending);
      setAssignedTasks(inProgress);
      setCompletedTasks(completed);
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setError("შეცდომა დავალებების ჩატვირთვისას");
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      console.log("User not logged in or data not loaded yet");
      return;
    }
    
    if (!user.departmentId) {
      console.error("User missing departmentId:", user);
      setError("ვერ მოხერხდა დეპარტამენტის იდენტიფიცირება. გთხოვთ დაუკავშირდეთ ადმინისტრატორს.");
      setIsLoading(false);
      return;
    }
    
    console.log("Loading tasks for user:", user.id, "department:", user.departmentId);
    fetchTasks();
    fetchDepartment(user.departmentId);
    
    // Subscribe to regular tasks
    const unsubscribeTasks = subscribeToTasks((tasks) => {
      try {
        // Filter tasks that belong to the user's department
        console.log("Real-time tasks update received, total tasks:", tasks.length);
        const deptTasks = tasks.filter(task => 
          task.departmentId === user.departmentId && task.status === 'pending'
        );
        console.log("Department tasks filtered:", deptTasks.length);
        setDepartmentTasks(deptTasks);
      } catch (err) {
        console.error("Error in real-time tasks subscription:", err);
      }
    });
    
    // Subscribe to guest requests
    const unsubscribeRequests = subscribeToGuestRequests((requests) => {
      try {
        console.log("Real-time guest requests update received, total requests:", requests.length);
        // Filter requests for this department and pending status
        const deptRequests = requests.filter(request => 
          request.departmentId === user.departmentId && request.status === 'pending'
        );
        console.log("Department guest requests filtered:", deptRequests.length);
        setDepartmentRequests(deptRequests);
      } catch (err) {
        console.error("Error in real-time guest requests subscription:", err);
      }
    });
    
    return () => {
      console.log("Cleaning up subscriptions");
      unsubscribeTasks();
      unsubscribeRequests();
    };
  }, [user, fetchTasks]);
  
  const fetchDepartment = async (departmentId: string) => {
    try {
      console.log("Fetching department:", departmentId);
      
      // Handle the specific problematic department ID
      if (departmentId === "-OW6Gc3JDsL1B02do5fG") {
        console.log("Using fallback for known problematic department ID");
        setDepartment({
          id: departmentId,
          name: "დეპარტამენტი",
          description: "",
          employeeIds: [],
          createdAt: new Date().toISOString(),
          commonProblems: []
        });
        return;
      }
      
      const departmentData = await getDepartmentById(departmentId);
      if (departmentData) {
        console.log("Department loaded:", departmentData.name);
        setDepartment(departmentData);
      } else {
        console.error("Department not found:", departmentId);
        // Create a fallback department object to prevent errors
        setDepartment({
          id: departmentId,
          name: "დეპარტამენტი",
          description: "",
          employeeIds: [],
          createdAt: new Date().toISOString(),
          commonProblems: []
        });
      }
    } catch (error) {
      console.error('Error fetching department:', error);
      // Create a fallback department object to prevent errors
      setDepartment({
        id: departmentId,
        name: "დეპარტამენტი",
        description: "",
        employeeIds: [],
        createdAt: new Date().toISOString(),
        commonProblems: []
      });
    }
  };

  const handleAcceptTask = async (taskId: string) => {
    if (!user) return;
    
    try {
      await acceptTaskAssignment(taskId, user.id);
      fetchTasks();
    } catch (error) {
      console.error('Error accepting task:', error);
      alert('დავალების მიღება ვერ მოხერხდა. შესაძლოა ვადა ამოიწურა ან დაენიშნა სხვა თანამშრომელს.');
    }
  };

  const handleRejectTask = async (taskId: string) => {
    if (!user) return;
    
    try {
      await rejectTaskAssignment(taskId, user.id);
      fetchTasks();
    } catch (error) {
      console.error('Error rejecting task:', error);
      alert('შეცდომა დავალების უარყოფისას');
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    if (!user) return;
    
    try {
      await completeTask(taskId, user.id);
      fetchTasks();
    } catch (error) {
      console.error('Error completing task:', error);
      alert('დავალების დასრულება ვერ მოხერხდა.');
    }
  };
  
  // Add new function to handle guest request acceptance
  const handleAcceptGuestRequest = async (requestId: string) => {
    if (!user) return;
    
    try {
      await acceptGuestRequest(requestId, user.id);
      fetchTasks(); // Refresh tasks to show newly created task
      
      // Guest request list will auto-update via subscription
    } catch (error) {
      console.error('Error accepting guest request:', error);
      alert('მოთხოვნის მიღება ვერ მოხერხდა.');
    }
  };

  const renderTaskCard = (task: Task) => {
    return (
      <div key={task.id} className="bg-white shadow rounded-lg p-4 mb-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-medium text-gray-900">{task.title}</h3>
            <p className="text-sm text-gray-500">ოთახი: {task.roomNumber}</p>
            <p className="text-sm text-gray-500">
              შექმნილია: {new Date(task.createdAt).toLocaleString('ka-GE')}
            </p>
            {task.startTime && (
              <p className="text-sm text-gray-500">
                დაწყებულია: {new Date(task.startTime).toLocaleString('ka-GE')}
              </p>
            )}
            {task.endTime && (
              <p className="text-sm text-gray-500">
                დასრულებულია: {new Date(task.endTime).toLocaleString('ka-GE')}
              </p>
            )}
          </div>
          <div>
            {task.status === 'assigned' && (
              <div className="flex space-x-2">
                <Button onClick={() => handleAcceptTask(task.id)}>მიღება</Button>
                <Button onClick={() => handleRejectTask(task.id)} danger>უარყოფა</Button>
              </div>
            )}
            {task.status === 'in_progress' && (
              <Button onClick={() => handleCompleteTask(task.id)}>დასრულება</Button>
            )}
            {task.status === 'completed' && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                დასრულებული
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };
  
  const renderDepartmentTask = (task: Task) => {
    return (
      <div key={task.id} className="bg-white shadow rounded-lg p-4 mb-4 border-l-4 border-orange-400">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-medium text-gray-900">{task.title}</h3>
            <p className="text-sm text-gray-500">ოთახი: {task.roomNumber}</p>
            <p className="text-sm text-gray-500">
              მოთხოვნილია: {new Date(task.createdAt).toLocaleString('ka-GE')}
            </p>
            <div className="mt-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                მიმდინარეობს თანამშრომლის მინიჭება
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Add new render function for guest requests
  const renderGuestRequest = (request: GuestRequest) => {
    return (
      <div key={request.id} className="bg-white shadow rounded-lg p-4 mb-4 border-l-4 border-green-400">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-medium text-gray-900">{request.title}</h3>
            <p className="text-sm text-gray-500">ოთახი: {request.roomNumber}</p>
            {request.guestName && <p className="text-sm text-gray-500">სტუმარი: {request.guestName}</p>}
            <p className="text-sm text-gray-500">
              მოთხოვნილია: {new Date(request.createdAt).toLocaleString('ka-GE')}
            </p>
            <div className="mt-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                მოთხოვნა სტუმრისგან
              </span>
            </div>
          </div>
          <div>
            <Button 
              onClick={() => handleAcceptGuestRequest(request.id)}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded"
            >
              დადასტურება
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const handleTabChange = (tab: 'active' | 'archive') => {
    setActiveTab(tab);
  };

  // Render active tasks section (My Tasks)
  const renderActiveTasksSection = () => {
    return (
      <>
        {!isLoading && !error && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">
              დეპარტამენტის შემომავალი მოთხოვნები ({departmentTasks.length + departmentRequests.length})
            </h2>
            
            {(departmentTasks.length > 0 || departmentRequests.length > 0) ? (
              <>
                <div className="bg-orange-50 p-4 rounded-lg mb-4">
                  <p>ეს მოთხოვნები ავტომატურად ნაწილდება თანამშრომლებზე დატვირთვის მიხედვით.</p>
                </div>
                {departmentTasks.map(renderDepartmentTask)}
                {departmentRequests.map(renderGuestRequest)}
              </>
            ) : (
              <p className="text-gray-500 text-center p-4 bg-gray-50 rounded-lg">
                ახალი მოთხოვნები არ არის
              </p>
            )}
          </div>
        )}

        <div className="space-y-4">
          {pendingTasks.length > 0 && (
            <>
              {pendingTasks.map(renderTaskCard)}
            </>
          )}
          
          {assignedTasks.length > 0 && (
            <>
              {assignedTasks.map(renderTaskCard)}
            </>
          )}
          
          {pendingTasks.length === 0 && assignedTasks.length === 0 && (
            <p className="text-gray-500 text-center p-4 bg-gray-50 rounded-lg">
              აქტიური დავალებები არ არის
            </p>
          )}
        </div>
      </>
    );
  };

  // Render archive section (Completed tasks)
  const renderArchiveSection = () => {
    return (
      <div>
        <h2 className="text-xl font-semibold mb-4">დასრულებული დავალებები</h2>
        {completedTasks.length > 0 ? (
          completedTasks.map(renderTaskCard)
        ) : (
          <p className="text-gray-500 text-center p-4 bg-gray-50 rounded-lg">დასრულებული დავალებები არ არის</p>
        )}
      </div>
    );
  };

  return (
    <AuthGuard allowedRoles={['department']}>
      <Navbar userRole="department" />
      <div className="container mx-auto px-4 py-8 pb-20 sm:pb-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">ჩემი დავალებები</h1>
          {department && (
            <div className="text-lg text-gray-600">დეპარტამენტი: {department.name}</div>
          )}
        </div>
        
        {error && (
          <div className="mb-6 p-4 bg-red-100 text-red-800 rounded-md text-center">
            {error}
          </div>
        )}
        
        {isLoading ? (
          <div className="flex flex-col justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            <p className="mt-4 text-gray-600">იტვირთება დავალებები...</p>
          </div>
        ) : (
          <>
            {/* Mobile view with tabs */}
            <div className="sm:hidden">
              {activeTab === 'active' ? renderActiveTasksSection() : renderArchiveSection()}
            </div>
            
            {/* Desktop view with columns */}
            <div className="hidden sm:grid sm:grid-cols-3 sm:gap-6">
              <div className="col-span-2">
                <h2 className="text-xl font-semibold mb-4">შემოსული დავალებები</h2>
                {pendingTasks.length > 0 || assignedTasks.length > 0 ? (
                  <div className="space-y-4">
                    {pendingTasks.map(renderTaskCard)}
                    {assignedTasks.map(renderTaskCard)}
                  </div>
                ) : (
                  <p className="text-gray-500">აქტიური დავალებები არ არის</p>
                )}
              </div>
              
              <div>
                <h2 className="text-xl font-semibold mb-4">დასრულებული</h2>
                {completedTasks.length > 0 ? (
                  completedTasks.map(renderTaskCard)
                ) : (
                  <p className="text-gray-500">დასრულებული დავალებები არ არის</p>
                )}
              </div>
            </div>
          </>
        )}
      </div>
      
      {/* Mobile Bottom Tab Bar */}
      <MobileTabBar activeTab={activeTab} onTabChange={handleTabChange} />
    </AuthGuard>
  );
};

export default TasksPage; 