export type AuthSession = {
  token: string;
  user: {
    id: string;
    displayName: string;
    email: string;
  };
  createdAt: string;
};

const SESSION_KEY = "vawt.mockSession";

function createToken(email: string) {
  return `mock-${btoa(`${email}:${Date.now()}`).replace(/=+$/g, "")}`;
}

export function loadSession(): AuthSession | null {
  const rawSession = localStorage.getItem(SESSION_KEY);
  if (!rawSession) return null;

  try {
    return JSON.parse(rawSession) as AuthSession;
  } catch {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

export function saveSession(email: string, displayName: string): AuthSession {
  const cleanEmail = email.trim().toLowerCase();
  const session: AuthSession = {
    token: createToken(cleanEmail),
    user: {
      id: `local-${cleanEmail.replace(/[^a-z0-9]+/g, "-")}`,
      displayName: displayName.trim() || cleanEmail.split("@")[0] || "VAWT voter",
      email: cleanEmail,
    },
    createdAt: new Date().toISOString(),
  };

  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}
