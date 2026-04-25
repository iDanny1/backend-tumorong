const API_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:3000';

console.log('API Client initialized with Base URL:', API_URL);

export const api = {
  get: async (endpoint: string) => {
    const response = await fetch(`${API_URL}${endpoint}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || error.error || 'API request failed');
    }
    return response.json();
  },
  
  post: async (endpoint: string, data: any) => {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || error.error || 'API request failed');
    }
    return response.json();
  },
  
  put: async (endpoint: string, data: any) => {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || error.error || 'API request failed');
    }
    return response.json();
  },
  
  patch: async (endpoint: string, data: any) => {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || error.error || 'API request failed');
    }
    return response.json();
  },
  
  delete: async (endpoint: string) => {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || error.error || 'API request failed');
    }
    return response.json();
  }
};
