import { ref, push, set, get, update, remove, onValue, off } from 'firebase/database';
import { database } from '@/firebase/config';
import { Task, TaskAssignment, EmployeePerformance } from '@/models/types';
import { getDepartmentEmployees } from './departmentService';
import { GuestRequest } from '@/models/types';
import { DataSnapshot } from 'firebase/database';

export const createTask = async (task: Omit<Task, 'id' | 'status' | 'createdAt'>): Promise<Task> => {
  try {
    const tasksRef = ref(database, 'tasks');
    const newTaskRef = push(tasksRef);
    const id = newTaskRef.key as string;
    
    const newTask: Task = {
      ...task,
      id,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    
    await set(newTaskRef, newTask);
    return newTask;
  } catch (error) {
    console.error('Error creating task:', error);
    throw error;
  }
};

export const getTasks = async (): Promise<Task[]> => {
  try {
    const tasksRef = ref(database, 'tasks');
    const snapshot = await get(tasksRef);
    
    if (!snapshot.exists()) {
      return [];
    }
    
    const tasks: Task[] = [];
    snapshot.forEach((childSnapshot) => {
      tasks.push(childSnapshot.val() as Task);
    });
    
    return tasks;
  } catch (error) {
    console.error('Error fetching tasks:', error);
    throw error;
  }
};

export const getTasksByDepartment = async (departmentId: string): Promise<Task[]> => {
  try {
    const tasksRef = ref(database, 'tasks');
    const snapshot = await get(tasksRef);
    
    if (!snapshot.exists()) {
      return [];
    }
    
    const tasks: Task[] = [];
    snapshot.forEach((childSnapshot) => {
      const task = childSnapshot.val() as Task;
      if (task.departmentId === departmentId) {
        tasks.push(task);
      }
    });
    
    return tasks;
  } catch (error) {
    console.error(`Error fetching tasks for department ${departmentId}:`, error);
    throw error;
  }
};

export const getTasksByRequester = async (requesterId: string): Promise<Task[]> => {
  try {
    const tasksRef = ref(database, 'tasks');
    const snapshot = await get(tasksRef);
    
    if (!snapshot.exists()) {
      return [];
    }
    
    const tasks: Task[] = [];
    snapshot.forEach((childSnapshot) => {
      const task = childSnapshot.val() as Task;
      if (task.requesterId === requesterId) {
        tasks.push(task);
      }
    });
    
    return tasks;
  } catch (error) {
    console.error(`Error fetching tasks for requester ${requesterId}:`, error);
    throw error;
  }
};

export const getTasksByAssignee = async (assigneeId: string): Promise<Task[]> => {
  try {
    const tasksRef = ref(database, 'tasks');
    const snapshot = await get(tasksRef);
    
    if (!snapshot.exists()) {
      return [];
    }
    
    const tasks: Task[] = [];
    snapshot.forEach((childSnapshot) => {
      const task = childSnapshot.val() as Task;
      if (task.assignedTo === assigneeId) {
        tasks.push(task);
      }
    });
    
    return tasks;
  } catch (error) {
    console.error(`Error fetching tasks for assignee ${assigneeId}:`, error);
    throw error;
  }
};

export const getTaskById = async (id: string): Promise<Task | null> => {
  try {
    const taskRef = ref(database, `tasks/${id}`);
    const snapshot = await get(taskRef);
    
    if (!snapshot.exists()) {
      return null;
    }
    
    return snapshot.val() as Task;
  } catch (error) {
    console.error(`Error fetching task with ID ${id}:`, error);
    throw error;
  }
};

export const updateTask = async (id: string, updates: Partial<Task>): Promise<void> => {
  try {
    const taskRef = ref(database, `tasks/${id}`);
    await update(taskRef, updates);
  } catch (error) {
    console.error(`Error updating task with ID ${id}:`, error);
    throw error;
  }
};

export const deleteTask = async (id: string): Promise<void> => {
  try {
    const taskRef = ref(database, `tasks/${id}`);
    await remove(taskRef);
  } catch (error) {
    console.error(`Error deleting task with ID ${id}:`, error);
    throw error;
  }
};

export const assignTask = async (taskId: string, departmentId: string): Promise<void> => {
  try {
    const employees = await getDepartmentEmployees(departmentId);
    
    if (employees.length === 0) {
      throw new Error(`No employees found in department ${departmentId}`);
    }
    
    // Get all tasks for each employee to determine workload
    const employeeWorkloads: Record<string, { completed: number; inProgress: number }> = {};
    
    for (const employee of employees) {
      const assigneeTasks = await getTasksByAssignee(employee.id);
      const completedTasksCount = assigneeTasks.filter(task => task.status === 'completed').length;
      const inProgressTasksCount = assigneeTasks.filter(task => task.status === 'in_progress').length;
      
      employeeWorkloads[employee.id] = {
        completed: completedTasksCount,
        inProgress: inProgressTasksCount
      };
    }
    
    // First check if there are employees with no in-progress tasks
    const freeEmployees = employees.filter(
      employee => employeeWorkloads[employee.id].inProgress === 0
    );
    
    let eligibleEmployees = [];
    
    // If we have free employees, prioritize them based on completed task count
    if (freeEmployees.length > 0) {
      console.log("Found free employees for task assignment:", freeEmployees.length);
      // Find the minimum completed task count among free employees
      const minCompletedTasks = Math.min(
        ...freeEmployees.map(emp => employeeWorkloads[emp.id].completed)
      );
      
      // Select employees with minimum completed tasks
      eligibleEmployees = freeEmployees.filter(
        employee => employeeWorkloads[employee.id].completed === minCompletedTasks
      );
    } else {
      console.log("No free employees, using workload balancing");
      // If all employees are busy, find those with minimum in-progress tasks
      const minInProgressTasks = Math.min(
        ...employees.map(emp => employeeWorkloads[emp.id].inProgress)
      );
      
      const leastBusyEmployees = employees.filter(
        employee => employeeWorkloads[employee.id].inProgress === minInProgressTasks
      );
      
      // Among those with minimum in-progress tasks, find those with minimum completed tasks
      const minCompletedTasks = Math.min(
        ...leastBusyEmployees.map(emp => employeeWorkloads[emp.id].completed)
      );
      
      eligibleEmployees = leastBusyEmployees.filter(
        employee => employeeWorkloads[employee.id].completed === minCompletedTasks
      );
    }
    
    // Choose a random employee from eligible employees
    const assigneeIndex = Math.floor(Math.random() * eligibleEmployees.length);
    const assignee = eligibleEmployees[assigneeIndex];
    
    console.log(`Assigning task ${taskId} to employee ${assignee.id} (${assignee.name})`);
    console.log(`Employee stats: In Progress: ${employeeWorkloads[assignee.id].inProgress}, Completed: ${employeeWorkloads[assignee.id].completed}`);
    
    // Create task assignment with 5-minute expiration
    const expirationTime = new Date();
    expirationTime.setMinutes(expirationTime.getMinutes() + 5);
    
    const assignmentRef = ref(database, `taskAssignments/${taskId}_${assignee.id}`);
    await set(assignmentRef, {
      taskId,
      employeeId: assignee.id,
      status: 'pending',
      expiresAt: expirationTime.toISOString()
    } as TaskAssignment);
    
    // Update task status to assigned
    await updateTask(taskId, { status: 'assigned' });
  } catch (error) {
    console.error(`Error assigning task ${taskId}:`, error);
    throw error;
  }
};

export const acceptTaskAssignment = async (taskId: string, employeeId: string): Promise<void> => {
  try {
    const taskAssignmentRef = ref(database, `taskAssignments/${taskId}_${employeeId}`);
    const snapshot = await get(taskAssignmentRef);
    
    if (!snapshot.exists()) {
      throw new Error(`Task assignment for task ${taskId} and employee ${employeeId} not found`);
    }
    
    const assignment = snapshot.val() as TaskAssignment;
    
    // Check if assignment has expired
    if (new Date(assignment.expiresAt) < new Date()) {
      throw new Error('Task assignment has expired');
    }
    
    // Update assignment status
    await update(taskAssignmentRef, { status: 'accepted' });
    
    // Update task
    const startTime = new Date().toISOString();
    await updateTask(taskId, {
      status: 'in_progress',
      assignedTo: employeeId,
      startTime
    });
    
    // ახალი: დავალების სტატუსის განახლების შესახებ შეტყობინების გაგზავნა
    await updateTaskStatus(taskId, 'in_progress', employeeId);
  } catch (error) {
    console.error(`Error accepting task assignment for task ${taskId} and employee ${employeeId}:`, error);
    throw error;
  }
};

export const rejectTaskAssignment = async (taskId: string, employeeId: string): Promise<void> => {
  try {
    const taskAssignmentRef = ref(database, `taskAssignments/${taskId}_${employeeId}`);
    const snapshot = await get(taskAssignmentRef);
    
    if (!snapshot.exists()) {
      throw new Error(`Task assignment for task ${taskId} and employee ${employeeId} not found`);
    }
    
    // Update assignment status
    await update(taskAssignmentRef, { status: 'rejected' });
    
    // Re-assign the task
    const task = await getTaskById(taskId);
    if (task) {
      await assignTask(taskId, task.departmentId);
    }
  } catch (error) {
    console.error(`Error rejecting task assignment for task ${taskId} and employee ${employeeId}:`, error);
    throw error;
  }
};

export const completeTask = async (taskId: string, employeeId: string): Promise<void> => {
  try {
    const task = await getTaskById(taskId);
    
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }
    
    if (task.assignedTo !== employeeId) {
      throw new Error(`Task ${taskId} is not assigned to employee ${employeeId}`);
    }
    
    const endTime = new Date().toISOString();
    await updateTask(taskId, {
      status: 'completed',
      endTime
    });
    
    // ახალი: დავალების სტატუსის განახლების შესახებ შეტყობინების გაგზავნა
    await updateTaskStatus(taskId, 'completed', employeeId);
  } catch (error) {
    console.error(`Error completing task ${taskId} for employee ${employeeId}:`, error);
    throw error;
  }
};

