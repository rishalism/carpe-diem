import { useEffect, useState } from "react";
import { useAuthStore } from "../store/authStore";
import { useSpaceStore } from "../store/spaceStore";
import { useUIStore } from "../store/uiStore";
import { authService } from "../services/authService";
import { apiErrorMessage } from "../services/api";
import { formatDate } from "../utils/formatters";
import { Avatar } from "../components/Common/Avatar";
import { Card } from "../components/Common/Card";
import { Input } from "../components/Common/Input";
import { TextArea } from "../components/Common/TextArea";
import { Button } from "../components/Common/Button";

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <Card className="text-center">
      <p className="font-serif text-2xl font-semibold text-brand-700 dark:text-brand-300">
        {value}
      </p>
      <p className="mt-1 text-xs uppercase tracking-wide text-stone-400">{label}</p>
    </Card>
  );
}

export function Profile() {
  const { user, setUser } = useAuthStore();
  const { spaces, fetchSpaces, loaded } = useSpaceStore();
  const { darkMode, setDark } = useUIStore();

  const [username, setUsername] = useState(user?.username ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loaded) fetchSpaces();
  }, [loaded, fetchSpaces]);

  if (!user) return null;

  const totalEntries = spaces.reduce((sum, s) => sum + s.entry_count, 0);

  async function onSave() {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const updated = await authService.updateProfile({
        username: username.trim(),
        bio: bio.trim(),
      });
      setUser(updated);
      setMessage("Profile saved");
    } catch (e) {
      setError(apiErrorMessage(e, "Could not save profile"));
    } finally {
      setSaving(false);
    }
  }

  async function onToggleDark() {
    const next = !darkMode;
    setDark(next);
    try {
      const updated = await authService.updateProfile({ dark_mode: next });
      setUser(updated);
    } catch {
      // Local preference still applies even if the sync fails.
    }
  }

  return (
    <div className="animate-fade-in space-y-8">
      <header className="flex items-center gap-4">
        <Avatar name={user.username} src={user.avatar_url} size={64} />
        <div>
          <h1 className="font-serif text-2xl font-semibold">{user.username}</h1>
          <p className="text-sm text-stone-400">
            {user.email} · Joined {formatDate(user.created_at)}
          </p>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat label="Spaces" value={spaces.length} />
        <Stat label="Entries" value={totalEntries} />
        <Stat label="Member since" value={new Date(user.created_at).getFullYear()} />
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-stone-400">
          Edit profile
        </h2>
        <Card className="space-y-4">
          <Input
            label="Username"
            name="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <TextArea
            label="Bio"
            name="bio"
            rows={3}
            placeholder="A little about you…"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />
          {message && <p className="text-sm text-green-600">{message}</p>}
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex justify-end">
            <Button onClick={onSave} loading={saving}>
              Save changes
            </Button>
          </div>
        </Card>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-stone-400">
          Preferences
        </h2>
        <Card className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Dark mode</p>
            <p className="text-xs text-stone-400">Easier on the eyes at night.</p>
          </div>
          <button
            onClick={onToggleDark}
            role="switch"
            aria-checked={darkMode}
            className={`relative h-6 w-11 rounded-full transition ${
              darkMode ? "bg-brand-600" : "bg-stone-300"
            }`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${
                darkMode ? "left-[1.375rem]" : "left-0.5"
              }`}
            />
          </button>
        </Card>
      </section>
    </div>
  );
}
