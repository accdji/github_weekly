import { createSubscription, listSubscriptions } from "@/lib/subscriptions";

export async function GET() {
  return Response.json({
    items: await listSubscriptions(),
  });
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    email?: string | null;
    locale?: string;
    channel?: string;
    subscriptionType?: string;
    digestFrequency?: string;
    keywords?: string[];
    repositoryId?: number | null;
    collectionId?: number | null;
  };

  const created = await createSubscription(body);

  return Response.json({
    id: created.id,
  });
}
