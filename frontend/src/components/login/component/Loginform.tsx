import React from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Loginform() {
  const navigate = useNavigate();

  const [loginInfo, setLoginInfo] = React.useState<{
    email: string;
    password: string;
    rememberMe: boolean;
  }>({
    email: "",
    password: "",
    rememberMe: false,
  });

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const { name, value, type, checked } = event.target;
    setLoginInfo((prevInfo) => ({
      ...prevInfo,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      const response = await axios.post("http://localhost:5140/login", {
        email: loginInfo.email,
        password: loginInfo.password,
      });

      // store user if you want
      localStorage.setItem("user", JSON.stringify(response.data));

      // ✅ go to home
      navigate("/home");
    } catch (error: any) {
      const data = error?.response?.data;
      const msg = data?.message || "Login failed";
      if (data?.needsVerification && data?.email) {
        navigate(`/verify-email?email=${encodeURIComponent(data.email)}`);
        return;
      }
      alert(msg);
      console.error("Login Error:", error);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label className="form-label" htmlFor="email">Email address</label>
        <input
          className="form-input"
          type="email"
          id="email"
          name="email"
          placeholder="you@company.com"
          required
          value={loginInfo.email}
          onChange={handleChange}
        />
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="password">Password</label>
        <input
          className="form-input"
          type="password"
          id="password"
          name="password"
          placeholder="Enter your password"
          required
          value={loginInfo.password}
          onChange={handleChange}
        />
      </div>

      <div className="form-row">
        <div className="checkbox-group">
          <input
            type="checkbox"
            id="remember"
            name="rememberMe"
            checked={loginInfo.rememberMe}
            onChange={handleChange}
          />
          <label htmlFor="remember">Keep me signed in</label>
        </div>

        {/* optional: make this a <Link> later */}
        <a href="#" className="forgot-link">Forgot password?</a>
      </div>

      <button type="submit" className="btn-primary">Sign In</button>
    </form>
  );
}
