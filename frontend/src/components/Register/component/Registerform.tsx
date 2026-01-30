import axios from "axios";
import React from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Registerform() {
  const navigate = useNavigate();

  const [registerInfo, setRegisterInfo] = React.useState<{
    firstname: string;
    lastname: string;
    email: string;
    password: string;
    role: string;
  }>({
    firstname: "",
    lastname: "",
    email: "",
    password: "",
    role: "",
  });
  const [passwordError, setPasswordError] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);

  function isPasswordValid(password: string) {
    const pattern = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$]).{9,}$/;
    return pattern.test(password);
  }

  function handleChange(
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) {
    const { name, value } = event.target;
    if (name === "password") {
      if (value === "") {
        setPasswordError("");
      } else if (!isPasswordValid(value)) {
        setPasswordError(
          "Password must be at least 9 characters and include 1 letter, 1 number, and 1 special symbol (!, @, #, $).",
        );
      } else {
        setPasswordError("");
      }
    }
    setRegisterInfo((prevInfo) => ({
      ...prevInfo,
      [name]: value,
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isPasswordValid(registerInfo.password)) {
      setPasswordError(
        "Password must be at least 9 characters and include 1 letter, 1 number, and 1 special symbol (!, @, #, $).",
      );
      return;
    }

    // ✅ build username from firstname + lastname
    const username =
      registerInfo.firstname.trim() + registerInfo.lastname.trim();

    const payload = {
      username: username, // BACKEND EXPECTS THIS
      email: registerInfo.email,
      password: registerInfo.password,
      role: registerInfo.role,
    };

    console.log("Register Payload:", payload);

    try {
      const response = await axios.post(
        "http://localhost:5140/register",
        payload,
      );

      console.log("Register Response:", response.data);

      // ✅ go to login after success
      navigate("/login");
    } catch (error: any) {
      const msg = error?.response?.data?.message || "Registration failed";
      console.error("Register Error:", msg);
      alert(msg);
    }
  }

  return (
    <form className="register-form" onSubmit={handleSubmit}>
      <div className="form-row-2">
        <div className="form-group">
          <label className="form-label" htmlFor="firstname">
            First name
          </label>
          <input
            className="form-input"
            type="text"
            id="firstname"
            name="firstname"
            placeholder="John"
            required
            value={registerInfo.firstname}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="lastname">
            Last name
          </label>
          <input
            className="form-input"
            type="text"
            id="lastname"
            name="lastname"
            placeholder="Doe"
            required
            value={registerInfo.lastname}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="email">
          Work email
        </label>
        <input
          className="form-input"
          type="email"
          id="email"
          name="email"
          placeholder="you@company.com"
          required
          value={registerInfo.email}
          onChange={handleChange}
        />
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="password">
          Password
        </label>
        <div className="password-field">
          <input
            className="form-input"
            type={showPassword ? "text" : "password"}
            id="password"
            name="password"
            placeholder="Create a strong password"
            pattern={String.raw`^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$]).{9,}$`}
            title="At least 9 characters with 1 letter, 1 number, and 1 special symbol (!, @, #, $)."
            autoComplete="new-password"
            required
            value={registerInfo.password}
            onChange={handleChange}
          />

          <button
            type="button"
            className="password-toggle"
            aria-label={showPassword ? "Hide password" : "Show password"}
            onClick={() => setShowPassword((prev) => !prev)}
          >
            {showPassword ? (
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path
                  d="M3 3l18 18M10.73 10.73a3 3 0 004.24 4.24M9.88 5.1A9.94 9.94 0 0112 5c5.52 0 10 5 10 7 0 .76-1.44 3.2-3.9 5.02M6.13 6.13C3.3 8.1 2 10.9 2 12c0 2 4.48 7 10 7 1.31 0 2.57-.28 3.74-.8"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path
                  d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle
                  cx="12"
                  cy="12"
                  r="3"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                />
              </svg>
            )}
          </button>
        </div>
        {passwordError ? (
          <div className="form-error" role="alert">
            {passwordError}
          </div>
        ) : null}
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="role">
          Your role
        </label>
        <select
          className="form-select"
          id="role"
          name="role"
          required
          value={registerInfo.role}
          onChange={handleChange}
        >
          <option value="" disabled>
            Select your role
          </option>
          <option value="Administrator">Administrator</option>
          <option value="Yard Manager">Yard Manager</option>
        </select>
      </div>

      <div className="checkbox-group">
        <input type="checkbox" id="terms" required />
        <label htmlFor="terms">
          I agree to the <a href="#">Terms of Service</a> and{" "}
          <a href="#">Privacy Policy</a>
        </label>
      </div>

      <button type="submit" className="btn-primary">
        Create Account
      </button>

      <p className="login-link">
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </form>
  );
}
