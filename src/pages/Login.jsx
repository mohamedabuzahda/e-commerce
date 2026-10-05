import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import SocialAuthButtons from "../components/SocialAuthButtons";
import styles from "../styles/Login.module.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login, loginWithGoogle } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const goAfterLogin = () => {
    const destination = location.state?.from;
    navigate(
      destination
        ? `${destination.pathname}${destination.search}${destination.hash}`
        : "/",
      { replace: true }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      setError("Please enter your email and password");
      return;
    }

    try {
      await login(email.trim(), password);
      goAfterLogin();
    } catch (loginError) {
      setError(loginError.message);
    }
  };

  const handleGoogleCredential = async (credential) => {
    setError("");
    try {
      await loginWithGoogle(credential);
      goAfterLogin();
    } catch (googleError) {
      setError(googleError.message || "Google sign-in failed.");
    }
  };

  return (
    <main className={styles.page}>
      <div className={styles.formBox}>
        <h1 className={styles.title}>Welcome Back</h1>
        <p className={styles.subtitle}>Login to your account</p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && <span className={styles.error}>{error}</span>}

          <button type="submit" className={styles.button}>
            Login
          </button>
        </form>

        <div className={styles.socialDivider}>
          <span>or continue with</span>
        </div>

        <SocialAuthButtons onGoogleCredential={handleGoogleCredential} />

        <p className={styles.registerLink}>
          Don't have an account? <Link to="/register">Create Account</Link>
        </p>
      </div>
    </main>
  );
};

export default Login;