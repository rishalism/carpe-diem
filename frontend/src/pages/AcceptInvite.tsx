import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { InvitationPublic } from "../types";
import { invitationService } from "../services/invitationService";
import { useSpaceStore } from "../store/spaceStore";
import { apiErrorMessage } from "../services/api";
import { Card } from "../components/Common/Card";
import { Button } from "../components/Common/Button";
import { FullPageSpinner } from "../components/Common/Spinner";
import { EmptyState } from "../components/Common/EmptyState";

export function AcceptInvite() {
  const { token = "" } = useParams();
  const navigate = useNavigate();
  const fetchSpaces = useSpaceStore((s) => s.fetchSpaces);
  const [invite, setInvite] = useState<InvitationPublic | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    invitationService
      .getPublic(token)
      .then((i) => active && setInvite(i))
      .catch((e) => active && setLoadError(apiErrorMessage(e, "Invitation not found")));
    return () => {
      active = false;
    };
  }, [token]);

  async function accept() {
    setBusy(true);
    setActionError(null);
    try {
      const space = await invitationService.accept(token);
      await fetchSpaces();
      navigate(`/spaces/${space.id}`);
    } catch (e) {
      setActionError(apiErrorMessage(e, "Could not accept invitation"));
      setBusy(false);
    }
  }

  async function decline() {
    setBusy(true);
    try {
      await invitationService.decline(token);
      navigate("/");
    } catch (e) {
      setActionError(apiErrorMessage(e, "Could not decline"));
      setBusy(false);
    }
  }

  if (loadError) {
    return (
      <EmptyState
        emoji="✉️"
        title="Invitation unavailable"
        description={loadError}
        action={<Button variant="secondary" onClick={() => navigate("/")}>Go to dashboard</Button>}
      />
    );
  }

  if (!invite) return <FullPageSpinner />;

  const settled = invite.status !== "pending";

  return (
    <div className="mx-auto max-w-md py-10">
      <Card className="text-center">
        <div className="mb-3 text-4xl" aria-hidden="true">✉️</div>
        <h1 className="font-serif text-2xl font-semibold">
          Join “{invite.space_name}”
        </h1>
        <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">
          {invite.inviter_name} invited you to join this space as a {invite.role}.
        </p>

        {settled ? (
          <p className="mt-6 rounded-xl bg-stone-100 p-3 text-sm text-stone-500 dark:bg-stone-800">
            This invitation is {invite.status}.
          </p>
        ) : (
          <div className="mt-6 flex justify-center gap-3">
            <Button variant="secondary" onClick={decline} disabled={busy}>
              Decline
            </Button>
            <Button onClick={accept} loading={busy}>
              Accept invitation
            </Button>
          </div>
        )}
        {actionError && <p className="mt-3 text-sm text-red-500">{actionError}</p>}
      </Card>
    </div>
  );
}
