import api from "../../../services/api";

const API = "/api/admin";

export const getUsers = async () => {
  const res = await api.get(`${API}/users`);
  return res.data;
};

export const deleteUser = async (id) => {
  const res = await api.delete(`${API}/users/${id}`);
  return res.data;
};

export const toggleBanUser = async (id) => {
  const res = await api.patch(`${API}/users/ban/${id}`);
  return res.data;
};
