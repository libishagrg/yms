import { Routes, Route, Navigate } from "react-router-dom";
import Register from "./components/Register/Register";
import Login from "./components/login/Login";
import Home from "./components/home/home";
import VerifyEmail from "./components/verify/VerifyEmail";
import AppShell from "./components/layout/AppShell";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/register" replace />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/login" element={<Login />} />
      <Route element={<AppShell />}>
        <Route path="/home" element={<Home />} />
      </Route>
    </Routes>
  );
}
