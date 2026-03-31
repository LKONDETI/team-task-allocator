export interface Task {
  id: number;
  title: string;
  description: string;
  assigneeId: number;
  assigneeName: string;
  managerId: number;
  managerName: string;
  deadline: string; // ISO string from backend
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskRequest {
  title: string;
  description: string;
  assigneeId: number;
  deadline: string; // ISO string
}
