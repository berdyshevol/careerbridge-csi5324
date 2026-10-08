import Link from "next/link";
import ApplicationRow from "@/components/ApplicationRow";
import BackendDown from "@/components/BackendDown";
import EmptyState from "@/components/EmptyState";
import OfferPanel from "@/components/OfferPanel";
import PageTitle from "@/components/PageTitle";
import Placeholder from "@/components/Placeholder";
import PostingCard from "@/components/PostingCard";
import SlotMeter from "@/components/SlotMeter";
import { StageBadge, StageProgress } from "@/components/StageBadge";
import { formatDate, type JobPosting } from "@/lib/api";
import { APPLICATION_LIMIT, STAGES, applications, offer } from "@/lib/sampleDesk";

// The live catalogue of the blocks a screen is built from (ADR-0004, rule 6).
// Every block here is the real component, so this page cannot drift from the
// screens. Under each block: the component or the classes to use.

const samplePosting: JobPosting = {
  jobPostId: 3,
  title: applications[1].title,
  description: "",
  jobRequirements: "",
  location: applications[1].location,
  employmentType: applications[1].employmentType,
  salaryRange: null,
  numberOfOpenings: 1,
  datePosted: "2026-10-01",
  applicationDeadline: "2026-12-31",
  postStatus: "PUBLISHED",
  organization: { organizationId: 1, name: applications[1].organizationName },
};

const colors = [
  ["base-100", "bg-base-100", "Cards and panels"],
  ["base-200", "bg-base-200", "The page ground; muted chips"],
  ["base-300", "bg-base-300", "Borders; empty segments"],
  ["primary", "bg-primary", "The main action; filled segments; links"],
  ["secondary", "bg-secondary", "Selected navigation; stage chips"],
  ["accent", "bg-accent", "Reserved"],
  ["warning", "bg-warning", "Messages; the offer panel"],
  ["error", "bg-error", "Errors"],
  ["neutral", "bg-neutral", "The button on the offer panel"],
];

function Block({ title, use, children }: { title: string; use: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="font-semibold">{title}</h3>
      <div className="min-w-0">{children}</div>
      <p className="text-sm text-muted">
        Use: <code className="rounded bg-base-200 px-1.5 py-0.5">{use}</code>
      </p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card border border-base-300 bg-base-100">
      <div className="card-body gap-6">
        <h2 className="font-display text-xl font-semibold">{title}</h2>
        {children}
      </div>
    </section>
  );
}

