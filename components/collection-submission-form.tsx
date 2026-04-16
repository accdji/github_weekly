"use client";

import { useState } from "react";

export function CollectionSubmissionForm(props: {
  locale: "en" | "zh-CN";
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [repositories, setRepositories] = useState("");
  const [submitterName, setSubmitterName] = useState("");
  const [submitterEmail, setSubmitterEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const isZh = props.locale === "zh-CN";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");

    try {
      const response = await fetch("/api/collections/submissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          description,
          tags: tags.split(",").map((item) => item.trim()).filter(Boolean),
          repositoryNames: repositories.split(",").map((item) => item.trim()).filter(Boolean),
          submitterName,
          submitterEmail,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit collection");
      }

      setStatus("success");
      setName("");
      setDescription("");
      setTags("");
      setRepositories("");
      setSubmitterName("");
      setSubmitterEmail("");
    } catch (error) {
      console.error(error);
      setStatus("error");
    }
  }

  return (
    <form className="content-card" onSubmit={handleSubmit}>
      <div className="deck__header">
        <div>
          <p className="eyebrow">{isZh ? "公开提交" : "Public submission"}</p>
          <h2>{isZh ? "提交一个新集合" : "Submit a new collection"}</h2>
        </div>
      </div>
      <div className="content-list">
        <label className="field">
          <span>{isZh ? "集合名称" : "Collection name"}</span>
          <input value={name} onChange={(event) => setName(event.target.value)} required />
        </label>
        <label className="field">
          <span>{isZh ? "描述" : "Description"}</span>
          <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={4} required />
        </label>
        <label className="field">
          <span>{isZh ? "标签（逗号分隔）" : "Tags (comma-separated)"}</span>
          <input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="AI, Infra, OSS" />
        </label>
        <label className="field">
          <span>{isZh ? "仓库全名（逗号分隔）" : "Repository full names (comma-separated)"}</span>
          <input value={repositories} onChange={(event) => setRepositories(event.target.value)} placeholder="openai/openai-cookbook, vercel/next.js" />
        </label>
        <label className="field">
          <span>{isZh ? "提交人" : "Submitter"}</span>
          <input value={submitterName} onChange={(event) => setSubmitterName(event.target.value)} />
        </label>
        <label className="field">
          <span>{isZh ? "邮箱" : "Email"}</span>
          <input type="email" value={submitterEmail} onChange={(event) => setSubmitterEmail(event.target.value)} required />
        </label>
        <button type="submit" className="primary-button" disabled={status === "loading"}>
          {status === "loading" ? (isZh ? "提交中..." : "Submitting...") : isZh ? "提交审核" : "Submit for review"}
        </button>
        <p className="muted">
          {status === "success"
            ? isZh
              ? "已提交到审核工作台。"
              : "Submitted to the review workspace."
            : status === "error"
              ? isZh
                ? "提交失败，请稍后重试。"
                : "Submission failed. Please try again."
              : isZh
                ? "审核通过后会自动创建集合并把你加入协作编辑列表。"
                : "Approved submissions create the collection automatically and add you to the editor workspace."}
        </p>
      </div>
    </form>
  );
}
