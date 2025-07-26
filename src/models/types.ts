export type UserRole = 'department' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  departmentId?: string;
  createdAt: string;
}

export interface Department {
  id: string;
  name: string;
  description: string;
  employeeIds: string[];
  createdAt: string;
  commonProblems?: CommonProblem[];
}

export interface CommonProblem {
  id: string;
  title: string;
  description: string;
}

export interface Task {
  id: string;
  title: string;
  roomNumber: string;
  departmentId: string;
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'rejected';
  requesterId: string;
  assignedTo?: string;
  startTime?: string;
  endTime?: string;
  createdAt: string;
}

export interface GuestRequest {
  id: string;
  title: string;
  roomNumber: string;
  departmentId: string;
  guestName: string;
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'rejected';
  assignedTo?: string;
  startTime?: string;
  endTime?: string;
  createdAt: string;
}

export interface TaskAssignment {
  taskId: string;
  employeeId: string;
  status: 'pending' | 'accepted' | 'rejected';
  expiresAt: string; // When the assignment offer expires
}

export interface EmployeePerformance {
  employeeId: string;
  name: string;
  tasksCompleted: number;
  totalWorkTime: number; // in minutes
  averageCompletionTime: number; // in minutes
} 