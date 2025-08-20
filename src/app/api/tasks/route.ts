// Use the standard Request type for route handlers
import { z } from "zod";
import { createTask, listTasks } from "@/lib/tasks";

export async function GET() {
  const tasks = await listTasks();
  return Response.json({ tasks });
}

const CreateBody = z.object({ title: z.string().min(1) });

export async function POST(request: Request) {
  const json = await request.json().catch(() => ({}));
  const parsed = CreateBody.safeParse(json);
  if (!parsed.success) {
    return new Response("Invalid body", { status: 400 });
  }
  const task = await createTask(parsed.data.title);
  return Response.json({ task }, { status: 201 });
}


