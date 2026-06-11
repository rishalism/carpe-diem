import { useEffect, useState } from "react";
import type { Invitation } from "../../types";
import { invitationService } from "../../services/invitationService";
import { apiErrorMessage } from "../../services/api";
import { isValidEmail } from "../../utils/validators";
import { Modal } from "../Common/Modal";
import { Input } from "../Common/Input";
import { Button } from "../Common/Button";

interface InviteModalProps {
  open: boolean;
  onClose: () => void;
  spaceId: string;
  onInvited?: () => void;
}

export function InviteModal({ open, onClose, spaceId, onInvited }: InviteModalProps) {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState<Invitation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  async function loadPending() {
    try {
      const list = await invitationService.listForSpace(spaceId);
      setPending(list.filter((i) => i.status === "pending"));
    } catch {
      // owner-only; ignore
    }
  }

  useEffect(() => {
    if (open) loadPending();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, spaceId]);

  async function invite() {
    if (!isValidEmail(email)) {
      setError("Enter a valid email");
      return;
    }
    setSending(true);
    setError(null);
    try {
      await invitationService.create(spaceId, email.trim());
      setEmail("");
      await loadPending();
      onInvited?.();
    } catch (e) {
      setError(apiErrorMessage(e, "Could not send invitation"));
    } finally {
      setSending(false);
    }
  }

  async function cancel(id: string) {
    await invitationService.cancel(spaceId, id);
    await loadPending();
  }

  function copyLink(token: string) {
    const url = `${window.location.origin}/invite/${token}`;
    navigator.clipboard?.writeText(url);
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Invite to this space"
      footer={
        <Button variant="secondary" onClick={onClose}>
          Done
        </Button>
      }
    >
      <div className="space-y-4">
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Input
              label="Email"
              name="invite-email"
              type="email"
              placeholder="friend@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={error}
            />
          </div>
          <Button onClick={invite} loading={sending}>
            Invite
          </Button>
        </div>

        {pending.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-400">
              Pending invitations
            </p>
            <ul className="space-y-2">
              {pending.map((inv) => (
                <li
                  key={inv.id}
                  className="flex items-center justify-between rounded-xl border border-stone-100 px-3 py-2 text-sm dark:border-stone-800"
                >
                  <span className="truncate">{inv.email}</span>
                  <div className="flex items-center gap-3 text-xs">
                    <button
                      onClick={() => copyLink(inv.token)}
                      className="text-brand-600 hover:text-brand-700"
                    >
                      Copy link
                    </button>
                    <button
                      onClick={() => cancel(inv.id)}
                      className="text-stone-400 hover:text-red-500"
                    >
                      Cancel
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Modal>
  );
}
