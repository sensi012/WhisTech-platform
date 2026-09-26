import axios from 'axios';

const client = axios.create({
  baseURL: '/api',
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
});

client.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const message = err.response?.data?.error || 'Something went wrong';
    return Promise.reject(new Error(message));
  }
);

export const tasksApi = {
  list:   (params) => client.get('/tasks', { params }),
  get:    (id)     => client.get(`/tasks/${id}`),
  create: (body)   => client.post('/tasks', body),
  update: (id, b)  => client.patch(`/tasks/${id}`, b),
  remove: (id)     => client.delete(`/tasks/${id}`),
};
