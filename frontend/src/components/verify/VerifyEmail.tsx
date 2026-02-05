import "./VerifyEmail.css";
import React from "react";
import axios from "axios";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

type Feedback = { type: "success" | "error" | "info"; message: string } | null;

export default function VerifyEmail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialEmail = searchParams.get("email") ?? "";

  const [email, setEmail] = React.useState(initialEmail);
  const [code, setCode] = React.useState("");
  const [feedback, setFeedback] = React.useState<Feedback>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isResending, setIsResending] = React.useState(false);
  const [verified, setVerified] = React.useState(false);

  async function handleVerify(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    setIsSubmitting(true);

    try {
      const response = await axios.post("http://localhost:5140/verify-email", {
        email,
        code,
      });
      setVerified(true);
      setFeedback({ type: "success", message: response.data?.message || "Email verified." });
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
      const response = await axios.post("http://localhost:5140/resend-verification", {
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
            Enter the 6-digit code we sent to your email.
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
              pattern="\\d{6}"
              placeholder="123456"
              required
              value={code}
              onChange={(event) => setCode(event.target.value)}
              disabled={verified}
            />
          </div>

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
