import { Routes, Route, Navigate } from "react-router-dom";
import Register from "./components/Register/Register";
import Login from "./components/login/Login";
import Home from "./components/home/home";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/register" replace />} />
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/home" element={<Home />} />
    </Routes>
  );
}
