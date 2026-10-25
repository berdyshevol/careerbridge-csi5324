"use client";

import { useRouter } from "next/navigation";
import { clearSession } from "./session";

// The backend refused the token: forget it and redraw the header, which the server renders
export function useEndSession(): () => void {
  const router = useRouter();
  return () => {
    clearSession();
    router.refresh();
  };
}
