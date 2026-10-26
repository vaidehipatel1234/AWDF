/**
 * Central API Client for Practical 7: Authentication and Middleware Pipeline
 * Communicates with the Express Backend (http://localhost:5000)
 * Handles JWT token storage, automatic Bearer Authorization injection,
 * and 401 Token Expiry interceptor.
 */

const BASE_URL = 'http://localhost:5000';

// Token Management
export const getToken = () => localStorage.getItem('token');
export const setToken = (token) => localStorage.setItem('token', token);
export const removeToken = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

export const getStoredUser = () => {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
};

export const setStoredUser = (user) => {
  localStorage.setItem('user', JSON.stringify(user));
};

/**
 * Standard fetch wrapper that automatically attaches the Authorization header
 * and intercepts 401 Unauthorized responses to handle token expiry.
 */
const authFetch = async (endpoint, options = {}) => {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  // Supplementary Problem 2: Token expiry handling on the frontend
  if (response.status === 401) {
    removeToken();
    window.dispatchEvent(new CustomEvent('auth:unauthorized', {
      detail: { message: 'Session expired or unauthorized. Please log in again.' }
    }));
  }

  let data = null;
  try {
    data = await response.json();
  } catch (e) {
    data = { error: 'Invalid JSON response from server' };
  }

  if (!response.ok) {
    const errMsg = data.error || data.message || `Request failed with status ${response.status}`;
    const errorObj = new Error(errMsg);
    errorObj.status = response.status;
    errorObj.details = data.details;
    throw errorObj;
  }

  return data;
};

// ==========================================
// Authentication APIs
// ==========================================

export const registerUser = async (email, password, name = '') => {
  const response = await fetch(`${BASE_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Registration failed');
  }

  if (data.token) {
    setToken(data.token);
    if (data.user) setStoredUser(data.user);
  }
  return data;
};

export const loginUser = async (email, password) => {
  const response = await fetch(`${BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Login failed');
  }

  if (data.token) {
    setToken(data.token);
    if (data.user) setStoredUser(data.user);
  }
  return data;
};

export const logoutUser = () => {
  removeToken();
  window.dispatchEvent(new CustomEvent('auth:logout'));
};

// Supplementary Problem 1: GET /me endpoint
export const getMe = async () => {
  return await authFetch('/me', { method: 'GET' });
};

// ==========================================
// Protected Task APIs (JWT-protected)
// ==========================================

export const getTasks = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return await authFetch(`/tasks${query ? `?${query}` : ''}`, { method: 'GET' });
};

export const getTaskById = async (id) => {
  return await authFetch(`/tasks/${id}`, { method: 'GET' });
};

export const createTask = async (taskData) => {
  return await authFetch('/tasks', {
    method: 'POST',
    body: JSON.stringify(taskData)
  });
};

export const updateTask = async (id, taskData) => {
  return await authFetch(`/tasks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(taskData)
  });
};

export const deleteTask = async (id) => {
  return await authFetch(`/tasks/${id}`, {
    method: 'DELETE'
  });
};

export const checkBackendHealth = async () => {
  try {
    const res = await fetch(`${BASE_URL}/`, { cache: 'no-store' });
    return res.ok;
  } catch (err) {
    return false;
  }
};

// ==========================================
// Practical 9: In-Memory Caching APIs
// ==========================================

export const getCacheStats = async () => {
  try {
    const res = await fetch(`${BASE_URL}/cache/stats`, { cache: 'no-store' });
    return await res.json();
  } catch (e) {
    return { success: false, data: null };
  }
};

export const clearCache = async () => {
  try {
    const res = await fetch(`${BASE_URL}/cache/clear`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    return await res.json();
  } catch (e) {
    return { success: false };
  }
};

// ==========================================
// Practical 10: Event-Driven Architecture APIs
// ==========================================

export const getNotificationEvents = async () => {
  try {
    const res = await fetch(`${BASE_URL}/events/notifications`, { cache: 'no-store' });
    return await res.json();
  } catch (e) {
    return { success: false, notifications: [] };
  }
};


