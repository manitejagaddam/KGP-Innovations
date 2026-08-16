const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

async function fetchWithAuth(endpoint, options = {}) {
  let token = localStorage.getItem('accessToken');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  let response = await fetch(`${API_URL}${endpoint}`, config);

  if (response.status === 401) {
    const errorData = await response.json().catch(() => ({}));
    if (errorData.code === 'TOKEN_EXPIRED') {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const refreshRes = await fetch(`${API_URL}/api/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken })
          });
          
          if (refreshRes.ok) {
            const data = await refreshRes.json();
            localStorage.setItem('accessToken', data.accessToken);
            if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
            
            // Retry original request
            headers['Authorization'] = `Bearer ${data.accessToken}`;
            response = await fetch(`${API_URL}${endpoint}`, { ...config, headers });
            return response;
          }
        } catch (err) {
          console.error('Token refresh failed', err);
        }
      }
      // If refresh fails or no refresh token
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      window.location.href = '/';
      throw new Error('Session expired. Please log in again.');
    }
  }

  return response;
}

const handleResponse = async (res) => {
  if (!res.ok) {
    const errData = await res.json().catch(() => ({ message: res.statusText }));
    // Backend might return { error: "msg" } or { message: "msg" } or { error: { message: "msg" } }
    const errStr = errData.error?.message || errData.error || errData.message || 'API request failed';
    throw new Error(errStr);
  }
  return res.json();
};

export const authApi = {
  login: async (email, password) => {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return handleResponse(res);
  },
  register: async (name, email, password, role) => {
    const res = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role })
    });
    return handleResponse(res);
  },
  logout: async () => {
    const res = await fetchWithAuth('/api/auth/logout', { method: 'POST' });
    return handleResponse(res);
  },
  refresh: async (refreshToken) => {
    const res = await fetch(`${API_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });
    return handleResponse(res);
  },
  me: async () => {
    const res = await fetchWithAuth('/api/auth/me');
    return handleResponse(res);
  },
  forgotPassword: async (email) => {
    const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    return handleResponse(res);
  }
};

export const devicesApi = {
  list: async (params) => {
    const query = new URLSearchParams(params || {}).toString();
    const res = await fetchWithAuth(`/api/devices?${query}`);
    return handleResponse(res);
  },
  get: async (id) => {
    const res = await fetchWithAuth(`/api/devices/${id}`);
    return handleResponse(res);
  },
  create: async (data) => {
    const res = await fetchWithAuth('/api/devices', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },
  update: async (id, data) => {
    const res = await fetchWithAuth(`/api/devices/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },
  delete: async (id) => {
    const res = await fetchWithAuth(`/api/devices/${id}`, { method: 'DELETE' });
    return handleResponse(res);
  },
  sendCommand: async (id, data) => {
    const res = await fetchWithAuth(`/api/devices/${id}/command`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },
  updateSchedule: async (id, data) => {
    const res = await fetchWithAuth(`/api/devices/${id}/schedule`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },
  telemetry: async (id, params) => {
    const query = new URLSearchParams(params || {}).toString();
    const res = await fetchWithAuth(`/api/devices/${id}/telemetry?${query}`);
    return handleResponse(res);
  },
  logs: async (id, params) => {
    const query = new URLSearchParams(params || {}).toString();
    const res = await fetchWithAuth(`/api/devices/${id}/logs?${query}`);
    return handleResponse(res);
  }
};

export const usersApi = {
  list: async (params) => {
    const query = new URLSearchParams(params || {}).toString();
    const res = await fetchWithAuth(`/api/users?${query}`);
    return handleResponse(res);
  },
  get: async (id) => {
    const res = await fetchWithAuth(`/api/users/${id}`);
    return handleResponse(res);
  },
  create: async (data) => {
    const res = await fetchWithAuth('/api/users', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },
  update: async (id, data) => {
    const res = await fetchWithAuth(`/api/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },
  delete: async (id) => {
    const res = await fetchWithAuth(`/api/users/${id}`, { method: 'DELETE' });
    return handleResponse(res);
  },
  toggleStatus: async (id) => {
    // Backend route is PATCH /:id/status
    const res = await fetchWithAuth(`/api/users/${id}/status`, { method: 'PATCH' });
    return handleResponse(res);
  }
};

export const vendorsApi = {
  list: async (params) => {
    const query = new URLSearchParams(params || {}).toString();
    const res = await fetchWithAuth(`/api/vendors?${query}`);
    return handleResponse(res);
  },
  get: async (id) => {
    const res = await fetchWithAuth(`/api/vendors/${id}`);
    return handleResponse(res);
  },
  create: async (data) => {
    const res = await fetchWithAuth('/api/vendors', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },
  update: async (id, data) => {
    const res = await fetchWithAuth(`/api/vendors/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },
  delete: async (id) => {
    const res = await fetchWithAuth(`/api/vendors/${id}`, { method: 'DELETE' });
    return handleResponse(res);
  }
};

export const alertsApi = {
  list: async (params) => {
    const query = new URLSearchParams(params || {}).toString();
    const res = await fetchWithAuth(`/api/alerts?${query}`);
    return handleResponse(res);
  },
  update: async (id, data) => {
    const res = await fetchWithAuth(`/api/alerts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },
  rules: {
    list: async () => {
      const res = await fetchWithAuth('/api/alerts/rules');
      return handleResponse(res);
    },
    create: async (data) => {
      const res = await fetchWithAuth('/api/alerts/rules', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      return handleResponse(res);
    },
    update: async (id, data) => {
      const res = await fetchWithAuth(`/api/alerts/rules/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
      return handleResponse(res);
    },
    delete: async (id) => {
      const res = await fetchWithAuth(`/api/alerts/rules/${id}`, { method: 'DELETE' });
      return handleResponse(res);
    },
    toggle: async (id) => {
      // Backend route is PATCH /rules/:ruleId/toggle
      const res = await fetchWithAuth(`/api/alerts/rules/${id}/toggle`, { method: 'PATCH' });
      return handleResponse(res);
    }
  }
};

export const analyticsApi = {
  fleet: async () => {
    const res = await fetchWithAuth('/api/analytics/fleet');
    return handleResponse(res);
  },
  energy: async (params) => {
    const query = new URLSearchParams(params || {}).toString();
    const res = await fetchWithAuth(`/api/analytics/energy?${query}`);
    return handleResponse(res);
  },
  voltage: async (params) => {
    const query = new URLSearchParams(params || {}).toString();
    const res = await fetchWithAuth(`/api/analytics/voltage?${query}`);
    return handleResponse(res);
  },
  uptime: async (params) => {
    const query = new URLSearchParams(params || {}).toString();
    const res = await fetchWithAuth(`/api/analytics/uptime?${query}`);
    return handleResponse(res);
  }
};

export const automationsApi = {
  list: async () => {
    const res = await fetchWithAuth('/api/automations');
    return handleResponse(res);
  },
  create: async (data) => {
    const res = await fetchWithAuth('/api/automations', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },
  update: async (id, data) => {
    const res = await fetchWithAuth(`/api/automations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },
  delete: async (id) => {
    const res = await fetchWithAuth(`/api/automations/${id}`, { method: 'DELETE' });
    return handleResponse(res);
  },
  toggle: async (id) => {
    // Backend route is PATCH /:id/toggle
    const res = await fetchWithAuth(`/api/automations/${id}/toggle`, { method: 'PATCH' });
    return handleResponse(res);
  }
};

export const settingsApi = {
  get: async () => {
    const res = await fetchWithAuth('/api/settings');
    return handleResponse(res);
  },
  update: async (data) => {
    const res = await fetchWithAuth('/api/settings', {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },
  regenerateKey: async () => {
    const res = await fetchWithAuth('/api/settings/regenerate-key', { method: 'POST' });
    return handleResponse(res);
  }
};

export const firmwareApi = {
  list: async () => {
    const res = await fetchWithAuth('/api/firmware');
    return handleResponse(res);
  },
  get: async (id) => {
    const res = await fetchWithAuth(`/api/firmware/${id}`);
    return handleResponse(res);
  },
  create: async (data) => {
    const res = await fetchWithAuth('/api/firmware', { method: 'POST', body: JSON.stringify(data) });
    return handleResponse(res);
  },
  update: async (id, data) => {
    const res = await fetchWithAuth(`/api/firmware/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    return handleResponse(res);
  },
  delete: async (id) => {
    const res = await fetchWithAuth(`/api/firmware/${id}`, { method: 'DELETE' });
    return handleResponse(res);
  },
  push: async (firmwareId, deviceId) => {
    const res = await fetchWithAuth(`/api/firmware/${firmwareId}/push/${deviceId}`, { method: 'POST' });
    return handleResponse(res);
  }
};

export const pendingDevicesApi = {
  list: async () => {
    const res = await fetchWithAuth('/api/devices/pending');
    return handleResponse(res);
  },
  approve: async (id, action) => {
    const res = await fetchWithAuth(`/api/devices/${id}/approve`, { method: 'PUT', body: JSON.stringify({ action }) });
    return handleResponse(res);
  }
};
