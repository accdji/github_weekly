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
  const [channel, setChannel] = useState("in_app");
  const [channelTarget, setChannelTarget] = useState("");
  const [notifyOnNewRepos, setNotifyOnNewRepos] = useState(true);
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
          channel,
          channelTarget: channelTarget.trim() || null,
          collectionId: props.collectionId,
          notifyOnNewRepos,
        }),
      });

      if (!response.ok) {
        throw new Error("Subscription request failed");
      }

      setStatus("success");
      setCount((current) => current + 1);
      setEmail("");
      setChannelTarget("");
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
          ? "现在可以把集合订阅到站内 outbox、邮件，或者企业微信 / 飞书 / 自定义 Webhook。"
          : "You can now route collection digests to the in-app outbox, email, or WeCom / Feishu / custom webhooks."}
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
        <label className="field">
          <span>{isZh ? "渠道" : "Channel"}</span>
          <select value={channel} onChange={(event) => setChannel(event.target.value)}>
            <option value="in_app">{isZh ? "站内" : "In-app"}</option>
            <option value="email">{isZh ? "邮件" : "Email"}</option>
            <option value="wecom_webhook">{isZh ? "企业微信 Webhook" : "WeCom webhook"}</option>
            <option value="feishu_webhook">{isZh ? "飞书 Webhook" : "Feishu webhook"}</option>
            <option value="webhook">{isZh ? "自定义 Webhook" : "Custom webhook"}</option>
          </select>
        </label>
        {(channel === "wecom_webhook" || channel === "feishu_webhook" || channel === "webhook") && (
          <label className="field field--search">
            <span>{isZh ? "Webhook 地址" : "Webhook URL"}</span>
            <input
              value={channelTarget}
              onChange={(event) => setChannelTarget(event.target.value)}
              placeholder="https://example.com/hook"
            />
          </label>
        )}
        <label className="field">
          <span>{isZh ? "新仓库提醒" : "New repo alerts"}</span>
          <select
            value={notifyOnNewRepos ? "yes" : "no"}
            onChange={(event) => setNotifyOnNewRepos(event.target.value === "yes")}
          >
            <option value="yes">{isZh ? "开启" : "Enabled"}</option>
            <option value="no">{isZh ? "关闭" : "Disabled"}</option>
          </select>
        </label>
        <button type="submit" className="primary-button" disabled={status === "loading"}>
          {status === "loading"
            ? isZh
              ? "提交中..."
              : "Subscribing..."
            : isZh
              ? "订阅这个集合"
              : "Subscribe to this collection"}
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
              ? "不填邮箱时会先投递到站内 outbox；邮件渠道可通过验证链接激活。"
              : "Leave the email empty to start with the in-app outbox; email channels can be activated with the verification link."}
      </p>
    </form>
  );
}