export const calculateEmployeePerformance = async (departmentId: string): Promise<EmployeePerformance[]> => {
  try {
    const employees = await getDepartmentEmployees(departmentId);
    const performances: EmployeePerformance[] = [];
    
    for (const employee of employees) {
      const assigneeTasks = await getTasksByAssignee(employee.id);
      const completedTasks = assigneeTasks.filter(task => task.status === 'completed');
      
      let totalWorkTime = 0;
      
      for (const task of completedTasks) {
        if (task.startTime && task.endTime) {
          const startTime = new Date(task.startTime).getTime();
          const endTime = new Date(task.endTime).getTime();
          const taskTime = (endTime - startTime) / (1000 * 60); // Convert to minutes
          totalWorkTime += taskTime;
        }
      }
      
      const averageCompletionTime = completedTasks.length > 0 
        ? totalWorkTime / completedTasks.length 
        : 0;
      
      performances.push({
        employeeId: employee.id,
        name: employee.name,
        tasksCompleted: completedTasks.length,
        totalWorkTime,
        averageCompletionTime
      });
    }
    
    return performances;
  } catch (error) {
    console.error(`Error calculating performance for department ${departmentId}:`, error);
    throw error;
  }
};

export const subscribeToTasks = (callback: (tasks: Task[]) => void): (() => void) => {
  const tasksRef = ref(database, 'tasks');
  
  const handleTasksChange = (snapshot: DataSnapshot) => {
    if (snapshot.exists()) {
      const tasks: Task[] = [];
      snapshot.forEach((childSnapshot: DataSnapshot) => {
        tasks.push(childSnapshot.val() as Task);
      });
      callback(tasks);
    } else {
      callback([]);
    }
  };
  
  onValue(tasksRef, handleTasksChange);
  
  return () => {
    off(tasksRef, 'value', handleTasksChange);
  };
};

