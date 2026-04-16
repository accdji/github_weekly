"use client";

import { useState } from "react";

type Submission = {
  id: number;
  name: string;
  description: string;
  tags: string[];
  repositoryNames: string[];
  submitterName: string | null;
  submitterEmail: string;
  status: string;
  moderationNotes: string | null;
};

type Workspace = {
  id: number;
  slug: string;
  name: string;
  description: string;
  tags: string[];
  editors: Array<{
    id: number;
    name: string;
    email: string | null;
    role: string;
    status: string;
  }>;
};

export function CollectionReviewPanel(props: {
  locale: "en" | "zh-CN";
  submissions: Submission[];
  workspaces: Workspace[];
}) {
  const [submissions, setSubmissions] = useState(props.submissions);
  const [workspaces, setWorkspaces] = useState(props.workspaces);
  const [assignName, setAssignName] = useState<Record<number, string>>({});
  const [assignEmail, setAssignEmail] = useState<Record<number, string>>({});
  const isZh = props.locale === "zh-CN";

  async function review(submissionId: number, action: "approve" | "reject") {
    await fetch(`/api/collections/submissions/${submissionId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action,
        reviewedBy: "workspace-admin",
      }),
    });

    setSubmissions((current) =>
      current.map((item) => (item.id === submissionId ? { ...item, status: action === "approve" ? "approved" : "rejected" } : item)),
    );
  }

  async function assignEditor(collectionId: number) {
    const name = assignName[collectionId]?.trim();
    if (!name) {
      return;
    }

    await fetch(`/api/collections/submissions/0`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "assign-editor",
        collectionId,
        name,
        email: assignEmail[collectionId] ?? null,
        role: "editor",
      }),
    });

    setWorkspaces((current) =>
      current.map((workspace) =>
        workspace.id === collectionId
          ? {
              ...workspace,
              editors: [
                ...workspace.editors,
                {
                  id: Date.now(),
                  name,
                  email: assignEmail[collectionId] ?? null,
                  role: "editor",
                  status: "active",
                },
              ],
            }
          : workspace,
      ),
    );
    setAssignName((current) => ({ ...current, [collectionId]: "" }));
    setAssignEmail((current) => ({ ...current, [collectionId]: "" }));
  }

  return (
    <div className="content-stack">
      <article className="content-card">
        <div className="deck__header">
          <div>
            <p className="eyebrow">{isZh ? "审核工作台" : "Review workspace"}</p>
            <h2>{isZh ? "社区提交审核" : "Community submission review"}</h2>
          </div>
        </div>
        <div className="content-list">
          {submissions.length ? (
            submissions.map((item) => (
              <div key={item.id} className="job-row">
                <div className="job-row__top">
                  <strong>{item.name}</strong>
                  <span className={`job-status ${item.status === "approved" ? "job-status--success" : item.status === "rejected" ? "job-status--failed" : "job-status--running"}`}>
                    {item.status}
                  </span>
                </div>
                <span>{item.submitterName ?? item.submitterEmail}</span>
                <span>{item.description}</span>
                <span>{item.tags.join(", ") || "--"}</span>
                <span>{item.repositoryNames.join(", ") || "--"}</span>
                {item.status === "pending" ? (
                  <div className="row-actions">
                    <button type="button" className="icon-button" onClick={() => void review(item.id, "approve")}>
                      {isZh ? "通过" : "Approve"}
                    </button>
                    <button type="button" className="icon-button" onClick={() => void review(item.id, "reject")}>
                      {isZh ? "拒绝" : "Reject"}
                    </button>
                  </div>
                ) : null}
              </div>
            ))
          ) : (
            <p>{isZh ? "还没有待审核提交。" : "No pending submissions."}</p>
          )}
        </div>
      </article>

      <article className="content-card">
        <div className="deck__header">
          <div>
            <p className="eyebrow">{isZh ? "策展工作流" : "Curation workflow"}</p>
            <h2>{isZh ? "多编辑协作空间" : "Multi-editor workspace"}</h2>
          </div>
        </div>
        <div className="content-list">
          {workspaces.map((workspace) => (
            <div key={workspace.id} className="job-row">
              <div className="job-row__top">
                <strong>{workspace.name}</strong>
                <span className="job-status job-status--success">{workspace.slug}</span>
              </div>
              <span>{workspace.description}</span>
              <span>{workspace.tags.join(", ") || "--"}</span>
              <span>{workspace.editors.map((editor) => `${editor.name} (${editor.role})`).join(", ") || "--"}</span>
              <div className="collections-toolbar">
                <label className="field">
                  <span>{isZh ? "新增编辑" : "Add editor"}</span>
                  <input value={assignName[workspace.id] ?? ""} onChange={(event) => setAssignName((current) => ({ ...current, [workspace.id]: event.target.value }))} />
                </label>
                <label className="field">
                  <span>{isZh ? "邮箱" : "Email"}</span>
                  <input value={assignEmail[workspace.id] ?? ""} onChange={(event) => setAssignEmail((current) => ({ ...current, [workspace.id]: event.target.value }))} />
                </label>
                <button type="button" className="secondary-button" onClick={() => void assignEditor(workspace.id)}>
                  {isZh ? "加入协作" : "Assign editor"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </article>
    </div>
  );
}
