import { assignCollectionEditor, reviewCollectionSubmission } from "@/lib/collection-submissions";

type Context = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: Request, context: Context) {
  const { id } = await context.params;
  const body = (await request.json()) as
    | {
        action: "approve" | "reject";
        moderationNotes?: string | null;
        reviewedBy?: string | null;
      }
    | {
        action: "assign-editor";
        collectionId: number;
        name: string;
        email?: string | null;
        role?: string;
      };

  if (body.action === "assign-editor") {
    const editor = await assignCollectionEditor({
      collectionId: body.collectionId,
      name: body.name,
      email: body.email ?? null,
      role: body.role,
    });

    return Response.json({
      ok: true,
      editorId: editor.id,
    });
  }

  const updated = await reviewCollectionSubmission({
    submissionId: Number(id),
    action: body.action,
    moderationNotes: body.moderationNotes ?? null,
    reviewedBy: body.reviewedBy ?? null,
  });

  if (!updated) {
    return Response.json({ ok: false }, { status: 404 });
  }

  return Response.json({
    ok: true,
    status: updated.status,
  });
}