// New function to subscribe to guest requests
export const subscribeToGuestRequests = (callback: (requests: GuestRequest[]) => void): (() => void) => {
  const requestsRef = ref(database, 'guestRequests');
  
  const handleRequestsChange = (snapshot: DataSnapshot) => {
    if (snapshot.exists()) {
      const requests: GuestRequest[] = [];
      snapshot.forEach((childSnapshot: DataSnapshot) => {
        requests.push({
          id: childSnapshot.key as string,
          ...childSnapshot.val()
        });
      });
      callback(requests);
    } else {
      callback([]);
    }
  };
  
  onValue(requestsRef, handleRequestsChange);
  
  return () => {
    off(requestsRef, 'value', handleRequestsChange);
  };
}; 

// New function to accept a guest request and assign it to the accepting employee
export const acceptGuestRequest = async (requestId: string, employeeId: string): Promise<void> => {
  try {
    // Get the guest request
    const requestRef = ref(database, `guestRequests/${requestId}`);
    const snapshot = await get(requestRef);
    
    if (!snapshot.exists()) {
      throw new Error(`Guest request with ID ${requestId} not found`);
    }
    
    const request = snapshot.val() as GuestRequest;
    
    // Create a new task based on the request
    const tasksRef = ref(database, 'tasks');
    const newTaskRef = push(tasksRef);
    const taskId = newTaskRef.key as string;
    
    const newTask: Task = {
      id: taskId,
      title: `${request.title} - ოთახი ${request.roomNumber}${request.guestName ? ', სტუმარი: ' + request.guestName : ''}`,
      roomNumber: request.roomNumber,
      departmentId: request.departmentId,
      assignedTo: employeeId,
      status: 'in_progress',
      requesterId: requestId, // Use the passed requestId instead of request.id
      createdAt: new Date().toISOString(),
      startTime: new Date().toISOString()
    };
    
    await set(newTaskRef, newTask);
    
    // Update the guest request status
    await update(requestRef, {
      status: 'accepted',
      acceptedBy: employeeId,
      acceptedAt: new Date().toISOString()
    });
    
    console.log(`Guest request ${requestId} accepted and converted to task ${taskId} for employee ${employeeId}`);
  } catch (error) {
    console.error(`Error accepting guest request ${requestId} for employee ${employeeId}:`, error);
    throw error;
  }
}; 

