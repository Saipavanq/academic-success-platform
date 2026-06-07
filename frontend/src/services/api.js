import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const tokens = JSON.parse(localStorage.getItem('tokens'));
  if (tokens?.access) {
    config.headers.Authorization = `Bearer ${tokens.access}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const tokens = JSON.parse(localStorage.getItem('tokens'));

      if (tokens?.refresh) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
            refresh: tokens.refresh,
          });
          const newTokens = {
            access: response.data.access,
            refresh: response.data.refresh || tokens.refresh,
          };
          localStorage.setItem('tokens', JSON.stringify(newTokens));
          originalRequest.headers.Authorization = `Bearer ${newTokens.access}`;
          return api(originalRequest);
        } catch (refreshError) {
          localStorage.removeItem('tokens');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (credentials) => api.post('/auth/login/', credentials),
  register: (data) => api.post('/auth/register/', data),
  verifyEmail: (data) => api.post('/auth/verify/', data),
  resendOTP: (email) => api.post('/auth/resend-otp/', { email }),
  getProfile: () => api.get('/auth/profile/'),
  updateProfile: (data) => api.put('/auth/profile/', data, {
    headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {},
  }),
  updateProfilePartial: (data) => api.patch('/auth/profile/', data),
  changePassword: (data) => api.post('/auth/change-password/', data),
  getStudentProfile: () => api.get('/auth/profile/student/'),
  updateStudentProfile: (data) => api.put('/auth/profile/student/', data),
};

export const coursesAPI = {
  list: () => api.get('/courses/'),
  get: (id) => api.get(`/courses/${id}/`),
  create: (data) => api.post('/courses/', data),
  update: (id, data) => api.put(`/courses/${id}/`, data),
  delete: (id) => api.delete(`/courses/${id}/`),
  enroll: (id) => api.post(`/courses/${id}/enroll/`),
  unenroll: (id) => api.delete(`/courses/${id}/unenroll/`),
  createWithSyllabus: (formData) => api.post('/courses/create-with-syllabus/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};

export const syllabusAPI = {
  upload: (formData) => api.post('/syllabus/upload/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  parse: (id) => api.post(`/syllabus/${id}/parse/`),
  getParsed: (id) => api.get(`/syllabus/${id}/parsed/`),
};

export const examsAPI = {
  list: (params) => api.get('/exams/', { params }),
  get: (id) => api.get(`/exams/${id}/`),
  create: (data) => api.post('/exams/', data),
  update: (id, data) => api.put(`/exams/${id}/`, data),
  delete: (id) => api.delete(`/exams/${id}/`),
  upcoming: () => api.get('/exams/upcoming/'),
  setReminder: (id, data) => api.post(`/exams/${id}/set_reminder/`, data),
  batchImport: (data) => api.post('/exams/batch_import/', data),
};

export const quizzesAPI = {
  list: (params) => api.get('/exams/quizzes/', { params }),
  get: (id) => api.get(`/exams/quizzes/${id}/`),
  create: (data) => api.post('/exams/quizzes/', data),
  upcoming: () => api.get('/exams/quizzes/upcoming/'),
};

export const studyPlansAPI = {
  list: () => api.get('/study-plans/'),
  get: (id) => api.get(`/study-plans/${id}/`),
  create: (data) => api.post('/study-plans/', data),
  generate: (data) => api.post('/study-plans/generate/', data),
  getProgress: (id) => api.get(`/study-plans/${id}/progress/`),
  completeTask: (planId, taskId) => api.post(`/study-plans/${planId}/complete_task/`, { task_id: taskId }),
};

export const goalsAPI = {
  list: () => api.get('/goals/'),
  get: (id) => api.get(`/goals/${id}/`),
  create: (data) => api.post('/goals/', data),
  update: (id, data) => api.put(`/goals/${id}/`, data),
  delete: (id) => api.delete(`/goals/${id}/`),
  updateProgress: (id, progress) => api.post(`/goals/${id}/update_progress/`, { progress }),
};

export const notificationsAPI = {
  list: () => api.get('/notifications/'),
  markRead: (id) => api.put(`/notifications/${id}/mark_read/`),
  markAllRead: () => api.put('/notifications/mark_all_read/'),
  unreadCount: () => api.get('/notifications/unread_count/'),
};

export const dashboardAPI = {
  getStudent: () => api.get('/dashboard/student/'),
  getFaculty: () => api.get('/dashboard/faculty/'),
};

export default api;
