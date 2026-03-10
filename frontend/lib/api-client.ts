// frontend/lib/api-client.ts
import { Task } from './types';
import { API_BASE_URL } from './config';

interface ApiClientOptions extends RequestInit {
  user_id?: string;
}

/**
 * Centralized API client with JWT token attachment
 */
export const apiClient = async <T>(
  endpoint: string,
  options: ApiClientOptions = {}
): Promise<T> => {
  // Get authentication token from our simple auth system
  const token = typeof window !== 'undefined' ? 
    (localStorage.getItem('todo-app-auth') ? JSON.parse(localStorage.getItem('todo-app-auth')!).token : null) 
    : null;

  const url = `${API_BASE_URL}${endpoint}`;

  // Construct headers with default Content-Type and Authorization
  const headers = new Headers({
    'Content-Type': 'application/json',
    ...options.headers,
  });

  // Add authorization header if token exists
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Debugging utilities
  if (process.env.NODE_ENV === 'development') {
    console.log('API Call:', endpoint, options);
  }

  // Make the fetch request
  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Handle different response statuses
  if (!response.ok) {
    let errorMessage = `HTTP error! status: ${response.status}`;
    try {
      const errorData = await response.json();
      if (errorData.detail) {
        errorMessage = typeof errorData.detail === 'string' ? errorData.detail : JSON.stringify(errorData.detail);
      } else if (errorData.error?.message) {
        errorMessage = errorData.error.message;
      }
    } catch (e) {
      // Use default message
    }

    // Handle token expiration - redirect to login
    if (response.status === 401 && errorMessage.toLowerCase().includes('token')) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('todo-app-auth');
        window.location.href = '/auth/signin';
      }
    }

    throw new Error(errorMessage);
  }

  if (response.status === 204) {
    return null as T;
  }

  return response.json() as Promise<T>;
};

// Add convenience methods to apiClient
apiClient.get = <T>(endpoint: string, options?: ApiClientOptions) => 
  apiClient<T>(endpoint, { ...options, method: 'GET' });

apiClient.post = <T>(endpoint: string, body: any, options?: ApiClientOptions) => 
  apiClient<T>(endpoint, { ...options, method: 'POST', body: JSON.stringify(body) });

apiClient.put = <T>(endpoint: string, body: any, options?: ApiClientOptions) => 
  apiClient<T>(endpoint, { ...options, method: 'PUT', body: JSON.stringify(body) });

apiClient.patch = <T>(endpoint: string, body: any, options?: ApiClientOptions) => 
  apiClient<T>(endpoint, { ...options, method: 'PATCH', body: JSON.stringify(body) });

apiClient.delete = <T>(endpoint: string, options?: ApiClientOptions) => 
  apiClient<T>(endpoint, { ...options, method: 'DELETE' });

interface TaskListResponse {
  tasks: Task[];
  total: number;
}

interface GetTasksParams {
  completed?: boolean;
  priority?: string;
  tags?: string;
  q?: string;
  status?: string;
  due_date_from?: string;
  due_date_to?: string;
  sort_by?: string;
  sort_order?: string;
}

// Helper functions for specific endpoints
export const taskApi = {
  // Get all tasks for a user with filters
  getTasks: async (user_id: string, params?: GetTasksParams) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, String(value));
        }
      });
    }
    const queryString = queryParams.toString();
    const endpoint = `/api/v1/${user_id}/tasks${queryString ? `?${queryString}` : ''}`;
    return apiClient<TaskListResponse>(endpoint);
  },

  // Create a new task
  createTask: async (user_id: string, taskData: Partial<Task>) => {
    return apiClient.post<Task>(`/api/v1/${user_id}/tasks`, taskData);
  },

  // Get a specific task
  getTask: async (user_id: string, task_id: number) => {
    return apiClient<Task>(`/api/v1/${user_id}/tasks/${task_id}`);
  },

  // Update a task
  updateTask: async (user_id: string, task_id: number, taskData: Partial<Task>) => {
    return apiClient.put<Task>(`/api/v1/${user_id}/tasks/${task_id}`, taskData);
  },

  // Toggle task completion
  toggleTaskCompletion: async (user_id: string, task_id: number, completed: boolean) => {
    return apiClient.patch<Task>(`/api/v1/${user_id}/tasks/${task_id}/complete`, { completed });
  },

  // Delete a task
  deleteTask: async (user_id: string, task_id: number) => {
    return apiClient.delete<null>(`/api/v1/${user_id}/tasks/${task_id}`);
  }
};
