import {
  createSubscription,
  listRecentDeliveryJobs,
  listSubscriptions,
  unsubscribeSubscription,
  updateSubscriptionState,
} from "@/lib/subscriptions";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const manageToken = searchParams.get("manageToken");
  const email = searchParams.get("email");
  const includeDisabled = searchParams.get("includeDisabled") === "true";

  return Response.json({
    items: await listSubscriptions({
      manageToken,
      email,
      includeDisabled,
    }),
    deliveries: await listRecentDeliveryJobs({
      manageToken,
    }),
  });
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    email?: string | null;
    locale?: string;
    channel?: string;
    channelTarget?: string | null;
    subscriptionType?: string;
    digestFrequency?: string;
    keywords?: string[];
    repositoryId?: number | null;
    collectionId?: number | null;
    notifyOnNewRepos?: boolean;
  };

  const created = await createSubscription(body);
  const items = await listSubscriptions({
    email: body.email ?? null,
    includeDisabled: true,
    limit: 10,
  });
  const current = items.find((item) => item.id === created.id) ?? null;

  return Response.json({
    id: created.id,
    manageToken: current?.subscriber?.manageToken ?? null,
    verificationToken: current?.subscriber?.verificationToken ?? null,
    verificationStatus: current?.verificationStatus ?? created.verificationStatus,
  });
}

export async function PATCH(request: Request) {
  const body = (await request.json()) as {
    subscriptionId: number;
    action?: "toggle" | "unsubscribe";
    enabled?: boolean;
    digestFrequency?: string;
    notifyOnNewRepos?: boolean;
  };

  if (body.action === "unsubscribe") {
    await unsubscribeSubscription(body.subscriptionId);
  } else {
    await updateSubscriptionState({
      subscriptionId: body.subscriptionId,
      enabled: body.enabled,
      digestFrequency: body.digestFrequency,
      notifyOnNewRepos: body.notifyOnNewRepos,
    });
  }

  return Response.json({
    ok: true,
  });
}
