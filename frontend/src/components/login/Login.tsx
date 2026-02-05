import Backgrond from "./component/Background";
import Loginform from "./component/Loginform";
import LoginHead from "./component/LoginHead";
import {Link} from "react-router-dom"
import "./Login.css"

export default function Login() {
  return (
    <>
      <Backgrond />

      <div className="login-wrapper">
        <LoginHead />

        <div className="login-card">
          <h1 className="card-title">Welcome back</h1>
          <p className="card-subtitle">Sign in to continue to your dashboard</p>

          <Loginform />

          <div className="divider">or</div>

          <p className="register-link">
            New to Ytrac? <Link to="/register">Create an account</Link>
          </p>
        </div>

        <p className="footer-text">Protected by enterprise-grade security</p>
      </div>
    </>
  );
}