// ახალი ფუნქცია დავალების სტატუსის განახლებისთვის
export const updateTaskStatus = async (taskId: string, status: 'in_progress' | 'completed', employeeId: string): Promise<void> => {
  try {
    // დავალების სტატუსის ისტორიის შენახვა
    const taskStatusRef = ref(database, `taskStatusHistory/${taskId}`);
    const newStatusRef = push(taskStatusRef);
    
    await set(newStatusRef, {
      taskId,
      employeeId,
      status,
      timestamp: new Date().toISOString()
    });
    
    console.log(`Task ${taskId} status updated to ${status} by employee ${employeeId}`);
  } catch (error) {
    console.error(`Error updating task status history for task ${taskId}:`, error);
    // არ გადავაგდოთ შეცდომა, რადგან ეს დამხმარე ფუნქციაა
  }
};

// ახალი ფუნქცია დავალების სტატუსის ისტორიის მოსასმენად
export const subscribeToTaskStatusHistory = (callback: (statusUpdates: any[]) => void): (() => void) => {
  const statusRef = ref(database, 'taskStatusHistory');
  
  const handleStatusChange = (snapshot: DataSnapshot) => {
    if (snapshot.exists()) {
      const updates: any[] = [];
      snapshot.forEach((taskSnapshot: DataSnapshot) => {
        taskSnapshot.forEach((updateSnapshot: DataSnapshot) => {
          updates.push({
            ...updateSnapshot.val(),
            id: updateSnapshot.key
          });
        });
      });
      
      // სორტირება დროის მიხედვით, ახლიდან ძველისკენ
      updates.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      
      callback(updates);
    } else {
      callback([]);
    }
  };
  
  onValue(statusRef, handleStatusChange);
  
  return () => {
    off(statusRef, 'value', handleStatusChange);
  };
}; 