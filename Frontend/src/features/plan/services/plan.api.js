import api from "../../../services/api";

const API = "/api/plans";

export const createPlan = async (data) => {
  const res = await api.post(API, data);
  return res.data;
};

export const getPlans = async () => {
  const res = await api.get(API);
  return res.data;
};

export const getPlanById = async (planId) => {
  const res = await api.get(`${API}/${planId}`);
  return res.data;
};

export const toggleTask = async (planId, dayIndex, taskIndex) => {
  const res = await api.patch(
    `${API}/${planId}/day/${dayIndex}/task/${taskIndex}`,
    {}
  );
  return res.data;
};

export const addTask = async (planId, dayIndex, text) => {
  const res = await api.post(
    `${API}/${planId}/day/${dayIndex}`,
    { text }
  );
  return res.data;
};

export const deleteTask = async (planId, dayIndex, taskIndex) => {
  const res = await api.delete(
    `${API}/${planId}/day/${dayIndex}/task/${taskIndex}`
  );
  return res.data;
};