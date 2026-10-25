// ADR-0010: the session is the backend's token plus who it belongs to. It lives in a cookie on the
// frontend's own site, so the server-rendered pages read it as well as the browser; the backend
// never sees the cookie, only the token sent as a bearer header.

export type Role = "APPLICANT" | "RECRUITER" | "ADMINISTRATOR";

export type SessionUser = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  role: Role;
};

export type Session = { token: string; user: SessionUser };

export const SESSION_COOKIE = "cb_session";
const SESSION_SECONDS = 8 * 60 * 60; // as long as the backend's token

export const ROLE_LABELS: Record<Role, string> = {
  APPLICANT: "Applicant",
  RECRUITER: "Recruiter",
  ADMINISTRATOR: "Administrator",
};

// A hand-edited or outdated cookie is no session, never an error on every page
export function parseSession(value: string | undefined): Session | null {
  if (!value) {
    return null;
  }
  // The browser hands the cookie over encoded, Next.js already decoded
  const text = value.startsWith("%") ? safeDecode(value) : value;
  try {
    const session = JSON.parse(text);
    const user = session?.user;
    const valid =
      typeof session?.token === "string" &&
      typeof user?.firstName === "string" &&
      typeof user?.lastName === "string" &&
      typeof user?.role === "string" &&
      Object.hasOwn(ROLE_LABELS, user.role);
    return valid ? session : null;
  } catch {
    return null;
  }
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function readSession(): Session | null {
  if (typeof document === "undefined") {
    return null;
  }
  const entry = document.cookie.split("; ").find((cookie) => cookie.startsWith(`${SESSION_COOKIE}=`));
  return parseSession(entry?.slice(SESSION_COOKIE.length + 1));
}

export function saveSession(session: Session) {
  writeCookie(encodeURIComponent(JSON.stringify(session)), SESSION_SECONDS);
}

export function clearSession() {
  writeCookie("", 0);
}

function writeCookie(value: string, maxAge: number) {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${SESSION_COOKIE}=${value}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
}

// Only a page of this site, so a crafted link cannot send the user elsewhere after logging in.
// Compared after the browser's own parsing, which reads "/\evil.example" as another site.
export function safeNext(next: string | undefined, role: Role): string {
  const home = role === "ADMINISTRATOR" ? "/admin/postings" : role === "RECRUITER" ? "/recruiter/postings/new" : "/";
  if (!next || !next.startsWith("/") || /[\\\u0000-\u001f]/.test(next)) {
    return home;
  }
  const here = window.location.origin;
  const url = new URL(next, here);
  return url.origin === here && !url.pathname.startsWith("/login") ? url.pathname + url.search + url.hash : home;
}
