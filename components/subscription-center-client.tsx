"use client";

import { useMemo, useState } from "react";

type SubscriptionItem = {
  id: number;
  channel: string;
  verificationStatus: string;
  digestFrequency: string;
  enabled: boolean;
  notifyOnNewRepos: boolean;
  email: string | null;
  keywords: string[];
  repository: { fullName: string } | null;
  collection: { name: string; description: string } | null;
  subscriber: { verificationToken: string; manageToken: string } | null;
  deliveryJobs: Array<{
    id: number;
    status: string;
    subject: string;
    sentAt: string | null;
  }>;
};

type DeliveryJob = {
  id: number;
  channel: string;
  status: string;
  subject: string;
  createdAt: string;
  sentAt: string | null;
  logs: Array<{
    id: number;
    level: string;
    message: string;
  }>;
};

export function SubscriptionCenterClient(props: {
  locale: "en" | "zh-CN";
  items: SubscriptionItem[];
  deliveries: DeliveryJob[];
}) {
  const [items, setItems] = useState(props.items);
  const [deliveries, setDeliveries] = useState(props.deliveries);
  const [runningWorker, setRunningWorker] = useState(false);
  const isZh = props.locale === "zh-CN";

  const verifyLinks = useMemo(
    () =>
      items
        .map((item) => item.subscriber?.verificationToken)
        .filter((item): item is string => Boolean(item))
        .slice(0, 1),
    [items],
  );

  async function patchSubscription(subscriptionId: number, body: Record<string, unknown>) {
    await fetch("/api/subscriptions", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        subscriptionId,
        ...body,
      }),
    });

    setItems((current) =>
      current.map((item) =>
        item.id === subscriptionId
          ? {
              ...item,
              ...(typeof body.enabled === "boolean" ? { enabled: body.enabled as boolean } : {}),
              ...(typeof body.notifyOnNewRepos === "boolean"
                ? { notifyOnNewRepos: body.notifyOnNewRepos as boolean }
                : {}),
              ...(typeof body.digestFrequency === "string"
                ? { digestFrequency: body.digestFrequency as string }
                : {}),
            }
          : item,
      ),
    );
  }

  async function runWorker() {
    setRunningWorker(true);

    try {
      await fetch("/api/workers/subscriptions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ frequency: "weekly" }),
      });

      const refreshed = await fetch("/api/subscriptions");
      const payload = (await refreshed.json()) as { items: SubscriptionItem[]; deliveries: DeliveryJob[] };
      setItems(payload.items);
      setDeliveries(payload.deliveries);
    } finally {
      setRunningWorker(false);
    }
  }

  return (
    <div className="content-stack">
      <article className="content-card">
        <div className="deck__header">
          <div>
            <p className="eyebrow">{isZh ? "订阅管理动作" : "Subscription actions"}</p>
            <h2>{isZh ? "管理与投递" : "Manage and deliver"}</h2>
          </div>
          <button type="button" className="secondary-button" onClick={() => void runWorker()} disabled={runningWorker}>
            {runningWorker ? (isZh ? "运行中..." : "Running...") : isZh ? "运行 digest worker" : "Run digest worker"}
          </button>
        </div>
        {verifyLinks.length ? (
          <div className="content-list">
            {verifyLinks.map((token) => (
              <a key={token} className="secondary-button" href={`/api/subscriptions/verify?token=${token}`}>
                {isZh ? "验证邮箱渠道" : "Verify email channel"}
              </a>
            ))}
          </div>
        ) : null}
      </article>

      <article className="content-card">
        <div className="deck__header">
          <div>
            <p className="eyebrow">{isZh ? "我的订阅" : "Your subscriptions"}</p>
            <h2>{isZh ? "启停、频率与退订" : "Toggle, frequency, and unsubscribe"}</h2>
          </div>
        </div>
        <div className="content-list">
          {items.length ? (
            items.map((item) => (
              <div key={item.id} className="job-row">
                <div className="job-row__top">
                  <strong>{item.collection?.name ?? item.repository?.fullName ?? (item.keywords.join(", ") || "Subscription")}</strong>
                  <span className={`job-status ${item.enabled ? "job-status--success" : "job-status--failed"}`}>
                    {item.enabled ? "enabled" : "disabled"}
                  </span>
                </div>
                <span>{item.channel}</span>
                <span>{item.verificationStatus}</span>
                <div className="row-actions">
                  <button type="button" className="icon-button" onClick={() => void patchSubscription(item.id, { enabled: !item.enabled })}>
                    {item.enabled ? (isZh ? "暂停" : "Pause") : isZh ? "启用" : "Enable"}
                  </button>
                  <button
                    type="button"
                    className="icon-button"
                    onClick={() =>
                      void patchSubscription(item.id, {
                        digestFrequency: item.digestFrequency === "weekly" ? "monthly" : "weekly",
                      })
                    }
                  >
                    {item.digestFrequency === "weekly" ? (isZh ? "改成每月" : "Switch to monthly") : isZh ? "改成每周" : "Switch to weekly"}
                  </button>
                  <button
                    type="button"
                    className="icon-button"
                    onClick={() =>
                      void patchSubscription(item.id, {
                        notifyOnNewRepos: !item.notifyOnNewRepos,
                      })
                    }
                  >
                    {item.notifyOnNewRepos ? (isZh ? "关闭新仓库提醒" : "Disable new-repo alerts") : isZh ? "开启新仓库提醒" : "Enable new-repo alerts"}
                  </button>
                  <button type="button" className="icon-button" onClick={() => void patchSubscription(item.id, { action: "unsubscribe", enabled: false })}>
                    {isZh ? "退订" : "Unsubscribe"}
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p>{isZh ? "还没有订阅。" : "No subscriptions yet."}</p>
          )}
        </div>
      </article>

      <article className="content-card">
        <div className="deck__header">
          <div>
            <p className="eyebrow">{isZh ? "投递记录" : "Delivery outbox"}</p>
            <h2>{isZh ? "最近 digest 日志" : "Recent digest logs"}</h2>
          </div>
        </div>
        <div className="content-list">
          {deliveries.length ? (
            deliveries.map((delivery) => (
              <div key={delivery.id} className="job-row">
                <div className="job-row__top">
                  <strong>{delivery.subject}</strong>
                  <span className={`job-status ${delivery.status === "delivered" ? "job-status--success" : delivery.status === "failed" ? "job-status--failed" : "job-status--running"}`}>
                    {delivery.status}
                  </span>
                </div>
                <span>{delivery.channel}</span>
                <span>{delivery.sentAt ?? delivery.createdAt}</span>
                <span>{delivery.logs.map((log) => `${log.level}: ${log.message}`).join(" | ") || "--"}</span>
              </div>
            ))
          ) : (
            <p>{isZh ? "还没有投递记录。" : "No deliveries yet."}</p>
          )}
        </div>
      </article>
    </div>
  );
}
