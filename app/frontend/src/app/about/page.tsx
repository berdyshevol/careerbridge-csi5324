import PageTitle from "@/components/PageTitle";

// The team, its roles and the deliverables live on the team website the course asks for; this
// page only says what the application is and points there.
const TEAM_WEBSITE = "https://reaganbaylor.github.io/careerbridge-csi5324-hub/";

export default function AboutPage() {
  return (
    <section className="card border border-base-300 bg-base-100">
      <div className="card-body gap-4">
        <PageTitle eyebrow="CSI 5324 Software Engineering" subtitle="Recruiting and Application Management System">
          CareerBridge
        </PageTitle>
        <p>
          CareerBridge is the semester project of team CareerBridge at Baylor University, Fall 2026: a
          job board where organizations post jobs, applicants apply and recruiters move each
          application to a decision.
        </p>
        <p>
          The team, its roles and the project documents are on the{" "}
          <a href={TEAM_WEBSITE} className="link link-primary" target="_blank" rel="noreferrer">
            team website
          </a>
          .
        </p>
      </div>
    </section>
  );
}
