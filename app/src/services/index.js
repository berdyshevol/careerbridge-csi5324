import repositories from "@/repositories";
import createJobPostingService from "./jobPostingService";

const deps = { repositories };

// Every service, built with its dependencies. Endpoints and pages use this.
const domain = {
  jobs: createJobPostingService(deps),
};

export default domain;
