import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Input } from "../components/Common/Input";
import { Button } from "../components/Common/Button";
import { GoogleButton } from "../components/Common/GoogleButton";
import { useAuthStore } from "../store/authStore";
import { apiErrorMessage } from "../services/api";
import { isValidEmail } from "../utils/validators";

export function Login() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!isValidEmail(email)) {
      setError("Please enter a valid email");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await login(email.trim(), password);
      navigate("/");
    } catch (err) {
      setError(apiErrorMessage(err, "Could not sign in"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="font-serif text-2xl font-semibold">Welcome back</h1>
      <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
        Sign in to continue your journal.
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
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <Button type="submit" fullWidth loading={loading}>
          Sign in
        </Button>
      </form>
      <GoogleButton />
      <div className="mt-4 flex items-center justify-between text-sm">
        <Link to="/forgot-password" className="text-stone-500 hover:text-brand-600">
          Forgot password?
        </Link>
        <Link to="/register" className="font-medium text-brand-600 hover:text-brand-700">
          Create account
        </Link>
      </div>
    </div>
  );
}
