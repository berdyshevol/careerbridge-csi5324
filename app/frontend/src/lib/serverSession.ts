import { cookies } from "next/headers";
import { parseSession, SESSION_COOKIE, type Session } from "./session";

export async function serverSession(): Promise<Session | null> {
  return parseSession((await cookies()).get(SESSION_COOKIE)?.value);
}
