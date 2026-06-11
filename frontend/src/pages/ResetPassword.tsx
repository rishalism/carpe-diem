import { FormEvent, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Input } from "../components/Common/Input";
import { Button } from "../components/Common/Button";
import { authService } from "../services/authService";
import { apiErrorMessage } from "../services/api";
import { passwordIssue } from "../utils/validators";

export function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const issue = passwordIssue(password);
    if (issue) return setError(issue);
    if (password !== confirm) return setError("Passwords do not match");

    setLoading(true);
    setError(null);
    try {
      await authService.resetPassword(token, password);
      setDone(true);
    } catch (err) {
      setError(apiErrorMessage(err, "Could not reset password"));
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div>
        <h1 className="font-serif text-2xl font-semibold">Invalid link</h1>
        <p className="mt-2 text-sm text-stone-500">This reset link is missing its token.</p>
        <Link to="/forgot-password" className="mt-4 inline-block text-sm text-brand-600">
          Request a new link
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-serif text-2xl font-semibold">Choose a new password</h1>
      {done ? (
        <div className="mt-4">
          <p className="rounded-xl bg-green-50 p-4 text-sm text-green-800 dark:bg-green-900/30 dark:text-green-200">
            Your password has been updated.
          </p>
          <Link
            to="/login"
            className="mt-4 inline-block font-medium text-brand-600 hover:text-brand-700"
          >
            Sign in
          </Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <Input
            label="New password"
            name="password"
            type="password"
            autoComplete="new-password"
            hint="At least 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Input
            label="Confirm password"
            name="confirm"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="submit" fullWidth loading={loading}>
            Reset password
          </Button>
        </form>
      )}
    </div>
  );
}
