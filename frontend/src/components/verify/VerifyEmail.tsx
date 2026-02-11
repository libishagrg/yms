import "./VerifyEmail.css";
import React from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import api from "../../lib/api";

type Feedback = { type: "success" | "error" | "info"; message: string } | null;

export default function VerifyEmail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialEmail = searchParams.get("email") ?? "";
  const needsPassword = searchParams.get("setup") === "1";

  const [email, setEmail] = React.useState(initialEmail);
  const [code, setCode] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [feedback, setFeedback] = React.useState<Feedback>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isResending, setIsResending] = React.useState(false);
  const [verified, setVerified] = React.useState(false);

  function isPasswordValid(password: string) {
    const pattern = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$]).{9,}$/;
    return pattern.test(password);
  }

  async function handleVerify(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    setIsSubmitting(true);

    try {
      if (needsPassword) {
        if (!isPasswordValid(newPassword)) {
          setFeedback({
            type: "error",
            message:
              "Password must be at least 9 characters and include 1 letter, 1 number, and 1 special symbol (!, @, #, $).",
          });
          return;
        }
        if (newPassword !== confirmPassword) {
          setFeedback({ type: "error", message: "Passwords do not match." });
          return;
        }
        const response = await api.post("/verify-email-set-password", {
          email,
          code,
          newPassword,
        });
        setVerified(true);
        setFeedback({ type: "success", message: response.data?.message || "Email verified." });
      } else {
        const response = await api.post("/verify-email", {
          email,
          code,
        });
        setVerified(true);
        setFeedback({ type: "success", message: response.data?.message || "Email verified." });
      }
    } catch (error: any) {
      const msg = error?.response?.data?.message || "Verification failed";
      setFeedback({ type: "error", message: msg });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResend() {
    setFeedback(null);
    setIsResending(true);

    try {
      const response = await api.post("/resend-verification", {
        email,
      });
      setFeedback({ type: "info", message: response.data?.message || "Verification email resent." });
    } catch (error: any) {
      const msg = error?.response?.data?.message || "Resend failed";
      setFeedback({ type: "error", message: msg });
    } finally {
      setIsResending(false);
    }
  }

  return (
    <div className="verify-page">
      <div className="verify-card">
        <div className="verify-header">
          <div className="verify-brand">YMS</div>
          <h1 className="verify-title">Verify your email</h1>
          <p className="verify-subtitle">
            {needsPassword
              ? "Enter the 6-digit code and set your new password."
              : "Enter the 6-digit code we sent to your email."}
          </p>
        </div>

        <form onSubmit={handleVerify} className="verify-form">
          <div className="form-group">
            <label className="form-label" htmlFor="email">
              Email address
            </label>
            <input
              className="form-input"
              type="email"
              id="email"
              name="email"
              placeholder="you@company.com"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={verified}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="code">
              Verification code
            </label>
            <input
              className="form-input"
              type="text"
              id="code"
              name="code"
              inputMode="numeric"
              maxLength={6}
              placeholder="123456"
              required
              value={code}
              onChange={(event) => {
                const next = event.target.value.replace(/[^0-9]/g, "").slice(0, 6);
                setCode(next);
              }}
              disabled={verified}
            />
          </div>

          {needsPassword ? (
            <>
              <div className="form-group">
                <label className="form-label" htmlFor="new-password">
                  New password
                </label>
                <div className="password-field">
                  <input
                    className="form-input"
                    type={showPassword ? "text" : "password"}
                    id="new-password"
                    name="new-password"
                    placeholder="Create a strong password"
                    required
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    disabled={verified}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowPassword((prev) => !prev)}
                    disabled={verified}
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
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="confirm-password">
                  Confirm password
                </label>
                <input
                  className="form-input"
                  type={showPassword ? "text" : "password"}
                  id="confirm-password"
                  name="confirm-password"
                  placeholder="Re-enter your password"
                  required
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  disabled={verified}
                />
              </div>
            </>
          ) : null}

          {feedback ? (
            <div className={`verify-feedback ${feedback.type}`} role="alert">
              {feedback.message}
            </div>
          ) : null}

          <button type="submit" className="btn-primary" disabled={isSubmitting || verified}>
            {isSubmitting ? "Verifying..." : "Verify Email"}
          </button>
        </form>

        <div className="verify-actions">
          <button
            type="button"
            className="btn-link"
            onClick={handleResend}
            disabled={isResending || verified || !email}
          >
            {isResending ? "Sending..." : "Resend code"}
          </button>
          <button type="button" className="btn-link" onClick={() => navigate("/login")}>
            Back to login
          </button>
        </div>

        {verified ? (
          <p className="verify-footer">
            Your email is verified. <Link to="/login">Sign in now</Link>
          </p>
        ) : (
          <p className="verify-footer">
            Didn't get the email? Check your spam folder or{" "}
            <button type="button" className="btn-link-inline" onClick={handleResend} disabled={isResending || !email}>
              resend the code
            </button>
            .
          </p>
        )}
      </div>
    </div>
  );
}
