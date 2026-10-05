import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import SocialAuthButtons from "../components/SocialAuthButtons";
import { readList, USERS_KEY } from "../data/commerceStore";
import styles from "../styles/Register.module.css";

const Register = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "customer",
  });

  const [errors, setErrors] = useState({});
  const [canSetUpAdmin] = useState(
    () => !readList(USERS_KEY).some((user) => user.role === "admin")
  );
  const { register, loginWithGoogle } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const goAfterAuth = () => {
    const destination = location.state?.from;
    navigate(
      destination
        ? `${destination.pathname}${destination.search}${destination.hash}`
        : "/",
      { replace: true }
    );
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Please enter your name";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Please enter your email";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (!formData.password) {
      newErrors.password = "Please enter a password";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      try {
        const account = {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
        };
        await register({ ...account, email: account.email.trim() });
        goAfterAuth();
      } catch (registrationError) {
        setErrors({ form: registrationError.message });
      }
    }
  };

  const handleGoogleCredential = async (credential) => {
    setErrors({});
    try {
      await loginWithGoogle(credential);
      goAfterAuth();
    } catch (googleError) {
      setErrors({ form: googleError.message || "Google sign-in failed." });
    }
  };

  return (
    <main className={styles.page}>
      <div className={styles.formBox}>
        <h1 className={styles.title}>Create Account</h1>

        <p className={styles.subtitle}>
          Create your account to continue shopping
        </p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label htmlFor="name">Full Name</label>
            <input
              id="name"
              name="name"
              type="text"
              placeholder="Enter your name"
              value={formData.name}
              onChange={handleChange}
            />
            {errors.name && <span className={styles.error}>{errors.name}</span>}
          </div>

          <div className={styles.field}>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
            />
            {errors.email && <span className={styles.error}>{errors.email}</span>}
          </div>

          <div className={styles.field}>
            <label htmlFor="role">Account role</label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
            >
              {canSetUpAdmin && <option value="admin">Admin setup</option>}
              <option value="user">User</option>
              <option value="customer">Customer</option>
              <option value="seller">Seller</option>
            </select>
          </div>

          <div className={styles.field}>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
            />
            {errors.password && (
              <span className={styles.error}>{errors.password}</span>
            )}
          </div>

          <div className={styles.field}>
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={handleChange}
            />
            {errors.confirmPassword && (
              <span className={styles.error}>{errors.confirmPassword}</span>
            )}
          </div>

          {errors.form && <span className={styles.error}>{errors.form}</span>}

          <button type="submit" className={styles.button}>
            Create Account
          </button>
        </form>

        <div className={styles.socialDivider}>
          <span>or continue with</span>
        </div>

        <SocialAuthButtons onGoogleCredential={handleGoogleCredential} />

        <p className={styles.loginLink}>
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </main>
  );
};

export default Register;