// API Service - Fetch wrapper with auth headers and error handling

const API_BASE = '/api';

class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

function getAuthToken() {
  return localStorage.getItem('voicecircle_token');
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const token = getAuthToken();

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }

  if (options.body && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body);
  }

  const response = await fetch(url, config);

  let data;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    throw new ApiError(
      data?.error || data?.message || 'An error occurred',
      response.status,
      data
    );
  }

  return data;
}

export const api = {
  get: (endpoint, options = {}) => request(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, body, options = {}) => request(endpoint, { ...options, method: 'POST', body }),
  patch: (endpoint, body, options = {}) => request(endpoint, { ...options, method: 'PATCH', body }),
  put: (endpoint, body, options = {}) => request(endpoint, { ...options, method: 'PUT', body }),
  delete: (endpoint, options = {}) => request(endpoint, { ...options, method: 'DELETE' }),
};

// Auth endpoints
export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  refresh: () => api.post('/auth/refresh'),
};

// Posts endpoints
export const postsApi = {
  getFeed: (params = {}) => api.get(`/posts/feed?limit=${params.limit || 20}&skip=${params.skip || 0}`),
  getExplore: (params = {}) => api.get(`/posts/explore?limit=${params.limit || 20}&skip=${params.skip || 0}`),
  getById: (id) => api.get(`/posts/${id}`),
  getByUser: (userId, params = {}) => api.get(`/posts/user/${userId}?limit=${params.limit || 20}&skip=${params.skip || 0}`),
  create: (data) => api.post('/posts', data),
  like: (id) => api.post(`/posts/${id}/like`),
  getComments: (id) => api.get(`/posts/${id}/comments`),
  addComment: (id, data) => api.post(`/posts/${id}/comments`, data),
  delete: (id) => api.delete(`/posts/${id}`),
};

// Users endpoints
export const usersApi = {
  getById: (id) => api.get(`/users/${id}`),
  getByUsername: (username) => api.get(`/users/username/${username}`),
  search: (query, limit = 20) => api.get(`/users?q=${encodeURIComponent(query)}&limit=${limit}`),
  updateProfile: (data) => api.patch('/users/me', data),
  follow: (id) => api.post(`/users/${id}/follow`),
  unfollow: (id) => api.delete(`/users/${id}/follow`),
  getFollowers: (id) => api.get(`/users/${id}/followers`),
  getFollowing: (id) => api.get(`/users/${id}/following`),
};

// Rooms endpoints
export const roomsApi = {
  getAll: () => api.get('/rooms'),
  getById: (id) => api.get(`/rooms/${id}`),
  create: (data) => api.post('/rooms', data),
  join: (id) => api.post(`/rooms/${id}/join`),
  leave: (id) => api.post(`/rooms/${id}/leave`),
  raiseHand: (id) => api.post(`/rooms/${id}/raise-hand`),
  lowerHand: (id) => api.post(`/rooms/${id}/lower-hand`),
  promoteSpeaker: (roomId, userId) => api.post(`/rooms/${roomId}/speakers/${userId}`),
  demoteSpeaker: (roomId, userId) => api.delete(`/rooms/${roomId}/speakers/${userId}`),
  end: (id) => api.post(`/rooms/${id}/end`),
  getSignaling: (id) => api.get(`/rooms/${id}/signaling`),
};

// Upload endpoint
export const uploadApi = {
  uploadFile: async (file, type = 'audio') => {
    const formData = new FormData();
    formData.append('file', file);

    // Map type to correct endpoint
    let endpoint;
    switch (type) {
      case 'audio':
      case 'voice':
        endpoint = '/upload/voice';
        break;
      case 'video':
        endpoint = '/upload/video';
        break;
      case 'avatar':
      case 'image':
        endpoint = '/upload/avatar';
        break;
      default:
        endpoint = '/upload/voice';
    }

    const token = getAuthToken();
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      body: formData,
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({ error: 'Upload failed' }));
      throw new ApiError(data?.error || 'Upload failed', response.status, data);
    }

    return response.json();
  },
};

export { ApiError };
