import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true
});

// Auth API calls
export const login = async (email: string, password: string) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

export const signup = async (username: string, email: string, password: string) => {
  const response = await api.post('/auth/signup', { username, email, password });
  return response.data;
};

// Game API calls
export const createGame = async (formData: FormData) => {
  const response = await api.post('/game/create', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

export const joinGame = async (gameCode: string) => {
  const response = await api.post('/game/join', { gameCode });
  return response.data;
};

export const getGameState = async (gameId: string) => {
  const response = await api.get(`/game/${gameId}`);
  return response.data;
};

// User API calls
export const getUserProfile = async () => {
  const response = await api.get('/user/profile');
  return response.data;
};

// Leaderboard API calls
export const getLeaderboard = async (timeFrame: string) => {
  const response = await api.get(`/leaderboard?timeFrame=${timeFrame}`);
  return response.data;
};