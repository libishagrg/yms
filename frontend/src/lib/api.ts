import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5140",
  withCredentials: true,
  timeout: 4000,
});

export default api;
