import client from './client';
import type { Task, CreateTaskRequest } from '../types/task';

export async function createTask(dto: CreateTaskRequest): Promise<Task> {
  const response = await client.post<Task>('/tasks', dto);
  return response.data;
}

export async function getMyTasks(): Promise<Task[]> {
  const response = await client.get<Task[]>('/tasks/my');
  return response.data;
}

export async function getTasks(): Promise<Task[]> {
  const response = await client.get<Task[]>('/tasks');
  return response.data;
}
