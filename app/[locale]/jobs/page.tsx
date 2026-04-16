import { notFound } from "next/navigation";
import { JobStatusBadge } from "@/components/job-status-badge";
import { SiteHeader } from "@/components/site-header";
import { listRecentIngestionJobs } from "@/lib/ingestion/jobs";
import { listRecentJobRuns } from "@/lib/jobs";
import { getDictionary, isLocale, type Locale } from "@/lib/i18n";
import { listRecentWorkerRuns } from "@/lib/workers";

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
  const [jobs, ingestionJobs, workerRuns] = await Promise.all([
    listRecentJobRuns(),
    listRecentIngestionJobs(),
    listRecentWorkerRuns(),
  ]);

  return (
    <main className="subpage-shell">
      <SiteHeader locale={currentLocale} />
      <section className="subpage-hero">
        <p className="eyebrow">{dictionary.sections.jobs}</p>
        <h1>{currentLocale === "zh-CN" ? "后端任务中心" : "Backend job center"}</h1>
        <p>
          {currentLocale === "zh-CN"
            ? "现在除了采集和排行任务，这里也会显示订阅 digest worker 的执行记录。"
            : "In addition to ingestion and ranking jobs, this page now surfaces the dedicated subscription digest worker."}
        </p>
      </section>

      <section className="content-stack">
        <article className="content-card">
          <div className="deck__header">
            <div>
              <p className="eyebrow">{currentLocale === "zh-CN" ? "Worker" : "Worker"}</p>
              <h2>{currentLocale === "zh-CN" ? "订阅 digest worker" : "Subscription digest worker"}</h2>
            </div>
          </div>
          <div className="job-table">
            {workerRuns.length ? (
              workerRuns.map((job) => (
                <div key={`worker-${job.id}`} className="job-row">
                  <div className="job-row__top">
                    <strong>{job.workerType}</strong>
                    <JobStatusBadge status={job.status} />
                  </div>
                  <span>{job.triggeredBy}</span>
                  <span>{job.startedAt}</span>
                  <span>{job.finishedAt ?? "--"}</span>
                  <span>{job.message ?? "--"}</span>
                  <pre className="job-row__stats">{JSON.stringify(job.stats, null, 2)}</pre>
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
              <p className="eyebrow">{currentLocale === "zh-CN" ? "Pipeline" : "Pipeline"}</p>
              <h2>{currentLocale === "zh-CN" ? "流程作业" : "Pipeline runs"}</h2>
            </div>
          </div>
          <div className="job-table">
            {jobs.length ? (
              jobs.map((job) => (
                <div key={job.id} className="job-row">
                  <div className="job-row__top">
                    <strong>{job.jobType}</strong>
                    <JobStatusBadge status={job.status} />
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
              <p className="eyebrow">{currentLocale === "zh-CN" ? "采集" : "Ingestion"}</p>
              <h2>{currentLocale === "zh-CN" ? "采集作业" : "Ingestion runs"}</h2>
            </div>
          </div>
          <div className="job-table">
            {ingestionJobs.length ? (
              ingestionJobs.map((job) => (
                <div key={`ingestion-${job.id}`} className="job-row">
                  <div className="job-row__top">
                    <strong>{job.jobType}</strong>
                    <JobStatusBadge status={job.status} />
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
