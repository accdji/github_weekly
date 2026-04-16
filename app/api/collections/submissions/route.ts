import {
  createCollectionSubmission,
  listCollectionSubmissions,
  listCollectionWorkspaces,
} from "@/lib/collection-submissions";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") ?? undefined;

  return Response.json({
    items: await listCollectionSubmissions(status),
    workspaces: await listCollectionWorkspaces(),
  });
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    name: string;
    description: string;
    tags?: string[];
    repositoryNames?: string[];
    submitterName?: string | null;
    submitterEmail: string;
    coverImage?: string | null;
  };

  const created = await createCollectionSubmission({
    name: body.name,
    description: body.description,
    tags: body.tags ?? [],
    repositoryNames: body.repositoryNames ?? [],
    submitterName: body.submitterName ?? null,
    submitterEmail: body.submitterEmail,
    coverImage: body.coverImage ?? null,
  });

  return Response.json({
    id: created.id,
    status: created.status,
  });
}
