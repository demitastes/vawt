import { useState } from "react";
import type { FormEvent } from "react";
import { clearSession, saveSession } from "./authSession";
import type { AuthSession } from "./authSession";

type AuthPanelProps = {
  session: AuthSession | null;
  onSessionChange: (session: AuthSession | null) => void;
};

export function AuthPanel({ session, onSessionChange }: AuthPanelProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim()) return;
    onSessionChange(saveSession(email, displayName));
    setEmail("");
    setDisplayName("");
  }

  function signOut() {
    clearSession();
    onSessionChange(null);
  }

  if (session) {
    return (
      <section className="auth-panel auth-panel--signed-in" aria-label="Account session">
        <span>Signed in as</span>
        <strong>{session.user.displayName}</strong>
        <button type="button" onClick={signOut}>
          Sign out
        </button>
      </section>
    );
  }

  return (
    <section className="auth-panel" aria-label="Account access">
      <div className="auth-tabs" role="tablist" aria-label="Authentication mode">
        <button type="button" className={mode === "login" ? "is-active" : ""} onClick={() => setMode("login")}>
          Login
        </button>
        <button type="button" className={mode === "register" ? "is-active" : ""} onClick={() => setMode("register")}>
          Register
        </button>
      </div>
      <form className="auth-form" onSubmit={submit}>
        <label>
          <span>Email</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            placeholder="you@example.com"
            required
          />
        </label>
        <label>
          <span>Name</span>
          <input
            type="text"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            autoComplete="name"
            placeholder={mode === "login" ? "Optional" : "Display name"}
          />
        </label>
        <button type="submit">{mode === "login" ? "Continue" : "Create account"}</button>
      </form>
    </section>
  );
}
