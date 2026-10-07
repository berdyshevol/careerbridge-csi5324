import { createRouteHandlers } from "@/framework/nextAdapter";
import endpointMap from "@/endpoints";
import authProvider from "@/auth";

// The whole API is assembled here from configuration. To add an endpoint,
// edit src/endpoints/, not this file.
export const { GET, POST, PUT, PATCH, DELETE } = createRouteHandlers({
  endpointMap,
  authProvider,
  config: { session: {} },
});
