"use client";

import type { Dictionary } from "@/lib/i18n";
import type { RepositoryDetailPayload } from "@/lib/dashboard-types";
import { formatCompactNumber } from "@/components/dashboard-visuals";

function formatHours(value: number | null) {
  if (value === null) {
    return "--";
  }

  if (value >= 24) {
    return `${(value / 24).toFixed(1)}d`;
  }

  return `${value.toFixed(1)}h`;
}

export function RepositoryDrawer({
  detail,
  dictionary,
  onClose,
}: {
  detail: RepositoryDetailPayload | null;
  dictionary: Dictionary;
  onClose: () => void;
}) {
  return (
    <aside className={`drawer${detail ? " is-open" : ""}`}>
      <div className="drawer__backdrop" onClick={onClose} />
      <div className="drawer__panel">
        {detail ? (
          <>
            <div className="drawer__top">
              <div>
                <p className="eyebrow">{dictionary.sections.detail}</p>
                <h2 className="drawer__title">{detail.fullName}</h2>
                <p className="drawer__subtitle">{detail.description ?? dictionary.detail.noReadme}</p>
              </div>
              <button className="ghost-button" type="button" onClick={onClose}>
                {dictionary.actions.close}
              </button>
            </div>

            <section className="drawer__section">
              <div className="drawer__stats">
                <article>
                  <span>{dictionary.table.columns.totalStars}</span>
                  <strong>{formatCompactNumber(detail.stars)}</strong>
                </article>
                <article>
                  <span>{dictionary.table.columns.forks}</span>
                  <strong>{formatCompactNumber(detail.forks)}</strong>
                </article>
                <article>
                  <span>{dictionary.table.columns.health}</span>
                  <strong>{detail.health.score}</strong>
                </article>
              </div>
            </section>

            <section className="drawer__section">
              <h3>{dictionary.sections.health}</h3>
              <div className="drawer__metrics">
                <div>
                  <span>{dictionary.detail.issueResponse}</span>
                  <strong>{formatHours(detail.health.issueResponseHours)}</strong>
                </div>
                <div>
                  <span>{dictionary.detail.mergeRate}</span>
                  <strong>{detail.health.prMergeRate === null ? "--" : `${detail.health.prMergeRate}%`}</strong>
                </div>
                <div>
                  <span>{dictionary.detail.recentPush}</span>
                  <strong>{detail.health.recentPushDays === null ? "--" : `${detail.health.recentPushDays}d`}</strong>
                </div>
              </div>
            </section>

            <section className="drawer__section">
              <h3>{dictionary.detail.readme}</h3>
              <p>{detail.readmeSummary ?? dictionary.detail.noReadme}</p>
            </section>

            <section className="drawer__section">
              <h3>{dictionary.detail.contributors}</h3>
              <div className="contributors">
                {detail.contributors.map((contributor) => (
                  <a key={contributor.login} href={contributor.htmlUrl} target="_blank" rel="noreferrer" className="contributors__item">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={contributor.avatarUrl} alt={contributor.login} />
                    <span>{contributor.login}</span>
                    <strong>{contributor.contributions}</strong>
                  </a>
                ))}
              </div>
            </section>

            <section className="drawer__section">
              <h3>{dictionary.sections.history}</h3>
              <div className="history-list">
                {detail.rankings.map((ranking) => (
                  <div key={`${detail.fullName}-${ranking.weekKey}`} className="history-list__row">
                    <span>{ranking.weekKey}</span>
                    <strong>#{ranking.rank}</strong>
                    <span>+{ranking.starDelta7d}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="drawer__section">
              <h3>{dictionary.sections.recommendations}</h3>
              <div className="recommendations">
                {detail.recommendations.map((item) => (
                  <a key={item.fullName} href={item.htmlUrl} target="_blank" rel="noreferrer" className="recommendations__item">
                    <span>{item.fullName}</span>
                    <strong>+{item.weeklyStars}</strong>
                  </a>
                ))}
              </div>
            </section>
          </>
        ) : (
          <div className="drawer__empty">{dictionary.misc.noDetail}</div>
        )}
      </div>
    </aside>
  );
}
