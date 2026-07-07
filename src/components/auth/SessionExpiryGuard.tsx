// Watches the signed-in user's access-token expiry and keeps active sessions
// alive: while the user is interacting with the app, the token is renewed
// silently ahead of expiry. If they've gone idle, a "still there?" prompt
// asks before renewing — declining (or letting it time out) signs them out.
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/patterns";
import { Modal } from "@/components/common/Modal";
import { useAuthSession, authApi } from "@/api/auth";
import { refreshSession } from "@/api/backend";

// How long before expiry to act.
const WARNING_LEAD_MS = 60_000;
// If the user interacted with the page within this window when the warning
// fires, treat them as "actively browsing" and renew without asking.
const ACTIVE_WITHIN_MS = 60_000;
const ACTIVITY_EVENTS = ["mousedown", "mousemove", "keydown", "touchstart", "scroll", "wheel"];

export function SessionExpiryGuard() {
  const session = useAuthSession();
  const navigate = useNavigate();
  const lastActivityRef = useRef(Date.now());
  const [prompting, setPrompting] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    function markActive() {
      lastActivityRef.current = Date.now();
    }
    ACTIVITY_EVENTS.forEach((evt) => window.addEventListener(evt, markActive, { passive: true }));
    return () => {
      ACTIVITY_EVENTS.forEach((evt) => window.removeEventListener(evt, markActive));
    };
  }, []);

  async function forceLogout() {
    setPrompting(false);
    try {
      await authApi.logout();
    } catch {
      /* session is being torn down regardless */
    }
    navigate({ to: "/signin", replace: true });
  }

  useEffect(() => {
    if (!session) {
      setPrompting(false);
      return;
    }

    let warnTimer: ReturnType<typeof setTimeout>;
    let countdownTimer: ReturnType<typeof setInterval>;
    let expiryTimer: ReturnType<typeof setTimeout>;

    async function onWarning() {
      const idleMs = Date.now() - lastActivityRef.current;
      if (idleMs < ACTIVE_WITHIN_MS) {
        // Actively browsing — renew quietly, no interruption.
        try {
          await refreshSession();
        } catch {
          await forceLogout();
        }
        return;
      }

      // Idle — ask before renewing.
      setSecondsLeft(Math.round(WARNING_LEAD_MS / 1000));
      setPrompting(true);
      countdownTimer = setInterval(() => {
        setSecondsLeft((s) => Math.max(0, s - 1));
      }, 1000);
      expiryTimer = setTimeout(() => {
        void forceLogout();
      }, WARNING_LEAD_MS);
    }

    const msUntilWarning = session.expiresAt - Date.now() - WARNING_LEAD_MS;
    warnTimer = setTimeout(() => void onWarning(), Math.max(msUntilWarning, 0));

    return () => {
      clearTimeout(warnTimer);
      clearInterval(countdownTimer);
      clearTimeout(expiryTimer);
    };
    // Re-arm whenever a new token (and expiresAt) comes in, e.g. after renewal.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.expiresAt]);

  async function onContinue() {
    lastActivityRef.current = Date.now();
    setPrompting(false);
    try {
      await refreshSession();
    } catch {
      await forceLogout();
    }
  }

  return (
    <Modal
      open={prompting}
      onClose={onContinue}
      title="Still there?"
      footer={
        <>
          <Button variant="danger" onClick={() => void forceLogout()}>
            Sign out
          </Button>
          <Button variant="success" onClick={() => void onContinue()}>
            Stay signed in
          </Button>
        </>
      }
    >
      <p style={{ fontSize: 14, color: "#4B5875" }}>
        Your session is about to expire in {secondsLeft}s due to inactivity. Would you like to
        stay signed in?
      </p>
    </Modal>
  );
}
