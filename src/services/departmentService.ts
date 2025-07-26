import { ref, push, set, get, update, remove, query, orderByChild, equalTo } from 'firebase/database';
import { database } from '@/firebase/config';
import { Department, User, CommonProblem } from '@/models/types';

export const createDepartment = async (department: Omit<Department, 'id' | 'createdAt'>) => {
  try {
    const departmentsRef = ref(database, 'departments');
    const newDepartmentRef = push(departmentsRef);
    const id = newDepartmentRef.key as string;
    
    const newDepartment = {
      ...department,
      id,
      employeeIds: department.employeeIds || [],
      commonProblems: department.commonProblems || [],
      createdAt: new Date().toISOString()
    };
    
    await set(newDepartmentRef, newDepartment);
    return newDepartment;
  } catch (error) {
    console.error('Error creating department:', error);
    throw error;
  }
};

export const getDepartments = async (): Promise<Department[]> => {
  try {
    const departmentsRef = ref(database, 'departments');
    const snapshot = await get(departmentsRef);
    
    if (!snapshot.exists()) {
      return [];
    }
    
    const departments: Department[] = [];
    snapshot.forEach((childSnapshot) => {
      departments.push(childSnapshot.val() as Department);
    });
    
    return departments;
  } catch (error) {
    console.error('Error fetching departments:', error);
    throw error;
  }
};

export const getDepartmentById = async (id: string): Promise<Department | null> => {
  try {
    const departmentRef = ref(database, `departments/${id}`);
    const snapshot = await get(departmentRef);
    
    if (!snapshot.exists()) {
      return null;
    }
    
    return snapshot.val() as Department;
  } catch (error) {
    console.error(`Error fetching department with ID ${id}:`, error);
    throw error;
  }
};

export const updateDepartment = async (id: string, updates: Partial<Department>): Promise<void> => {
  try {
    const departmentRef = ref(database, `departments/${id}`);
    await update(departmentRef, updates);
  } catch (error) {
    console.error(`Error updating department with ID ${id}:`, error);
    throw error;
  }
};

export const deleteDepartment = async (id: string): Promise<void> => {
  try {
    const departmentRef = ref(database, `departments/${id}`);
    await remove(departmentRef);
  } catch (error) {
    console.error(`Error deleting department with ID ${id}:`, error);
    throw error;
  }
};

export const addEmployeeToDepartment = async (departmentId: string, employeeId: string): Promise<void> => {
  try {
    // Get the current department
    const department = await getDepartmentById(departmentId);
    if (!department) {
      throw new Error(`Department with ID ${departmentId} not found`);
    }
    
    // Add employee to department
    const employeeIds = department.employeeIds || [];
    if (!employeeIds.includes(employeeId)) {
      employeeIds.push(employeeId);
      await updateDepartment(departmentId, { employeeIds });
    }
    
    // Update employee's department reference
    const userRef = ref(database, `users/${employeeId}`);
    await update(userRef, { departmentId });
  } catch (error) {
    console.error(`Error adding employee ${employeeId} to department ${departmentId}:`, error);
    throw error;
  }
};

export const removeEmployeeFromDepartment = async (departmentId: string, employeeId: string): Promise<void> => {
  try {
    // Get the current department
    const department = await getDepartmentById(departmentId);
    if (!department) {
      throw new Error(`Department with ID ${departmentId} not found`);
    }
    
    // Remove employee from department
    const employeeIds = department.employeeIds || [];
    const updatedEmployeeIds = employeeIds.filter(id => id !== employeeId);
    await updateDepartment(departmentId, { employeeIds: updatedEmployeeIds });
    
    // Remove department reference from employee
    const userRef = ref(database, `users/${employeeId}`);
    await update(userRef, { departmentId: null });
  } catch (error) {
    console.error(`Error removing employee ${employeeId} from department ${departmentId}:`, error);
    throw error;
  }
};

export const getDepartmentEmployees = async (departmentId: string): Promise<User[]> => {
  try {
    const department = await getDepartmentById(departmentId);
    if (!department || !department.employeeIds || department.employeeIds.length === 0) {
      return [];
    }
    
    const employees: User[] = [];
    for (const employeeId of department.employeeIds) {
      const userRef = ref(database, `users/${employeeId}`);
      const snapshot = await get(userRef);
      if (snapshot.exists()) {
        employees.push({ ...snapshot.val(), id: employeeId } as User);
      }
    }
    
    return employees;
  } catch (error) {
    console.error(`Error fetching employees for department ${departmentId}:`, error);
    throw error;
  }
};

// New methods for managing common problems
export const addCommonProblemToDepartment = async (departmentId: string, problem: Omit<CommonProblem, 'id'>): Promise<CommonProblem> => {
  try {
    const department = await getDepartmentById(departmentId);
    if (!department) {
      throw new Error(`Department with ID ${departmentId} not found`);
    }
    
    const problems = department.commonProblems || [];
    const newProblem: CommonProblem = {
      ...problem,
      id: `${Date.now()}`
    };
    
    problems.push(newProblem);
    
    await updateDepartment(departmentId, { commonProblems: problems });
    return newProblem;
  } catch (error) {
    console.error(`Error adding common problem to department ${departmentId}:`, error);
    throw error;
  }
};

export const updateCommonProblem = async (departmentId: string, problemId: string, updates: Partial<CommonProblem>): Promise<void> => {
  try {
    const department = await getDepartmentById(departmentId);
    if (!department) {
      throw new Error(`Department with ID ${departmentId} not found`);
    }
    
    const problems = department.commonProblems || [];
    const index = problems.findIndex(p => p.id === problemId);
    
    if (index === -1) {
      throw new Error(`Problem with ID ${problemId} not found in department ${departmentId}`);
    }
    
    problems[index] = {
      ...problems[index],
      ...updates
    };
    
    await updateDepartment(departmentId, { commonProblems: problems });
  } catch (error) {
    console.error(`Error updating common problem ${problemId} in department ${departmentId}:`, error);
    throw error;
  }
};

export const deleteCommonProblem = async (departmentId: string, problemId: string): Promise<void> => {
  try {
    const department = await getDepartmentById(departmentId);
    if (!department) {
      throw new Error(`Department with ID ${departmentId} not found`);
    }
    
    const problems = department.commonProblems || [];
    const updatedProblems = problems.filter(p => p.id !== problemId);
    
    await updateDepartment(departmentId, { commonProblems: updatedProblems });
  } catch (error) {
    console.error(`Error deleting common problem ${problemId} from department ${departmentId}:`, error);
    throw error;
  }
}; 