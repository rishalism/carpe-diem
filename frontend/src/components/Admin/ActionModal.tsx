import { useEffect, useState } from "react";
import { Modal } from "../Common/Modal";
import { Button } from "../Common/Button";
import { TextArea } from "../Common/TextArea";
import { Input } from "../Common/Input";
import { apiErrorMessage } from "../../services/api";

export interface ActionModalProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel: string;
  variant?: "primary" | "danger";
  /** When set, show a reason field validated to at least `minReason` chars. */
  requireReason?: boolean;
  reasonLabel?: string;
  minReason?: number;
  /** When set, require the user to type this exact value to confirm. */
  confirmText?: string;
  confirmTextLabel?: string;
  onConfirm: (reason: string) => Promise<void>;
  onClose: () => void;
}

export function ActionModal({
  open,
  title,
  description,
  confirmLabel,
  variant = "primary",
  requireReason = false,
  reasonLabel = "Reason",
  minReason = 5,
  confirmText,
  confirmTextLabel = "Type to confirm",
  onConfirm,
  onClose,
}: ActionModalProps) {
  const [reason, setReason] = useState("");
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setReason("");
      setTyped("");
      setError(null);
      setBusy(false);
    }
  }, [open]);

  const reasonOk = !requireReason || reason.trim().length >= minReason;
  const typedOk = !confirmText || typed === confirmText;
  const canConfirm = reasonOk && typedOk && !busy;

  async function handleConfirm() {
    if (!canConfirm) return;
    setBusy(true);
    setError(null);
    try {
      await onConfirm(reason.trim());
      onClose();
    } catch (err) {
      setError(apiErrorMessage(err));
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button variant={variant} onClick={handleConfirm} loading={busy} disabled={!canConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        {description && (
          <p className="text-sm text-stone-600 dark:text-stone-300">{description}</p>
        )}
        {requireReason && (
          <TextArea
            label={reasonLabel}
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={`At least ${minReason} characters…`}
          />
        )}
        {confirmText && (
          <Input
            label={confirmTextLabel}
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder={confirmText}
          />
        )}
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    </Modal>
  );
}
