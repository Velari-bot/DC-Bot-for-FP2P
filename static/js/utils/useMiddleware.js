import axios from 'axios';

export const getAccessToken = () => {
  return localStorage.getItem('access_token');
};

export const saveAccessToken = token => {
  localStorage.setItem('access_token', token);
};

const useMiddleware = (token = null) => {
  const axiosInstance = axios.create();

  axiosInstance.interceptors.request.use(
    async (config) => {
      const authToken = token || getAccessToken();
      if (authToken) {
        config.headers.Authorization = `Bearer ${authToken}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );


  return axiosInstance;
};

export default useMiddleware;