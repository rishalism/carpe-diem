import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { Input } from "../components/Common/Input";
import { Button } from "../components/Common/Button";
import { authService } from "../services/authService";
import { apiErrorMessage } from "../services/api";
import { isValidEmail } from "../utils/validators";

export function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [devToken, setDevToken] = useState<string | null>(null);
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
      const res = await authService.forgotPassword(email.trim());
      setDevToken(res.reset_token);
      setSubmitted(true);
    } catch (err) {
      setError(apiErrorMessage(err, "Something went wrong"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="font-serif text-2xl font-semibold">Reset your password</h1>
      {submitted ? (
        <div className="mt-4 space-y-3">
          <p className="rounded-xl bg-brand-50 p-4 text-sm text-brand-800 dark:bg-brand-900/40 dark:text-brand-200">
            If an account exists for <strong>{email}</strong>, a reset link has been
            sent.
          </p>
          {devToken && (
            <p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
              Dev mode: no email is sent. Use your reset link:{" "}
              <Link
                to={`/reset-password?token=${devToken}`}
                className="font-medium underline"
              >
                /reset-password
              </Link>
            </p>
          )}
        </div>
      ) : (
        <>
          <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
            Enter your email and we’ll send you a reset link.
          </p>
          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <Input
              label="Email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={error}
            />
            <Button type="submit" fullWidth loading={loading}>
              Send reset link
            </Button>
          </form>
        </>
      )}
      <p className="mt-4 text-center text-sm text-stone-500">
        <Link to="/login" className="font-medium text-brand-600 hover:text-brand-700">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
