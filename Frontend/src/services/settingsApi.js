import api from "./api";

export const getSettingsStatus = async () => {
  const response = await api.get("/api/settings/status");
  return response.data;
};

export const saveGrokApiKey = async (apiKey) => {
  const response = await api.post("/api/settings/save-grok-key", { apiKey });
  return response.data;
};

export const removeGrokApiKey = async () => {
  const response = await api.delete("/api/settings/remove-grok-key");
  return response.data;
};