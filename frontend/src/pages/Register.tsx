import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Input } from "../components/Common/Input";
import { Button } from "../components/Common/Button";
import { GoogleButton } from "../components/Common/GoogleButton";
import { useAuthStore } from "../store/authStore";
import { apiErrorMessage } from "../services/api";
import { isValidEmail, passwordIssue } from "../utils/validators";

export function Register() {
  const navigate = useNavigate();
  const register = useAuthStore((s) => s.register);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!isValidEmail(email)) return setError("Please enter a valid email");
    if (username.trim().length < 2) return setError("Username is too short");
    const pwIssue = passwordIssue(password);
    if (pwIssue) return setError(pwIssue);

    setLoading(true);
    setError(null);
    try {
      await register(email.trim(), username.trim(), password);
      navigate("/");
    } catch (err) {
      setError(apiErrorMessage(err, "Could not create account"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="font-serif text-2xl font-semibold">Create your account</h1>
      <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
        Start capturing the moments that matter.
      </p>
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <Input
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          label="Username"
          name="username"
          autoComplete="nickname"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <Input
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          hint="At least 8 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <Button type="submit" fullWidth loading={loading}>
          Create account
        </Button>
      </form>
      <GoogleButton />
      <p className="mt-4 text-center text-sm text-stone-500">
        Already have an account?{" "}
        <Link to="/login" className="font-medium text-brand-600 hover:text-brand-700">
          Sign in
        </Link>
      </p>
    </div>
  );
}
