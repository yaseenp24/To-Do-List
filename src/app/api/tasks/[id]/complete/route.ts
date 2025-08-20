// Use the standard Request type for route handlers
import { completeTask } from "@/lib/tasks";

export async function POST(req: Request) {
  const url = new URL(req.url);
  const match = url.pathname.match(/\/api\/tasks\/([^/]+)\/complete$/);
  const id = match?.[1];
  if (!id) return new Response("Invalid path", { status: 400 });
  const updated = await completeTask(id);
  if (!updated) return new Response("Not found", { status: 404 });
  return Response.json({ task: updated });
}


