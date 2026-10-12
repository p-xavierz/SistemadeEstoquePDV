import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8001/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Adiciona o token automaticamente nas requisições autenticadas.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export async function login(email, senha) {
  const response = await api.post("/auth/login", { email, senha });
  return response.data;
}

export async function buscarUsuario(token) {
  const response = await api.get("/auth/me", {
    headers: { Authorization: `Bearer ${token}` },
  });

  return response.data;
}

export default api;
