import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { useUIStore } from "../store/uiStore";
import { authService } from "../services/authService";
import { apiErrorMessage } from "../services/api";
import { passwordIssue } from "../utils/validators";
import { Card } from "../components/Common/Card";
import { Input } from "../components/Common/Input";
import { Button } from "../components/Common/Button";
import { Modal } from "../components/Common/Modal";

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      role="switch"
      aria-checked={on}
      className={`relative h-6 w-11 shrink-0 rounded-full transition ${
        on ? "bg-brand-600" : "bg-stone-300 dark:bg-stone-600"
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${
          on ? "left-[1.375rem]" : "left-0.5"
        }`}
      />
    </button>
  );
}

const PREF_LABELS: { key: string; label: string; desc: string }[] = [
  { key: "new_entry", label: "New entries", desc: "When someone posts in your spaces" },
  { key: "new_comment", label: "Comments", desc: "Replies and comments on your entries" },
  { key: "social", label: "Space activity", desc: "Invitations and new members" },
];

export function Settings() {
  const navigate = useNavigate();
  const { user, setUser, logout } = useAuthStore();
  const { darkMode, setDark } = useUIStore();

  const [prefs, setPrefs] = useState<Record<string, boolean>>(
    (user?.notification_prefs as Record<string, boolean>) ?? {}
  );
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [pwMsg, setPwMsg] = useState<string | null>(null);
  const [pwErr, setPwErr] = useState<string | null>(null);
  const [pwLoading, setPwLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (!user) return null;

  async function toggleDark() {
    const v = !darkMode;
    setDark(v);
    try {
      const updated = await authService.updateProfile({ dark_mode: v });
      setUser(updated);
    } catch {
      /* local preference still applies */
    }
  }

  async function togglePref(key: string) {
    const value = prefs[key] === false; // currently off -> turn on, else off
    const nextPrefs = { ...prefs, [key]: value };
    setPrefs(nextPrefs);
    try {
      const updated = await authService.updateProfile({
        notification_prefs: nextPrefs,
      });
      setUser(updated);
    } catch {
      setPrefs(prefs); // revert on failure
    }
  }

  async function changePassword(e: FormEvent) {
    e.preventDefault();
    const issue = passwordIssue(next);
    if (issue) return setPwErr(issue);
    setPwLoading(true);
    setPwErr(null);
    setPwMsg(null);
    try {
      await authService.changePassword(current, next);
      setPwMsg("Password changed");
      setCurrent("");
      setNext("");
    } catch (err) {
      setPwErr(apiErrorMessage(err, "Could not change password"));
    } finally {
      setPwLoading(false);
    }
  }

  async function exportData() {
    const data = await authService.exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "carpe-diem-export.json";
    link.click();
    URL.revokeObjectURL(url);
  }

  async function deleteAccount() {
    setDeleting(true);
    try {
      await authService.deleteAccount();
      logout();
      navigate("/login");
    } catch (err) {
      alert(apiErrorMessage(err, "Could not delete account"));
      setDeleting(false);
    }
  }

  return (
    <div className="animate-fade-in space-y-8">
      <h1 className="font-serif text-2xl font-semibold">Settings</h1>

      {/* Appearance */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-stone-400">
          Appearance
        </h2>
        <Card className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Dark mode</p>
            <p className="text-xs text-stone-400">Easier on the eyes at night.</p>
          </div>
          <Toggle on={darkMode} onChange={toggleDark} />
        </Card>
      </section>

      {/* Notifications */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-stone-400">
          Notifications
        </h2>
        <Card className="divide-y divide-stone-100 dark:divide-stone-800">
          {PREF_LABELS.map((p, i) => (
            <div
              key={p.key}
              className={`flex items-center justify-between ${i > 0 ? "pt-4" : ""} ${
                i < PREF_LABELS.length - 1 ? "pb-4" : ""
              }`}
            >
              <div>
                <p className="text-sm font-medium">{p.label}</p>
                <p className="text-xs text-stone-400">{p.desc}</p>
              </div>
              <Toggle on={prefs[p.key] !== false} onChange={() => togglePref(p.key)} />
            </div>
          ))}
        </Card>
      </section>

      {/* Security */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-stone-400">
          Change password
        </h2>
        <Card>
          <form onSubmit={changePassword} className="space-y-4">
            <Input
              label="Current password"
              name="current"
              type="password"
              autoComplete="current-password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
            />
            <Input
              label="New password"
              name="new"
              type="password"
              autoComplete="new-password"
              hint="At least 8 characters"
              value={next}
              onChange={(e) => setNext(e.target.value)}
            />
            {pwMsg && <p className="text-sm text-green-600">{pwMsg}</p>}
            {pwErr && <p className="text-sm text-red-500">{pwErr}</p>}
            <div className="flex justify-end">
              <Button type="submit" loading={pwLoading}>
                Update password
              </Button>
            </div>
          </form>
        </Card>
      </section>

      {/* Data */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-stone-400">
          Your data
        </h2>
        <Card className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Export your data</p>
            <p className="text-xs text-stone-400">
              Download all your spaces, entries, and comments as JSON.
            </p>
          </div>
          <Button variant="secondary" onClick={exportData}>
            Export
          </Button>
        </Card>
      </section>

      {/* Danger */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-red-400">
          Danger zone
        </h2>
        <Card className="flex items-center justify-between border-red-100 dark:border-red-900/40">
          <div>
            <p className="text-sm font-medium">Delete account</p>
            <p className="text-xs text-stone-400">
              Permanently removes your account and the spaces you own.
            </p>
          </div>
          <Button variant="danger" onClick={() => setConfirmDelete(true)}>
            Delete
          </Button>
        </Card>
      </section>

      <Modal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Delete your account?"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmDelete(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="danger" onClick={deleteAccount} loading={deleting}>
              Delete forever
            </Button>
          </>
        }
      >
        <p className="text-sm text-stone-600 dark:text-stone-300">
          This permanently deletes your account, the spaces you own, and all their
          entries. This cannot be undone.
        </p>
      </Modal>
    </div>
  );
}
