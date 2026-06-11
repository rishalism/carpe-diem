import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Modal } from "../Common/Modal";
import { Input } from "../Common/Input";
import { TextArea } from "../Common/TextArea";
import { Button } from "../Common/Button";
import { SPACE_TYPES } from "../../utils/constants";
import type { SpaceType } from "../../types";
import { useSpaceStore } from "../../store/spaceStore";
import { apiErrorMessage } from "../../services/api";
import { cn } from "../../utils/cn";

export function CreateSpaceModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const createSpace = useSpaceStore((s) => s.createSpace);
  const [name, setName] = useState("");
  const [type, setType] = useState<SpaceType>("personal");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function reset() {
    setName("");
    setType("personal");
    setDescription("");
    setError(null);
  }

  async function submit() {
    if (!name.trim()) {
      setError("Please give your space a name");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const space = await createSpace({
        name: name.trim(),
        type,
        description: description.trim() || undefined,
      });
      reset();
      onClose();
      navigate(`/spaces/${space.id}`);
    } catch (e) {
      setError(apiErrorMessage(e, "Could not create space"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create a space"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={submit} loading={saving}>
            Create space
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input
          label="Name"
          name="name"
          placeholder="Our little corner"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
        <div className="space-y-1.5">
          <span className="block text-sm font-medium text-stone-700 dark:text-stone-300">
            Type
          </span>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {SPACE_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setType(t.value)}
                className={cn(
                  "flex flex-col items-start gap-0.5 rounded-xl border p-3 text-left transition",
                  type === t.value
                    ? "border-brand-400 bg-brand-50 dark:bg-brand-900/40"
                    : "border-stone-200 hover:border-stone-300 dark:border-stone-700"
                )}
              >
                <span className="text-xl" aria-hidden="true">
                  {t.emoji}
                </span>
                <span className="text-sm font-medium">{t.label}</span>
                <span className="text-xs text-stone-400">{t.description}</span>
              </button>
            ))}
          </div>
        </div>
        <TextArea
          label="Description (optional)"
          name="description"
          rows={3}
          placeholder="What is this space for?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    </Modal>
  );
}