export default function StyleguidePage() {
  return (
    <div className="flex flex-col gap-5">
      <PageTitle subtitle="Every block a screen may use, drawn by the real component. Copy the component or the classes under it; do not draw your own.">
        Style guide
      </PageTitle>

      <Section title="Theme">
        <Block title="Colors" use="daisyUI color names only, never a hex value in a page">
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {colors.map(([name, className, role]) => (
              <li key={name} className="flex items-center gap-3">
                <span className={`size-10 shrink-0 rounded-lg border border-base-300 ${className}`} />
                <span>
                  <code className="text-sm">{name}</code>
                  <span className="block text-sm text-muted">{role}</span>
                </span>
              </li>
            ))}
          </ul>
        </Block>
        <Block title="Type" use="font-display for titles (Bricolage Grotesque); the default face for everything else (Figtree); text-muted for secondary text">
          <p className="font-display text-3xl font-semibold">A title in the display face</p>
          <p>Body text in the default face, for everything that is read.</p>
          <p className="text-muted">Secondary text, in text-muted.</p>
          <p className="text-sm font-semibold uppercase tracking-wider text-muted">An eyebrow label</p>
        </Block>
      </Section>

      <Section title="Page">
        <Block title="Page title" use="<PageTitle eyebrow? subtitle?>…</PageTitle> — one per screen">
          <PageTitle eyebrow="An eyebrow" subtitle="A line under the title.">
            The title of the screen
          </PageTitle>
        </Block>
        <Block title="Content card" use='<article className="card border border-base-300 bg-base-100"><div className="card-body gap-5">…</div></article>'>
          <article className="card border border-base-300 bg-base-100">
            <div className="card-body gap-5">
              <p>The main content of a screen sits in one card like this.</p>
            </div>
          </article>
        </Block>
        <Block title="Side panel" use='<section className="flex flex-col gap-3 rounded-2xl border border-base-300 bg-base-100 p-5">…</section> — in an aside, lg:w-80'>
          <section className="flex flex-col gap-3 rounded-2xl border border-base-300 bg-base-100 p-5 lg:w-80">
            <h2 className="font-semibold">A side panel</h2>
            <p className="text-muted">Supporting information next to the main card.</p>
          </section>
        </Block>
      </Section>

      <Section title="Actions">
        <Block title="Buttons" use='btn btn-primary for the one main action; btn for the way back; disabled until the screen allows the action'>
          <div className="flex flex-wrap gap-3">
            <button type="button" className="btn btn-primary">
              Main action
            </button>
            <button type="button" className="btn">
              Cancel
            </button>
            <button type="button" className="btn btn-primary" disabled>
              Not yet allowed
            </button>
            <button type="button" className="btn btn-neutral">
              On a warning panel
            </button>
          </div>
        </Block>
        <Block title="Links" use="link link-primary; add font-semibold no-underline hover:underline for a link that acts like a small action">
          <div className="flex flex-wrap gap-5">
            <Link href="/styleguide" className="link link-primary">
              A link in text
            </Link>
            <Link href="/styleguide" className="link link-primary font-semibold no-underline hover:underline">
              Replace resume
            </Link>
          </div>
        </Block>
      </Section>

      <Section title="Status">
        <Block title="Stage badge" use="<StageBadge stage={…} /> — stages come from STAGES in src/lib/sampleDesk.ts">
          <div className="flex flex-wrap gap-3">
            {STAGES.map((stage) => (
              <StageBadge key={stage} stage={stage} />
            ))}
          </div>
        </Block>
        <Block title="Stage progress" use="<StageProgress stage={…} />">
          <div className="flex flex-col gap-3 md:w-40">
            {STAGES.map((stage) => (
              <StageProgress key={stage} stage={stage} />
            ))}
          </div>
        </Block>
        <Block title="Slot meter" use="<SlotMeter used={…} total={APPLICATION_LIMIT} caption? />">
          <div className="grid gap-3 md:grid-cols-3">
            <SlotMeter used={0} total={APPLICATION_LIMIT} />
            <SlotMeter used={3} total={APPLICATION_LIMIT} caption="With a caption." />
            <SlotMeter used={5} total={APPLICATION_LIMIT} />
          </div>
        </Block>
      </Section>

      <Section title="Blocks">
        <Block title="Posting card" use="<PostingCard posting={…} /> — in a ul with grid gap-3 md:grid-cols-2">
          <ul className="grid gap-3 md:grid-cols-2">
            <PostingCard posting={samplePosting} />
          </ul>
        </Block>
        <Block title="Application row" use="<ApplicationRow application={…} /> — in a ul with flex flex-col gap-3">
          <ul className="flex flex-col gap-3">
            {applications.map((application) => (
              <ApplicationRow key={application.applicationId} application={application} />
            ))}
          </ul>
        </Block>
        <Block title="Offer panel" use="<OfferPanel title organizationName respondBy /> — the only warning-colored panel on a screen">
          <div className="lg:w-80">
            <OfferPanel
              title={offer.title}
              organizationName={offer.organizationName}
              respondBy={formatDate(offer.expirationDate)}
            />
          </div>
        </Block>
        <Block title="Messages" use='<div role="status" className="alert alert-warning">…</div>; alert-info for a note, alert-error only for a failure'>
          <div className="flex flex-col gap-3">
            <div role="status" className="alert alert-info">
              <span>A note the reader should see.</span>
            </div>
            <div role="status" className="alert alert-warning">
              <span>
                Why something cannot go ahead, and the way out:{" "}
                <Link href="/styleguide" className="link">
                  a link
                </Link>
                .
              </span>
            </div>
            <div role="alert" className="alert alert-error">
              <span>Something failed and what to do about it.</span>
            </div>
          </div>
        </Block>
        <Block title="Empty state" use="<EmptyState action?>…</EmptyState>">
          <EmptyState action={{ href: "/jobs", label: "See all open jobs" }}>
            No applications yet.
          </EmptyState>
        </Block>
        <Block title="Backend not answering" use="<BackendDown /> — when a fetch in src/lib/api.ts throws">
          <BackendDown />
        </Block>
        <Block title="Placeholder" use='<Placeholder useCase="UC-nn …" owner="…" /> — only until the screen exists'>
          <Placeholder useCase="UC-00 An example" owner="the owner" />
        </Block>
      </Section>

      <Section title="Forms">
        <Block title="Text input" use='<input className="input w-full" /> with a label; sr-only label when the placeholder says it all'>
          <div className="flex flex-col gap-2 md:w-80">
            <label htmlFor="sg-name" className="font-medium">
              Organization
            </label>
            <input id="sg-name" type="text" className="input w-full" placeholder="Legal name" />
          </div>
        </Block>
        <Block title="Checkbox" use='<input type="checkbox" className="checkbox checkbox-primary" /> inside a label with the text'>
          <label className="flex cursor-pointer items-start gap-3">
            <input type="checkbox" className="checkbox checkbox-primary mt-0.5" />
            <span>I understand what this means.</span>
          </label>
        </Block>
        <Block title="A form" use="fields, then a border-t, then Cancel (btn) and the main action (btn btn-primary) aligned right on wide screens">
          <form className="flex flex-col gap-4" onSubmit={undefined}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label htmlFor="sg-title" className="font-medium">
                  Title
                </label>
                <input id="sg-title" type="text" className="input w-full" />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="sg-deadline" className="font-medium">
                  Application deadline
                </label>
                <input id="sg-deadline" type="date" className="input w-full" />
              </div>
            </div>
            <div className="flex flex-col-reverse gap-3 border-t border-base-300 pt-4 sm:flex-row sm:justify-end">
              <button type="button" className="btn">
                Cancel
              </button>
              <button type="button" className="btn btn-primary">
                Submit
              </button>
            </div>
          </form>
        </Block>
      </Section>

      <p className="text-sm text-muted">
        Check every block at phone, tablet and laptop width (ADR-0004).
      </p>
    </div>
  );
}
