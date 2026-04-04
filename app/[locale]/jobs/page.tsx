import { notFound } from "next/navigation";
import { JobStatusBadge } from "@/components/job-status-badge";
import { SiteHeader } from "@/components/site-header";
import { listRecentIngestionJobs } from "@/lib/ingestion/jobs";
import { listRecentJobRuns } from "@/lib/jobs";
import { getDictionary, isLocale, type Locale } from "@/lib/i18n";

export const revalidate = 30;

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function JobsPage({ params }: PageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const currentLocale = locale as Locale;
  const dictionary = getDictionary(currentLocale);
  const [jobs, ingestionJobs] = await Promise.all([listRecentJobRuns(), listRecentIngestionJobs()]);
  const formatStatus = (status: string) => {
    if (currentLocale !== "zh-CN") {
      return status;
    }

    const normalized = status.toLowerCase();

    if (normalized === "success") {
      return "成功";
    }

    if (normalized === "failed") {
      return "失败";
    }

    if (normalized === "running") {
      return "进行中";
    }

    return status;
  };
  const copy = {
    title: currentLocale === "zh-CN" ? "后端任务中心" : "Backend job center",
    intro:
      currentLocale === "zh-CN"
        ? "这里展示由后端调度器执行的采集、排行构建和集合聚合作业。页面本身不再触发抓取。"
        : "Track ingestion, ranking, and collection aggregation jobs executed by the backend scheduler. This page no longer triggers collection from the browser.",
    pipeline: currentLocale === "zh-CN" ? "流程作业" : "Pipeline runs",
    ingestion: currentLocale === "zh-CN" ? "采集作业" : "Ingestion runs",
  };

  return (
    <main className="subpage-shell">
      <SiteHeader locale={currentLocale} />
      <section className="subpage-hero">
        <p className="eyebrow">{dictionary.sections.jobs}</p>
        <h1>{copy.title}</h1>
        <p>{copy.intro}</p>
      </section>

      <section className="content-stack">
        <article className="content-card">
          <div className="deck__header">
            <div>
              <p className="eyebrow">{copy.pipeline}</p>
              <h2>{copy.pipeline}</h2>
            </div>
          </div>
          <div className="job-table">
            {jobs.length ? (
              jobs.map((job) => (
                <div key={job.id} className="job-row">
                  <div className="job-row__top">
                    <strong>{job.jobType}</strong>
                    <JobStatusBadge status={formatStatus(job.status)} />
                  </div>
                  <span>{job.triggeredBy}</span>
                  <span>{job.startedAt.toISOString()}</span>
                  <span>{job.finishedAt?.toISOString() ?? "--"}</span>
                  <span>{job.message ?? "--"}</span>
                  <pre className="job-row__stats">{JSON.stringify(JSON.parse(job.statsJson), null, 2)}</pre>
                </div>
              ))
            ) : (
              <p>{dictionary.misc.noData}</p>
            )}
          </div>
        </article>

        <article className="content-card">
          <div className="deck__header">
            <div>
              <p className="eyebrow">{copy.ingestion}</p>
              <h2>{copy.ingestion}</h2>
            </div>
          </div>
          <div className="job-table">
            {ingestionJobs.length ? (
              ingestionJobs.map((job) => (
                <div key={`ingestion-${job.id}`} className="job-row">
                  <div className="job-row__top">
                    <strong>{job.jobType}</strong>
                    <JobStatusBadge status={formatStatus(job.status)} />
                  </div>
                  <span>{job.triggeredBy}</span>
                  <span>{job.startedAt.toISOString()}</span>
                  <span>{job.finishedAt?.toISOString() ?? "--"}</span>
                  <span>{job.errorMessage ?? job.scope ?? "--"}</span>
                  <pre className="job-row__stats">{JSON.stringify({ stats: JSON.parse(job.statsJson), tasks: job.tasks }, null, 2)}</pre>
                </div>
              ))
            ) : (
              <p>{dictionary.misc.noData}</p>
            )}
          </div>
        </article>
      </section>
    </main>
  );
}
