export async function POST() {
  return Response.json(
    {
      error: "Manual collection via the web UI has been disabled. Use backend jobs or CLI scripts instead.",
    },
    { status: 410 },
  );
}
