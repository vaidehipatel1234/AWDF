/**
 * Central API Client for Practical 6 Full-Stack Integration
 * Communicates with the Express Backend (http://localhost:5000)
 */

const BASE_URL = 'http://localhost:5000';

export const getTasks = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const url = `${BASE_URL}/tasks${query ? `?${query}` : ''}`;
  const response = await fetch(url);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch tasks from server');
  }
  return data;
};

export const getTaskById = async (id) => {
  const response = await fetch(`${BASE_URL}/tasks/${id}`);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch task details');
  }
  return data;
};

export const createTask = async (taskData) => {
  const response = await fetch(`${BASE_URL}/tasks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(taskData)
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to create task');
  }
  return data;
};

export const updateTask = async (id, taskData) => {
  const response = await fetch(`${BASE_URL}/tasks/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(taskData)
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to update task');
  }
  return data;
};

export const deleteTask = async (id) => {
  const response = await fetch(`${BASE_URL}/tasks/${id}`, {
    method: 'DELETE'
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to delete task');
  }
  return data;
};

export const checkBackendHealth = async () => {
  try {
    const res = await fetch(`${BASE_URL}/`, { cache: 'no-store' });
    return res.ok;
  } catch (err) {
    return false;
  }
};
