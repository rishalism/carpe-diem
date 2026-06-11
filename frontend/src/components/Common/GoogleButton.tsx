import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useConfigStore } from "../../store/configStore";
import { useAuthStore } from "../../store/authStore";
import { apiErrorMessage } from "../../services/api";

const GIS_SRC = "https://accounts.google.com/gsi/client";

function loadGis(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) return resolve();
    const existing = document.querySelector(`script[src="${GIS_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      return;
    }
    const script = document.createElement("script");
    script.src = GIS_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google script"));
    document.head.appendChild(script);
  });
}

export function GoogleButton() {
  const navigate = useNavigate();
  const { google_enabled, google_client_id, loaded } = useConfigStore();
  const googleLogin = useAuthStore((s) => s.googleLogin);
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loaded || !google_enabled || !google_client_id || !ref.current) return;
    let cancelled = false;
    loadGis()
      .then(() => {
        if (cancelled || !ref.current || !window.google) return;
        window.google.accounts.id.initialize({
          client_id: google_client_id,
          callback: async (response) => {
            try {
              await googleLogin(response.credential);
              navigate("/");
            } catch (e) {
              setError(apiErrorMessage(e, "Google sign-in failed"));
            }
          },
        });
        window.google.accounts.id.renderButton(ref.current, {
          theme: "outline",
          size: "large",
          width: 320,
          text: "continue_with",
        });
      })
      .catch(() => setError("Could not load Google sign-in"));
    return () => {
      cancelled = true;
    };
  }, [loaded, google_enabled, google_client_id, googleLogin, navigate]);

  if (!google_enabled) return null;

  return (
    <div className="mt-4">
      <div className="mb-3 flex items-center gap-3 text-xs text-stone-400">
        <span className="h-px flex-1 bg-stone-200 dark:bg-stone-700" />
        or
        <span className="h-px flex-1 bg-stone-200 dark:bg-stone-700" />
      </div>
      <div ref={ref} className="flex justify-center" />
      {error && <p className="mt-2 text-center text-sm text-red-500">{error}</p>}
    </div>
  );
}
