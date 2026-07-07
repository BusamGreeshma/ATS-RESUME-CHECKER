import { apiClient } from "./client";

export const interviewApi = {
  start: (payload) =>
    apiClient.post("/interview/start", payload).then((r) => r.data),
  submitAnswer: (id, answer) =>
    apiClient.post(`/interview/${id}/answer`, { answer }).then((r) => r.data),
  finishEarly: (id) =>
    apiClient.post(`/interview/${id}/finish`).then((r) => r.data),
  getHistory: () =>
    apiClient.get("/interview/history").then((r) => r.data),
  getDetails: (id) =>
    apiClient.get(`/interview/${id}`).then((r) => r.data),
};
