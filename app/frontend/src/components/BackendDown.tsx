"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { API_URL } from "@/lib/api";

export const RETRY_AFTER_MS = 5000;

// A sleeping backend wakes within a few minutes. One that is still silent
// after this many tries is down, and more tries would only cost server renders.
export const MAX_RETRIES = 30;

const apiIsLocal = ["localhost", "127.0.0.1"].includes(new URL(API_URL).hostname);

export default function BackendDown({
  retry = true,
  local = apiIsLocal,
}: {
  retry?: boolean;
  local?: boolean;
}) {
  const router = useRouter();
  const [retries, setRetries] = useState(0);
  const [isRetrying, startRetry] = useTransition();
  const gaveUp = retries >= MAX_RETRIES;

  // The next try is scheduled only when the last one has ended, so tries
  // never pile up while the server takes its time to fail.
  useEffect(() => {
    if (!retry || isRetrying || gaveUp) {
      return;
    }
    const timer = setTimeout(() => {
      setRetries((count) => count + 1);
      startRetry(() => router.refresh());
    }, RETRY_AFTER_MS);
    return () => clearTimeout(timer);
  }, [retry, isRetrying, gaveUp, router]);

  return (
    <div role="alert" className="alert alert-warning">
      <span>
        {local ? (
          <>
            The backend at {API_URL} is not answering. Start it with{" "}
            <code>./mvnw spring-boot:run</code> in the <code>app</code> folder.
          </>
        ) : gaveUp ? (
          <>The server is not answering. Reload the page to try again later.</>
        ) : (
          <>
            The server is not answering yet. It sleeps when nobody visits and takes a few minutes
            to wake up. Please wait: this page tries again by itself.
          </>
        )}
      </span>
    </div>
  );
}
