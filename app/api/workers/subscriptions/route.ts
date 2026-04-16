import { runSubscriptionWorker } from "@/lib/workers";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    frequency?: "weekly" | "monthly";
    triggeredBy?: string;
  };

  const result = await runSubscriptionWorker({
    frequency: body.frequency ?? "weekly",
    triggeredBy: body.triggeredBy ?? "api",
  });

  return Response.json({
    ok: true,
    ...result,
  });
}
