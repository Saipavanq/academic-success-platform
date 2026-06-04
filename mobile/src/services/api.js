import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const tokens = await AsyncStorage.getItem('tokens');
  if (tokens) {
    const { access } = JSON.parse(tokens);
    config.headers.Authorization = `Bearer ${access}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('tokens');
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (credentials) => api.post('/auth/login/', credentials),
  register: (data) => api.post('/auth/register/', data),
  getProfile: () => api.get('/auth/profile/'),
};

export const dashboardAPI = {
  getStudent: () => api.get('/dashboard/student/'),
};

export const coursesAPI = {
  list: () => api.get('/courses/'),
  enroll: (id) => api.post(`/courses/${id}/enroll/`),
};

export const examsAPI = {
  upcoming: () => api.get('/exams/upcoming/'),
};

export const studyPlansAPI = {
  list: () => api.get('/study-plans/'),
  getProgress: (id) => api.get(`/study-plans/${id}/progress/`),
  completeTask: (planId, taskId) => api.post(`/study-plans/${planId}/complete_task/`, { task_id: taskId }),
};

export const goalsAPI = {
  list: () => api.get('/goals/'),
  create: (data) => api.post('/goals/', data),
  updateProgress: (id, progress) => api.post(`/goals/${id}/update_progress/`, { progress }),
};

export default api;
