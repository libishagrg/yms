import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5140",
  withCredentials: true,
});

export default api;
