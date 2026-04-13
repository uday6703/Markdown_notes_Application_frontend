import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json"
  }
});

export const fetchNotes = async () => {
  const response = await api.get("/notes");
  return response.data;
};

export const createNote = async (payload) => {
  const response = await api.post("/notes", payload);
  return response.data;
};

export const updateNote = async (id, payload) => {
  const response = await api.put(`/notes/${id}`, payload);
  return response.data;
};

export const deleteNote = async (id) => {
  const response = await api.delete(`/notes/${id}`);
  return response.data;
};

export default api;
