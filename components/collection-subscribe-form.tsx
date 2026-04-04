"use client";

import { useState } from "react";

export function CollectionSubscribeForm(props: {
  collectionId: number;
  collectionName: string;
  locale: "en" | "zh-CN";
  initialCount: number;
}) {
  const [email, setEmail] = useState("");
  const [frequency, setFrequency] = useState("weekly");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [count, setCount] = useState(props.initialCount);
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
          collectionId: props.collectionId,
        }),
      });

      if (!response.ok) {
        throw new Error("Subscription request failed");
      }

      setStatus("success");
      setCount((current) => current + 1);
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
          <p className="eyebrow">{isZh ? "订阅集合" : "Follow collection"}</p>
          <h2>{props.collectionName}</h2>
        </div>
        <span className="code-pill">{count}</span>
      </div>

      <p className="muted">
        {isZh
          ? "订阅后，后续可以接收集合新收录仓库提醒，以及每周或每月摘要。"
          : "Subscribe now to prepare for new-entry alerts and future weekly or monthly digests."}
      </p>

      <div className="collections-toolbar">
        <label className="field field--search">
          <span>{isZh ? "邮箱（可选）" : "Email (optional)"}</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="name@example.com"
          />
        </label>
        <label className="field">
          <span>{isZh ? "频率" : "Frequency"}</span>
          <select value={frequency} onChange={(event) => setFrequency(event.target.value)}>
            <option value="weekly">{isZh ? "每周" : "Weekly"}</option>
            <option value="monthly">{isZh ? "每月" : "Monthly"}</option>
          </select>
        </label>
        <button type="submit" className="primary-button" disabled={status === "loading"}>
          {status === "loading" ? (isZh ? "订阅中..." : "Subscribing...") : isZh ? "订阅这个集合" : "Subscribe to this collection"}
        </button>
      </div>

      <p className="collection-subscribe-card__status">
        {status === "success"
          ? isZh
            ? "订阅已保存。"
            : "Subscription saved."
          : status === "error"
            ? isZh
              ? "订阅失败，请稍后重试。"
              : "Subscription failed. Please try again."
            : isZh
              ? "可以先留空邮箱，仅通过站内提醒接收更新。"
              : "Leave the email empty if you want to start with in-app alerts only."}
      </p>
    </form>
  );
}
