// The only file that knows about Next.js request handling.
// It turns an endpoint map (plain objects) into route handlers for
// src/app/api/[...path]/route.js. Endpoints, services and repositories
// never see a Request or a Response.

import { DomainError } from "@/services/errors";

const DEFAULT_COOKIE_NAME = "session";
const DEFAULT_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

// Domain error code -> HTTP status, for every endpoint. An endpoint's own
// `errors` table adds codes or overrides these.
const DEFAULT_ERROR_STATUS = {
  VALIDATION_ERROR: 400,
  NOT_FOUND: 404,
  CONFLICT: 409,
};

// Matches "/:id/apply" against ["12", "apply"]; returns the params or null.
function matchPath(pattern, segments) {
  const parts = pattern.split("/").filter(Boolean);
  if (parts.length !== segments.length) return null;

  const params = {};
  for (let i = 0; i < parts.length; i++) {
    if (parts[i].startsWith(":")) {
      params[parts[i].slice(1)] = decodeURIComponent(segments[i]);
    } else if (parts[i] !== segments[i]) {
      return null;
    }
  }
  return params;
}

function findEndpoint(endpointMap, method, [namespace, ...rest]) {
  for (const endpoint of endpointMap[namespace] ?? []) {
    if (endpoint.method !== method) continue;
    const params = matchPath(endpoint.path, rest);
    if (params) return { endpoint, params };
  }
  return null;
}

function readCookie(request, name) {
  const header = request.headers.get("cookie") ?? "";
  for (const pair of header.split(";")) {
    const [key, ...value] = pair.trim().split("=");
    if (key === name) return value.join("=");
  }
  return null;
}

async function readBody(request) {
  const type = request.headers.get("content-type") ?? "";
  if (!type.includes("application/json")) return null;
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export function createRouteHandlers({ endpointMap, authProvider, config }) {
  const cookieName = config?.session?.cookieName ?? DEFAULT_COOKIE_NAME;
  const maxAge = config?.session?.maxAgeSeconds ?? DEFAULT_MAX_AGE_SECONDS;
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";

  async function handle(request, { params: routeParams }) {
    const { path } = await routeParams;
    const match = findEndpoint(endpointMap, request.method, path);
    if (!match) {
      return Response.json({ code: "NOT_FOUND", error: "No such endpoint" }, { status: 404 });
    }
    const { endpoint, params } = match;
    const headers = new Headers();

    try {
      const session = await authProvider.restoreSession(readCookie(request, cookieName));

      if (endpoint.access === "private" && !session) {
        return Response.json(
          { code: "UNAUTHORIZED", error: "Authentication required" },
          { status: 401 }
        );
      }
      if (endpoint.roles && !endpoint.roles.includes(session?.data?.role)) {
        return Response.json(
          { code: "FORBIDDEN", error: "Not allowed for this role" },
          { status: 403 }
        );
      }

      const auth = {
        session,
        async startSession(token, data) {
          const created = await authProvider.startSession(token, data);
          headers.append(
            "Set-Cookie",
            `${cookieName}=${created.token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge}${secure}`
          );
          return created;
        },
        async endSession() {
          if (session) await authProvider.endSession(session.token);
          headers.append("Set-Cookie", `${cookieName}=; HttpOnly; Path=/; Max-Age=0`);
        },
      };

      const ctx = {
        body: await readBody(request),
        query: Object.fromEntries(new URL(request.url).searchParams),
        params,
        auth,
      };
      const result = await endpoint.handler(ctx);
      return Response.json(result ?? null, { headers });
    } catch (err) {
      // Only errors a service threw on purpose are shown to the client.
      if (err instanceof DomainError) {
        const custom = endpoint.errors?.[err.code];
        const status = custom?.code ?? DEFAULT_ERROR_STATUS[err.code];
        if (status) {
          return Response.json(
            { code: err.code, error: custom?.message ?? err.message },
            { status, headers }
          );
        }
      }
      console.error(err);
      return Response.json({ error: "Internal Server Error" }, { status: 500 });
    }
  }

  return { GET: handle, POST: handle, PUT: handle, PATCH: handle, DELETE: handle };
}
