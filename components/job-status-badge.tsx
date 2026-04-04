export function JobStatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const className =
    normalized === "success"
      ? "job-status job-status--success"
      : normalized === "failed"
        ? "job-status job-status--failed"
        : "job-status job-status--running";

  return <span className={className}>{status}</span>;
}
