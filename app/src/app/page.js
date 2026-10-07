import Link from "next/link";

const screens = [
  { href: "/jobs", useCase: "UC-01 Browse Job Postings", owner: "Oleg" },
  { href: "/register", useCase: "UC-02 Register as Applicant", owner: "Oleg" },
  { href: "/jobs/1/apply", useCase: "UC-04 Apply for Job", owner: "Josh" },
  { href: "/applications", useCase: "UC-05 Track Application Status", owner: "Rabeya" },
  { href: "/recruiter/register", useCase: "UC-08 Register Recruiter and Organization", owner: "Reagan" },
  { href: "/recruiter/postings/new", useCase: "UC-11 Create Job Posting", owner: "Zeba" },
];

export default function Home() {
  return (
    <section>
      <h1>CareerBridge</h1>
      <p className="muted">Recruiting and Application Management System</p>
      <ul className="card-list">
        {screens.map((screen) => (
          <li key={screen.href} className="card">
            <h2>
              <Link href={screen.href}>{screen.useCase}</Link>
            </h2>
            <p className="muted">Owner: {screen.owner}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
