import React from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../lib/api";
import { useAuth } from "../../../contexts/AuthContext";

export default function Loginform() {
  const navigate = useNavigate();
  const { setAuthenticated } = useAuth();
  const [showPassword, setShowPassword] = React.useState(false);

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
      const response = await api.post("/login", {
        email: loginInfo.email,
        password: loginInfo.password,
        rememberMe: loginInfo.rememberMe,
      });

      setAuthenticated(response.data);

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
    <>
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
          <div className="password-field">
            <input
              className="form-input password-input"
              type={showPassword ? "text" : "password"}
              id="password"
              name="password"
              placeholder="Enter your password"
              required
              value={loginInfo.password}
              onChange={handleChange}
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M4.93 4.93a1 1 0 0 1 1.41 0l12.73 12.73a1 1 0 0 1-1.41 1.41l-2.1-2.1A11.4 11.4 0 0 1 12 18c-5.1 0-9.4-3.2-11-6 1.02-1.9 2.74-3.78 4.93-5.08L4.93 6.34a1 1 0 0 1 0-1.41Zm6.29 6.29a3 3 0 0 0 3.55 3.55l-3.55-3.55Zm2.93-5.22C16.83 6.7 19.2 8.8 20.99 12c-.72 1.32-1.68 2.52-2.82 3.5l-1.45-1.45A5 5 0 0 0 8 12c0-.77.18-1.5.5-2.15L6.94 8.3A11.1 11.1 0 0 1 12 6c.73 0 1.44.07 2.15.2Z"
                    fill="currentColor"
                  />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M12 5c5.1 0 9.4 3.2 11 6-1.6 2.8-5.9 6-11 6S2.6 13.8 1 11c1.6-2.8 5.9-6 11-6Zm0 2C8.1 7 4.7 9.2 3.2 11 4.7 12.8 8.1 15 12 15s7.3-2.2 8.8-4c-1.5-1.8-4.9-4-8.8-4Zm0 1.5A2.5 2.5 0 1 1 9.5 11 2.5 2.5 0 0 1 12 8.5Z"
                    fill="currentColor"
                  />
                </svg>
              )}
            </button>
          </div>
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

      <div className="verify-inline">
        <div className="verify-inline-header">
          <h2 className="verify-inline-title">Verify your email</h2>
          <p className="verify-inline-subtitle">
            Registered but didn't verify yet? You can verify your email anytime.
          </p>
        </div>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => {
            const email = loginInfo.email?.trim();
            const target = email
              ? `/verify-email?email=${encodeURIComponent(email)}`
              : "/verify-email";
            navigate(target);
          }}
        >
          Go to verification
        </button>
      </div>
    </>
  );
}
