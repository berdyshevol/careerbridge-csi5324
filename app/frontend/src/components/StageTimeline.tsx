import { formatDate, formatDateTime, type InterviewSummary, type StatusHistoryEntry } from "@/lib/api";

export default function StageTimeline({
  entries,
  interviews = [],
}: {
  entries: StatusHistoryEntry[];
  interviews?: InterviewSummary[];
}) {
  return (
    <ol className="flex flex-col">
      {entries.map((entry, index) => {
        const isLast = index === entries.length - 1;
        const stageInterviews = entry.status === "Interview" ? interviews : [];
        return (
          <li key={`${entry.status}-${entry.date}-${index}`} className="relative pl-8 pb-4 last:pb-0">
            {!isLast && (
              <span
                aria-hidden="true"
                className="absolute top-5 bottom-0 left-2.5 w-0.5 bg-base-300"
              />
            )}
            <span
              aria-hidden="true"
              className={`absolute top-0.5 left-0 size-5 rounded-full border-2 ${
                isLast ? "border-accent bg-warning" : "border-primary bg-primary"
              }`}
            />
            <div className="flex flex-col gap-0.5">
              <p className="font-semibold">{entry.status}</p>
              <p className="text-sm text-muted">{formatDate(entry.date)}</p>
              {stageInterviews.map((interview) => (
                <p key={interview.interviewId} className="mt-1 text-sm">
                  Interview {formatDateTime(interview.scheduledTime)} · {interview.format},{" "}
                  {interview.location}
                </p>
              ))}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

