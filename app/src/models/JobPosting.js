// Job Posting from the domain model (documentation, section 5).
export class JobPosting {
  constructor({
    jobPostId,
    title,
    organizationName,
    description,
    jobRequirements,
    location,
    employmentType,
    salaryRange,
    numberOfOpenings,
    datePosted,
    applicationDeadline,
    postStatus,
  }) {
    this.jobPostId = jobPostId;
    this.title = title;
    this.organizationName = organizationName;
    this.description = description;
    this.jobRequirements = jobRequirements;
    this.location = location;
    this.employmentType = employmentType;
    this.salaryRange = salaryRange || null;
    this.numberOfOpenings = Number(numberOfOpenings);
    this.datePosted = datePosted;
    this.applicationDeadline = applicationDeadline;
    this.postStatus = postStatus;
  }

  isOpen() {
    return this.postStatus === "Open";
  }
}
