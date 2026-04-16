"use client";

import { useState } from "react";

export function RepositorySubscribeForm(props: {
  repositoryId: number;
  fullName: string;
  locale: "en" | "zh-CN";
}) {
  const [email, setEmail] = useState("");
  const [frequency, setFrequency] = useState("weekly");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const isZh = props.locale === "zh-CN";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");

    try {
      const response = await fetch("/api/subscriptions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim() || null,
          locale: props.locale,
          digestFrequency: frequency,
          repositoryId: props.repositoryId,
          subscriptionType: "repository",
        }),
      });

      if (!response.ok) {
        throw new Error("Repository subscription request failed");
      }

      setStatus("success");
      setEmail("");
    } catch (error) {
      console.error(error);
      setStatus("error");
    }
  }

  return (
    <form className="collection-subscribe-card" onSubmit={handleSubmit}>
      <div className="collection-subscribe-card__top">
        <div>
          <p className="eyebrow">{isZh ? "仓库订阅" : "Follow repository"}</p>
          <h2>{props.fullName}</h2>
        </div>
      </div>

      <p className="muted">
        {isZh
          ? "保存仓库级订阅后，worker 会把摘要和最近变化投递到站内收件箱或外部渠道。"
          : "Save a repository-level follow so the worker can deliver digests and recent changes to your inbox or webhook channel."}
      </p>

      <div className="collections-toolbar">
        <label className="field field--search">
          <span>{isZh ? "邮箱（可选）" : "Email (optional)"}</span>
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" />
        </label>
        <label className="field">
          <span>{isZh ? "频率" : "Frequency"}</span>
          <select value={frequency} onChange={(event) => setFrequency(event.target.value)}>
            <option value="weekly">{isZh ? "每周" : "Weekly"}</option>
            <option value="monthly">{isZh ? "每月" : "Monthly"}</option>
          </select>
        </label>
        <button type="submit" className="primary-button" disabled={status === "loading"}>
          {status === "loading" ? (isZh ? "提交中..." : "Saving...") : isZh ? "订阅这个仓库" : "Subscribe to this repository"}
        </button>
      </div>

      <p className="collection-subscribe-card__status">
        {status === "success"
          ? isZh
            ? "仓库订阅已保存。"
            : "Repository subscription saved."
          : status === "error"
            ? isZh
              ? "保存失败，请稍后重试。"
              : "Failed to save repository subscription."
            : isZh
              ? "不填邮箱时，摘要会先进入站内 outbox。"
              : "Leave the email empty to start with the in-app outbox only."}
      </p>
    </form>
  );
}
