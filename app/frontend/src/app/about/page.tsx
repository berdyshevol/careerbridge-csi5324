import PageTitle from "@/components/PageTitle";

const links = [
  { label: "Group repository", href: "https://github.com/berdyshevol/careerbridge-csi5324" },
  {
    label: "Jira board",
    href: "https://careerbridge-csi5324.atlassian.net/jira/software/projects/SCRUM/boards/1",
  },
];

const members = [
  {
    name: "Zeba Tusnia Towshi",
    role: "Project Manager",
    useCases: "UC-11 Create Job Posting, UC-12 Approve Job Posting",
  },
  {
    name: "Rabeya Nazara",
    role: "Requirements Engineer",
    useCases: "UC-05 Track Application Status, UC-07 Respond to Job Offer",
  },
  { name: "Josh Job Joseph", role: "Design Engineer", useCases: "UC-04 Apply for Job" },
  {
    name: "Reagan Rubio",
    role: "Quality Assurance Engineer",
    useCases: "UC-08 Register Recruiter and Organization",
  },
  {
    name: "Oleg Berdyshev",
    role: "Project Librarian",
    useCases:
      "UC-01 Browse Job Postings, UC-02 Register as Applicant, UC-03 Maintain Profile and Resume",
  },
];

export default function AboutPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageTitle
        eyebrow="CSI 5324 Software Engineering I"
        subtitle="Recruiting and Application Management System"
      >
        Career Bridge
      </PageTitle>

      <section className="card border border-base-300 bg-base-100" aria-labelledby="links-heading">
        <div className="card-body">
          <h2 id="links-heading" className="font-display text-xl font-semibold">
            Project links
          </h2>
          <ul className="flex flex-col gap-2">
            {links.map(({ label, href }) => (
              <li key={href}>
                <a href={href} className="link" target="_blank" rel="noreferrer">
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="card border border-base-300 bg-base-100" aria-labelledby="team-heading">
        <div className="card-body">
          <h2 id="team-heading" className="font-display text-xl font-semibold">
            Team
          </h2>
          <ul className="divide-y divide-base-300">
            {members.map(({ name, role, useCases }) => (
              <li key={name} className="py-3">
                <p className="font-semibold">{name}</p>
                <p className="text-muted">{role}</p>
                <p>{useCases}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
