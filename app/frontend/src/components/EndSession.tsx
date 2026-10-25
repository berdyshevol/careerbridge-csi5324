"use client";

import { useEffect } from "react";
import { useEndSession } from "@/lib/useEndSession";

// A server page found the session refused; only the browser can clear the cookie
export default function EndSession() {
  const endSession = useEndSession();
  useEffect(() => {
    endSession();
    // Once, when the notice appears
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
