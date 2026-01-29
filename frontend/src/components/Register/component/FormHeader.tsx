export default function FormHeader() {
  return (
    <div className="form-header">
      <a href="login.html" className="back-link">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M10 19l-7-7m0 0l7-7m-7 7h18"
          />
        </svg>
        Back to login
      </a>
      <h1 className="form-title">Create your account</h1>
      <p className="form-subtitle">
        Start managing your yard operations efficiently
      </p>
    </div>
  );
}
