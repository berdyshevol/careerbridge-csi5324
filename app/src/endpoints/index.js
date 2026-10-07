import domain from "@/services";
import { createAuthEndpoints } from "./auth";
import { createJobEndpoints } from "./jobs";

// namespace -> endpoints. "jobs" is served under /api/jobs/...
const endpointMap = {
  jobs: createJobEndpoints(domain),
  auth: createAuthEndpoints(domain),
};

export default endpointMap;
