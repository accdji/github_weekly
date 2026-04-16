import { verifySubscriber } from "@/lib/subscriptions";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return Response.json({ ok: false, message: "Missing token." }, { status: 400 });
  }

  const subscriber = await verifySubscriber(token);

  if (!subscriber) {
    return Response.json({ ok: false, message: "Invalid token." }, { status: 404 });
  }

  return Response.json({
    ok: true,
    email: subscriber.email,
    verifiedAt: subscriber.verifiedAt?.toISOString() ?? null,
  });
}
